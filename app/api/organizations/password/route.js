import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY, // Use service role on the server for secure operations
);

const SECRET_KEY_HEX = process.env.CUSTOM_ENCRYPTION_KEY;

// Helper to encrypt
function encryptText(plainText) {
  const secretKey = Buffer.from(SECRET_KEY_HEX, "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secretKey, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

// Helper to decrypt
function decryptText(encryptedString) {
  try {
    const [ivHex, authTagHex, ciphertextHex] = encryptedString.split(":");
    const secretKey = Buffer.from(SECRET_KEY_HEX, "hex");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", secretKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    return null;
  }
}

// 1. Fetch all email configurations for the organization
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");

  if (!orgId)
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("org_id", orgId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const configs = [];
  for (let i = 1; i <= 5; i++) {
    if (data?.[`username_${i}`]) {
      configs.push({
        index: i,
        username: data[`username_${i}`],
        host: data[`host_${i}`],
        port: data[`port_${i}`],
        hasPassword: !!data[`password_${i}`],
      });
    }
  }

  // Handle case where only the old singular password exists
  const hasLegacyPassword = !!data?.password && !data?.password_1 && configs.length === 0;

  return NextResponse.json({ 
    configs,
    hasLegacyPassword
  });
}

// 2. Add a new Email Configuration (Systematic Filling)
export async function POST(request) {
  try {
    const { orgId, username, password, host, port } = await request.json();
    if (!orgId || !username || !password || !host || !port)
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 },
      );

    // Fetch current data to find first empty slot
    const { data: org, error: fetchError } = await supabase
      .from("organizations")
      .select("*")
      .eq("org_id", orgId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    let slotFound = -1;
    for (let i = 1; i <= 5; i++) {
      if (!org[`username_${i}`]) {
        slotFound = i;
        break;
      }
    }

    if (slotFound === -1) {
      return NextResponse.json(
        { error: "Maximum number of emails reached (5)" },
        { status: 400 },
      );
    }

    const encrypted = encryptText(password);
    const updateData = {};
    updateData[`username_${slotFound}`] = username;
    updateData[`password_${slotFound}`] = encrypted;
    updateData[`host_${slotFound}`] = host;
    updateData[`port_${slotFound}`] = parseInt(port);

    // If it's the first slot we're also migrating or cleaning up the old column if it was there
    if (slotFound === 1 && org.password) {
        updateData.password = null; 
    }

    const { error: updateError } = await supabase
      .from("organizations")
      .update(updateData)
      .eq("org_id", orgId);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ success: true, slot: slotFound });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. Authenticate Old Password and Update to New Password for a specific slot
export async function PUT(request) {
  try {
    const { orgId, index, oldPassword, newPassword, action = "update" } = await request.json();
    
    if (!orgId || !index || !oldPassword) {
      return NextResponse.json(
        { error: "Missing properties" },
        { status: 400 },
      );
    }

    const passwordCol = `password_${index}`;
    
    // Fetch existing encrypted password string
    const { data, error } = await supabase
      .from("organizations")
      .select(passwordCol)
      .eq("org_id", orgId)
      .single();

    if (error || !data?.[passwordCol]) {
      return NextResponse.json(
        { error: "Credential record not found for this slot" },
        { status: 404 },
      );
    }

    // Decrypt challenge
    const existingDecrypted = decryptText(data[passwordCol]);
    if (oldPassword !== existingDecrypted) {
      return NextResponse.json(
        { error: "The old password you entered is incorrect" },
        { status: 401 },
      );
    }

    if (action === "verify") {
      return NextResponse.json({ success: true, message: "Old password verified" });
    }

    if (!newPassword) {
      return NextResponse.json({ error: "Missing new password" }, { status: 400 });
    }

    if (newPassword === oldPassword) {
      return NextResponse.json(
        { error: "New password must be different from old password" },
        { status: 400 },
      );
    }

    // All checks pass -> Re-encrypt new password and save
    const updatedEncryptedString = encryptText(newPassword);
    const updateBody = {};
    updateBody[passwordCol] = updatedEncryptedString;

    const { error: updateError } = await supabase
      .from("organizations")
      .update(updateBody)
      .eq("org_id", orgId);

    if (updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 4. Authenticate Password and Remove Email Configuration for a specific slot
export async function DELETE(request) {
  try {
    const { orgId, index, password } = await request.json();
    if (!orgId || !index || !password) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const passwordCol = `password_${index}`;

    const { data, error } = await supabase
      .from("organizations")
      .select(passwordCol)
      .eq("org_id", orgId)
      .single();

    if (error || !data?.[passwordCol]) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

    const decrypted = decryptText(data[passwordCol]);
    if (password !== decrypted) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const updateData = {};
    updateData[`username_${index}`] = null;
    updateData[`password_${index}`] = null;
    updateData[`host_${index}`] = null;
    updateData[`port_${index}`] = null;
    updateData[`emails_sent_in_the_day_${index}`] = null;

    const { error: deleteError } = await supabase
      .from("organizations")
      .update(updateData)
      .eq("org_id", orgId);

    if (deleteError) throw new Error(deleteError.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
