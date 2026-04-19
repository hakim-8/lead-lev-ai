"use client";

import React, { useState, useEffect } from "react";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  FaList,
  FaRocket,
  FaEdit,
  FaChartBar,
  FaSpinner,
  FaCog,
  FaCalendarAlt,
  FaPaperPlane,
  FaBullseye,
  FaEnvelopeOpenText,
  FaCheck,
  FaPlus,
  FaMagic,
} from "react-icons/fa";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function ViewCampaignsPage() {
  const { organization } = useOrganization();
  const { user } = useUser();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Renaming state
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (organization?.id || user?.id) {
      fetchCampaigns();
    }
  }, [organization?.id, user?.id]);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    const orgId = organization?.id || user?.id;
    try {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (campaign) => {
    setEditingId(campaign.id);
    setNewName(stripTimestamp(campaign.campaign_name));
  };

  const handleRename = async (id, originalName) => {
    if (!newName.trim() || isUpdating) return;
    setIsUpdating(true);
    const orgId = organization?.id || user?.id;

    try {
      // Preserve timestamp
      const timestampMatch = originalName.match(
        / - \d{2}-\d{2}-\d{4} \d{2}:\d{2}$/,
      );
      const timestamp = timestampMatch ? timestampMatch[0] : "";
      const finalName = `${newName.trim()}${timestamp}`;

      // Uniqueness check
      const { data: existing } = await supabase
        .from("email_campaigns")
        .select("id, campaign_name")
        .eq("org_id", orgId)
        .neq("id", id);

      const isDuplicate = existing?.some(
        (c) =>
          stripTimestamp(c.campaign_name).toLowerCase() ===
          newName.trim().toLowerCase(),
      );

      if (isDuplicate) {
        alert("A campaign with this name already exists.");
        setIsUpdating(false);
        return;
      }

      const { error } = await supabase
        .from("email_campaigns")
        .update({ campaign_name: finalName })
        .eq("id", id);

      if (error) throw error;

      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, campaign_name: finalName } : c)),
      );
      setEditingId(null);
    } catch (err) {
      console.error("Error renaming campaign:", err);
      alert("Failed to rename campaign.");
    } finally {
      setIsUpdating(false);
    }
  };

  const stripTimestamp = (name) => {
    if (!name) return "";
    return name.replace(/ - \d{2}-\d{2}-\d{4} \d{2}:\d{2}$/, "");
  };

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === "ongoing") return "bg-blue-50 text-blue-600 border-blue-100";
    if (s === "completed")
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    return "bg-slate-50 text-slate-500 border-slate-100";
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
            Outreach Campaigns
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-sans">
            Track and manage your automated outreach sequences.
          </p>
        </div>
        <div className="flex items-center gap-3 font-sans">
          <button
            onClick={() => router.push("/dashboard/new-campaign")}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-sans"
          >
            <FaPlus /> Start New Campaign
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center space-y-4">
          <FaSpinner className="animate-spin text-indigo-500" size={40} />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest font-sans">
            Aggregating Analytics...
          </p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white p-20 rounded-[2.5rem] border border-slate-200 border-dashed flex flex-col items-center justify-center text-center font-sans">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6">
            <FaList size={30} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2 font-sans font-sans">
            No active campaigns
          </h2>
          <p className="text-slate-500 max-w-sm mb-8 italic font-sans">
            You haven't launched any sequences yet. Create a campaign to get
            started.
          </p>
          <button
            onClick={() => router.push("/dashboard/new-campaign")}
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all font-sans"
          >
            <FaPlus /> Create Your First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
          <AnimatePresence>
            {campaigns.map((campaign) => {
              const status = campaign.status || "Not Started";
              const isNotStarted = status === "Not Started";
              const isActive = status === "Ongoing" || status === "Completed";

              return (
                <motion.div
                  key={campaign.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2.5rem] border border-slate-200 p-8 hover:border-indigo-200 transition-all hover:shadow-2xl hover:shadow-indigo-50/50 flex flex-col group relative overflow-hidden font-sans"
                >
                  {/* Status Ribbon */}
                  <div className="absolute top-6 right-6 font-sans">
                    <span
                      className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${getStatusStyle(status)}`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-2xl flex items-center justify-center mb-6 transition-colors font-sans">
                    <FaPaperPlane size={20} />
                  </div>

                  {editingId === campaign.id ? (
                    <div className="space-y-3 mb-6 font-sans">
                      <input
                        autoFocus
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-4 py-2 border border-indigo-200 rounded-xl outline-none ring-4 ring-indigo-50 font-bold text-slate-900 text-sm font-sans"
                      />
                      <div className="flex gap-2 font-sans">
                        <button
                          onClick={() =>
                            handleRename(campaign.id, campaign.campaign_name)
                          }
                          disabled={isUpdating}
                          className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                        >
                          {isUpdating ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <>
                              <FaCheck size={10} /> Save
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs font-sans"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 font-sans">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1 font-sans">
                        {stripTimestamp(campaign.campaign_name)}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 font-sans">
                        <FaCalendarAlt size={10} /> Started{" "}
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4 mb-8 flex-1 font-sans">
                    <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 space-y-3">
                      <div className="flex items-start gap-3">
                        <FaEnvelopeOpenText
                          className="text-slate-400 mt-1 shrink-0"
                          size={14}
                        />
                        <div className="font-sans">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                            Subject Line
                          </p>
                          <p className="text-xs font-bold text-slate-600 line-clamp-2 leading-relaxed">
                            {campaign.subject || (
                              <span className="text-slate-300 italic">
                                Not set
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaBullseye
                          className="text-slate-400 mt-1 shrink-0"
                          size={14}
                        />
                        <div className="font-sans">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                            Campaign Goal
                          </p>
                          <p className="text-xs font-bold text-slate-600 line-clamp-1">
                            {campaign.goal || (
                              <span className="text-slate-300 italic">
                                Not set
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-sans">
                      <div className="p-3 px-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                          Follow-ups
                        </p>
                        <p className="text-sm font-black text-indigo-700">
                          {campaign.follow_ups}
                        </p>
                      </div>
                      <div className="p-3 px-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 font-sans">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">
                          Interval
                        </p>
                        <p className="text-sm font-black text-emerald-600">
                          {campaign.delay_hours}H
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-6 border-t border-slate-50 font-sans">
                    {/* TOP ROW: Configure/Active & Rename (Each takes 1 column) */}
                    <button
                      className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        isNotStarted
                          ? "bg-slate-900 text-white hover:bg-indigo-600 cursor-pointer"
                          : "bg-slate-100 text-slate-300 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (isNotStarted)
                          router.push(
                            `/dashboard/view-campaigns/${campaign.id}`,
                          );
                        else alert("Outreach engine is currently active.");
                      }}
                    >
                      {isNotStarted ? (
                        <>
                          <FaMagic size={10} /> Edit / Launch
                        </>
                      ) : (
                        <>
                          <FaRocket size={10} /> Active
                        </>
                      )}
                    </button>

                    <button
                      className="py-3 rounded-xl text-xs font-bold flex items-center cursor-pointer justify-center gap-2 transition-all bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      onClick={() => startEditing(campaign)}
                    >
                      <FaEdit size={10} /> Rename
                    </button>

                    {/* BOTTOM ROW: View Stats (Takes both columns) */}
                    <button
                      disabled={!isActive}
                      className={`col-span-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center justify-center gap-2 transition-all mt-1 ${
                        isActive
                          ? "bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 cursor-pointer"
                          : "bg-slate-50 text-slate-300 border border-transparent cursor-not-allowed font-medium"
                      }`}
                      onClick={() =>
                        alert("Aggregating live outreach statistics...")
                      }
                    >
                      <FaChartBar size={12} />{" "}
                      {isActive ? "View Stats" : "Stats Locked"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
