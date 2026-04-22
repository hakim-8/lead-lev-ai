import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// We create a server-side Supabase client with the service role key to bypass RLS for cleanup
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  // Optional: Check for a secret token in headers to protect the endpoint
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data, error, count } = await supabaseAdmin
      .from("chat_messages")
      .delete({ count: 'exact' })
      .lt("created_at", fortyEightHoursAgo);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Deleted ${count || 0} messages older than 48 hours.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
