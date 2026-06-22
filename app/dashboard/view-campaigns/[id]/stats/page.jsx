"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrganization, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaSpinner,
  FaPause,
  FaChartLine,
  FaEnvelope,
  FaReply,
  FaDatabase,
  FaPaperPlane,
  FaBolt,
  FaCheckCircle,
  FaStopCircle,
  FaLock,
} from "react-icons/fa";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default function CampaignStatsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { organization } = useOrganization();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);
  const [replies, setReplies] = useState([]);
  const [creatorUser, setCreatorUser] = useState(null);
  const [launcherUser, setLauncherUser] = useState(null);

  // Modal State
  const [showStopModal, setShowStopModal] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  useEffect(() => {
    if (organization?.id || user?.id) {
      fetchData();
    }
  }, [organization?.id, user?.id, id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from("email_campaigns")
        .select("*")
        .eq("id", id)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // 2. Fetch Table basic info
      if (campaignData?.table_id) {
        const { data: tableData, error: tableError } = await supabase
          .from("lead_tables")
          .select("id, table_name, number_of_leads")
          .eq("id", campaignData.table_id)
          .single();
        if (!tableError && tableData) setTableInfo(tableData);
      }

      // Fetch users for creator and launcher
      if (campaignData?.creator_user_id) {
        const { data: cUser } = await supabase
          .from("users")
          .select("first_name, last_name")
          .eq("clerk_id", campaignData.creator_user_id)
          .single();
        if (cUser) setCreatorUser(`${cUser.first_name} ${cUser.last_name}`);
      }

      if (campaignData?.launcher_user_id) {
        const { data: lUser } = await supabase
          .from("users")
          .select("first_name, last_name")
          .eq("clerk_id", campaignData.launcher_user_id)
          .single();
        if (lUser) setLauncherUser(`${lUser.first_name} ${lUser.last_name}`);
      }

      // 3. Fetch Replies
      const { data: repliesData, error: repliesError } = await supabase
        .from("email_replies")
        .select("*")
        .eq("campaign_id", parseInt(id))
        .order("created_at", { ascending: false });

      if (!repliesError && repliesData) setReplies(repliesData);
    } catch (err) {
      console.error("Error fetching stats data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopCampaign = async () => {
    setShowStopModal(false);
    setIsStopping(true);
    try {
      const response = await fetch("/api/campaigns/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.id,
          tableId: campaign.table_id,
        }),
      });
      if (!response.ok) throw new Error("Failed to stop campaign");
      await fetchData(); // Refresh data to show Completed status and new end time
    } catch (err) {
      console.error(err);
      alert("Failed to stop campaign");
    } finally {
      setIsStopping(false);
    }
  };

  const stripTimestamp = (name) => {
    if (!name) return "";
    return name.replace(/ - \d{2}-\d{2}-\d{4} \d{2}:\d{2}$/, "");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 font-sans h-[60vh]">
        <FaSpinner className="animate-spin text-indigo-500" size={40} />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
          Aggregating Statistics...
        </p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-20 text-center font-sans">
        <h2 className="text-2xl font-bold text-slate-800">
          Campaign Not Found
        </h2>
        <button
          onClick={() => router.back()}
          className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (campaign.status !== "Ongoing" && campaign.status !== "Completed") {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-6 font-sans text-center h-[60vh]">
        <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center shadow-inner">
          <FaLock size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            Stats Locked
          </h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto">
            Statistics are only available for campaigns that are Ongoing or
            Completed.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/view-campaigns")}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm"
        >
          Return to Campaigns
        </button>
      </div>
    );
  }

  // Statistics Computations
  const emailsSent = campaign.emails_sent || 0;
  const coldEmailsSent = campaign.cold_emails_sent || 0;
  const totalReplies = campaign.replies || 0;
  const followUpEmailsSent = campaign.follow_up_emails_sent || 0;

  let replyRatio = 0;
  if (emailsSent > 0) {
    replyRatio = ((totalReplies / emailsSent) * 100).toFixed(1);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 font-sans pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all focus:outline-none"
          >
            <FaArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {stripTimestamp(campaign.name)}{" "}
              <span className="font-light text-slate-400">Reports</span>
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
              <p className="text-xs text-slate-500 font-medium">
                Live analytics for your ongoing outreach campaign.
              </p>
              {creatorUser && (
                <>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <p className="text-xs text-slate-500 font-bold">
                    Created by {creatorUser}
                  </p>
                </>
              )}
              {launcherUser && (
                <>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <p className="text-xs text-indigo-600 font-bold">
                    Launched by {launcherUser}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            <FaChartLine size={10} /> Active Monitoring
          </div>
          <button
            disabled={campaign.status === "Completed"}
            onClick={() => setShowStopModal(true)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs cursor-pointer font-black uppercase tracking-tight transition-colors shadow-sm border ${
              campaign.status === "Completed"
                ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                : "bg-red-50 text-red-600 hover:bg-red-100 border-red-100"
            }`}
          >
            <FaStopCircle size={14} /> Stop Campaign
          </button>
        </div>
      </div>

      {/* Leads Table Card */}
      {tableInfo && (
        <div
          onClick={() => {
            if (campaign.status !== "Completed") {
              router.push(`/dashboard/view-campaigns/${id}/stats/leads`);
            }
          }}
          className={`bg-white rounded-[2.5rem] p-8 border border-slate-200 flex items-center justify-between transition-all ${
            campaign.status === "Completed"
              ? "cursor-default opacity-80"
              : "cursor-pointer hover:border-indigo-200 hover:shadow-xl"
          }`}
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-50 text-indigo-500 rounded-2xl flex items-center justify-center">
              <FaDatabase size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Data Source Connected
              </p>
              <p className="text-lg font-bold text-slate-900 border-b border-transparent leading-none">
                {stripTimestamp(tableInfo.table_name)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-slate-900">
              {tableInfo.number_of_leads}
            </p>
            <p className="text-xs font-medium text-slate-500">Total Leads</p>
          </div>
        </div>
      )}

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-100 transition-colors">
          <div className="absolute -right-4 -bottom-4 text-slate-50 group-hover:text-indigo-50/50 transition-colors">
            <FaPaperPlane size={100} />
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
              <FaPaperPlane size={16} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Total Sent
            </p>
            <p className="text-4xl font-black text-slate-900">{emailsSent}</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-sky-100 transition-colors">
          <div className="absolute -right-4 -bottom-4 text-slate-50 group-hover:text-sky-50/50 transition-colors">
            <FaBolt size={100} />
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-6">
              <FaBolt size={16} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Cold Emails
            </p>
            <p className="text-4xl font-black text-slate-900">
              {coldEmailsSent}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-100 transition-colors">
          <div className="absolute -right-4 -bottom-4 text-slate-50 group-hover:text-emerald-50/50 transition-colors">
            <FaReply size={100} />
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <FaReply size={16} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Total Replies
            </p>
            <p className="text-4xl font-black text-slate-900">{totalReplies}</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 text-slate-800">
            <FaChartLine size={100} />
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center mb-6">
              <FaChartLine size={16} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Reply Ratio
            </p>
            <p className="text-4xl font-black text-white">{replyRatio}%</p>
          </div>
        </div>
      </div>

      {/* Additional Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-white pb-4">
            Campaign Dynamics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                Follow-up Emails
              </span>
              <span className="text-lg font-black text-slate-800">
                {followUpEmailsSent}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                Sequence Length
              </span>
              <span className="text-lg font-black text-slate-800">
                {campaign.follow_ups} Follow-ups
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                Delay Interval
              </span>
              <span className="text-lg font-black text-slate-800">
                {campaign.delay_hours} Hours
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                Start Time
              </span>
              <span className="text-sm font-black text-slate-800">
                {campaign.start_time
                  ? new Date(campaign.start_time).toLocaleString()
                  : "Not started"}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                End Time
              </span>
              <span className="text-sm font-black text-slate-800">
                {campaign.end_time
                  ? new Date(campaign.end_time).toLocaleString()
                  : "Ongoing"}
              </span>
            </div>
            {creatorUser && (
              <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                  Architect
                </span>
                <span className="text-sm border-b border-indigo-200 text-indigo-600 font-black">
                  {creatorUser}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
          <FaCheckCircle
            className="absolute -right-4 -top-4 text-white/10"
            size={150}
          />
          <h3 className="text-sm font-black uppercase tracking-widest text-indigo-200 mb-6 border-b border-indigo-500 pb-4 relative">
            Strategy Details
          </h3>
          <div className="space-y-6 relative">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-1">
                Tone Formulation
              </p>
              <p className="text-base font-black tracking-tight">
                {campaign.tone || "Friendly"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-1">
                Core Objective
              </p>
              <p className="text-sm font-medium leading-relaxed italic opacity-90">
                "{campaign.goal || "No specific goal set."}"
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-1">
                Primary Subject Line
              </p>
              <p className="text-sm font-bold bg-indigo-700/50 p-4 rounded-xl border border-indigo-500/50">
                {campaign.subject || "Automated outreach"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inbox view mapping */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Recent Replies
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Direct responses from prospects on this campaign.
            </p>
          </div>
          <div className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-tight">
            {replies.length} Received
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {replies.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaEnvelope className="text-slate-300" size={24} />
              </div>
              <p className="text-slate-500 font-bold mb-2">Inbox is quiet</p>
              <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto line-clamp-2">
                No replies have been recorded yet. Check back here once your
                campaign matures.
              </p>
            </div>
          ) : (
            replies.map((reply) => (
              <div
                key={reply.id}
                className="p-8 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold font-sans">
                      {reply.lead_name?.charAt(0) ||
                        reply.from_email?.charAt(0) ||
                        "U"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-none mb-1">
                        {reply.lead_name || "Unknown Lead"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {reply.from_email}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">
                    {new Date(
                      reply.date_time || reply.created_at,
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="pl-14">
                  <div className="p-5 bg-white border border-slate-200 rounded-[1.5rem] rounded-tl-sm text-sm text-slate-600 leading-relaxed max-h-[300px] overflow-y-auto w-full">
                    <span className="whitespace-pre-wrap font-medium">
                      {reply.email_content}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stop Campaign Modal */}
      <AnimatePresence>
        {showStopModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStopModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 overflow-hidden border border-slate-100 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaPause size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                Halt Campaign
              </h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                All prospects in the list will not be emailed again and this
                will stop the campaign immediately. This action is irreversible.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleStopCampaign}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  Yes, Stop Campaign
                </button>
                <button
                  onClick={() => setShowStopModal(false)}
                  className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Screen Loading Lock */}
      {isStopping && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <FaSpinner className="animate-spin text-white mb-4" size={50} />
          <h2 className="text-white text-xl font-bold tracking-tight mb-2">
            Halting Campaign Engine
          </h2>
          <p className="text-slate-300 text-sm font-medium max-w-sm text-center">
            Synchronizing database states and wiping targeted history... Please
            do not close or navigate away from this page.
          </p>
        </div>
      )}
    </div>
  );
}
