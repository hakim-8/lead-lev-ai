import { Webhook } from "svix";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createClerkClient } from "@clerk/backend";

// Initialize SDK clients
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
); // Must use Service Role to bypass RLS during webhook updates

// --- FAILSAFE UTILITY ---
// Helper function to handle async pauses to let concurrent threads settle
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET)
    return new Response("Missing webhook secret", { status: 500 });

  // 1. Extract Svix headers for signature verification
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const { type, data } = evt;

  // 2. Main Router Loop
  try {
    switch (type) {
      // --- ORGANIZATION EVENTS ---
      case "organization.created":
        await handleCreateOrganization(data);
        break;
      case "organization.updated":
        await handleUpdateOrganization(data);
        break;
      case "organization.deleted":
        await handleDeleteOrganization(data);
        break;

      // --- USER ACCOUNT EVENTS ---
      case "user.created":
      case "user.updated":
        await handleUpsertUserAccount(data);
        break;
      case "user.deleted":
        await handleDeleteUserAccount(data);
        break;

      // --- MEMBERSHIP ROLING & SEAT ENFORCEMENT ---
      case "organizationMembership.created":
        await handleCreateMembership(data);
        break;
      case "organizationMembership.updated":
        await handleUpdateMembership(data);
        break;
      case "organizationMembership.deleted":
        await handleDeleteMembership(data);
        break;

      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error(`Error processing event ${type}:`, error);
    return new Response("Internal Server Error processing webhook", {
      status: 500,
    });
  }
}

// =========================================================================
// INTERCEPT & ROUTING HANDLER FUNCTIONS
// =========================================================================

// Handles initial organization setup with built-in race condition handling
async function handleCreateOrganization(data) {
  const creatorId = data.created_by || null;

  // 1. Insert the new organization profile row
  const { error: orgError } = await supabase.from("organizations").insert({
    org_id: data.id,
    org_name: data.name,
    creator_user_id: creatorId,
    members: 1,
    credits: 0,
    subscription_type: "Free",
    subscription_status: "inactive",
    max_seats: 1,
    subscription_end: null,
  });

  if (orgError) throw orgError;

  // 2. If a creator exists, manage the user race condition check before mapping to memberships
  if (creatorId) {
    let userExists = false;
    let retries = 3;

    while (retries > 0 && !userExists) {
      const { data: userCheck } = await supabase
        .from("users")
        .select("clerk_id")
        .eq("clerk_id", creatorId)
        .maybeSingle();

      if (userCheck) {
        userExists = true;
      } else {
        retries--;
        console.log(
          `User row not found yet for ${creatorId}. Retrying in 500ms...`,
        );
        await delay(500);
      }
    }

    if (!userExists) {
      await supabase.from("users").insert({
        clerk_id: creatorId,
        email: "",
        first_name: "",
        last_name: "",
      });
    }

    // 3. Populate matching junction link in memberships table safely
    const cleanRole = "admin";
    const { error: memError } = await supabase.from("memberships").insert({
      member_id: `mem_creator_${data.id}`,
      user_id: creatorId,
      org_id: data.id,
      role: cleanRole,
    });

    if (memError) throw memError;
  }
}

// Handles updating an organization's changeable attributes safely
async function handleUpdateOrganization(data) {
  const { error } = await supabase
    .from("organizations")
    .update({
      org_name: data.name,
    })
    .eq("org_id", data.id);

  if (error) throw error;
}

// Handles removing an organization completely from the table
async function handleDeleteOrganization(data) {
  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("org_id", data.id);

  if (error) throw error;
}

// Enforces limits based on memberships counts and tracks user pairs in the memberships table
async function handleCreateMembership(data) {
  const orgId = data.organization.id;
  const userId = data.public_user_data.user_id;
  const rawRole = data.role;
  const membershipId = data.id;

  // 1. Pull the max seat threshold configured for this specific organization
  const { data: org } = await supabase
    .from("organizations")
    .select("max_seats")
    .eq("org_id", orgId)
    .single();

  const maxSeatsAllowed = org?.max_seats || 1;

  // 2. Compute how many users currently belong to this organization using the memberships table
  const { count } = await supabase
    .from("memberships")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId);

  // 3. SEAT CHECK BREAKOUT (Revoke Pattern)
  if (count >= maxSeatsAllowed) {
    console.warn(
      `Org ${orgId} hit seat ceiling (${maxSeatsAllowed}). Booting user ${userId}.`,
    );

    await clerkClient.organizations.deleteOrganizationMembership({
      organizationId: orgId,
      membershipId: membershipId,
    });
    return;
  }

  const cleanRole = rawRole.replace("org:", "");

  // 4. Add a matching tracking link row to your memberships table exclusively
  const { error: membershipError } = await supabase.from("memberships").insert({
    member_id: membershipId,
    user_id: userId,
    org_id: orgId,
    role: cleanRole,
  });

  if (membershipError) throw membershipError;
}

// Matches by user_id and org_id to modify authorization flags seamlessly
async function handleUpdateMembership(data) {
  const orgId = data.organization.id;
  const userId = data.public_user_data.user_id;
  const rawRole = data.role;
  const cleanRole = rawRole.replace("org:", "");

  // Update membership junction configuration exclusively
  const { error } = await supabase
    .from("memberships")
    .update({ role: cleanRole })
    .match({ user_id: userId, org_id: orgId });

  if (error) throw error;
}

// Drops row from memberships table entirely when connection link is revoked
async function handleDeleteMembership(data) {
  const orgId = data.organization.id;
  const userId = data.public_user_data.user_id;

  // Safely delete tracking link execution row from memberships table exclusively
  const { error } = await supabase
    .from("memberships")
    .delete()
    .match({ user_id: userId, org_id: orgId });

  if (error) throw error;
}

// Handles user account base configuration without stripping existing organization mapping details
async function handleUpsertUserAccount(data) {
  const primaryEmail = data.email_addresses?.find(
    (email) => email.id === data.primary_email_address_id,
  )?.email_address;

  const { error } = await supabase.from("users").upsert(
    {
      clerk_id: data.id,
      email: primaryEmail || "",
      first_name: data.first_name || "",
      last_name: data.last_name || "",
    },
    { onConflict: "clerk_id" },
  );

  if (error) throw error;
}

// Handles removing a user profile completely
async function handleDeleteUserAccount(data) {
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("clerk_id", data.id);
  if (error) throw error;
}
