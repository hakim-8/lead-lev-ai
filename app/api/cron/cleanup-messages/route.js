import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin with Service Role Key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

export async function GET(request) {
  // 1. Authenticate the Cron Job
  const authHeader = request.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedToken) {
    return new Response(
      JSON.stringify({ success: false, message: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    // 2. Calculate the 48-hour cutoff
    const fortyEightHoursAgo = new Date(
      Date.now() - 48 * 60 * 60 * 1000,
    ).toISOString();

    // 3. Perform Deletion
    const { error, count } = await supabaseAdmin
      .from("chat_messages")
      .delete({ count: "exact" })
      .lt("created_at", fortyEightHoursAgo);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Cleanup successful. Deleted ${count || 0} messages.`,
      deleted_before: fortyEightHoursAgo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron Cleanup Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
