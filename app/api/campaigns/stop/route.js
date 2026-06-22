import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
  try {
    const body = await req.json();
    const { campaignId, tableId } = body;

    if (!campaignId || !tableId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const currentUTC = new Date().toISOString();

    // 1. Update the campaign
    const { error: campaignError } = await supabase
      .from("email_campaigns")
      .update({
        status: "Completed",
        end_time: currentUTC,
        is_worker_running: false,
      })
      .eq("id", campaignId);

    if (campaignError) {
      console.error("Error updating campaign:", campaignError);
      return NextResponse.json(
        { error: "Failed to update campaign status" },
        { status: 500 },
      );
    }

    // 2. Wipe tracking data for related leads
    const { error: leadsError } = await supabase
      .from("leads")
      .update({
        emails_sent: 0,
        last_emailed_at: null,
        next_action_at: null,
        email_subject: null,
        last_email_id: null,
        campaign_id: null,
        status: "Not Mailed",
      })
      .eq("table_id", tableId);

    if (leadsError) {
      console.error("Error resetting leads:", leadsError);
      return NextResponse.json(
        { error: "Failed to wipe lead history targets" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API error during campaign stop:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
