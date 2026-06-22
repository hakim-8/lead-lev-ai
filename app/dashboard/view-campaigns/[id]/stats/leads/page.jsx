"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaSpinner,
  FaUserMinus,
  FaCheckCircle,
  FaExclamationTriangle,
  FaQuestionCircle,
  FaEnvelope,
} from "react-icons/fa";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default function CampaignLeadsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [leads, setLeads] = useState([]);
  const [isRemoving, setIsRemoving] = useState(null);

  useEffect(() => {
    if (id) {
      fetchCampaignAndLeads();
    }
  }, [id]);

  const fetchCampaignAndLeads = async () => {
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

      // Protect route if someone somehow navigated here while not Ongoing
      if (campaignData.status !== "Ongoing") {
        setIsLoading(false);
        return;
      }

      // 2. Fetch Leads
      let filterArray = ["valid"];
      if (campaignData.send_to_risky) {
        filterArray.push("risky");
      }

      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select(
          "id, business_name, business_category, decision_maker_name, decision_maker_job, decision_maker_email, business_email, email_validity, status, emails_sent",
        )
        .eq("table_id", campaignData.table_id)
        .in("email_validity", filterArray)
        .order("created_at", { ascending: false });

      if (leadsError) throw leadsError;
      setLeads(leadsData || []);
    } catch (err) {
      console.error("Error fetching campaign/leads data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromCampaign = async (leadId) => {
    setIsRemoving(leadId);
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: "Removed" })
        .eq("id", leadId);

      if (error) throw error;

      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: "Removed" } : l)),
      );
    } catch (err) {
      console.error("Error removing lead from campaign:", err);
      alert("Failed to remove lead.");
    } finally {
      setIsRemoving(null);
    }
  };

  const getValidityBadge = (validity) => {
    const val = validity?.toLowerCase();
    if (val === "valid")
      return (
        <span className="flex items-center justify-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100 uppercase w-fit m-auto">
          <FaCheckCircle size={10} /> Valid
        </span>
      );
    if (val === "risky")
      return (
        <span className="flex items-center justify-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-100 uppercase w-fit m-auto">
          <FaExclamationTriangle size={10} /> Risky
        </span>
      );
    return (
      <span className="flex items-center justify-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold border border-slate-100 uppercase w-fit m-auto">
        <FaQuestionCircle size={10} /> {validity || "Untested"}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    if (status === "Removed") {
      return (
        <span className="px-2 py-1 bg-red-50 text-red-600 rounded-md text-[10px] font-bold uppercase tracking-widest border border-red-100">
          Removed
        </span>
      );
    }
    if (status === "Replied") {
      return (
        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
          Replied
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-slate-50 text-slate-500 rounded-md text-[10px] font-bold uppercase tracking-widest border border-slate-200">
        {status || "Queued"}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 font-sans h-[60vh]">
        <FaSpinner className="animate-spin text-indigo-500" size={40} />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
          Loading Active Targets...
        </p>
      </div>
    );
  }

  if (campaign && campaign.status !== "Ongoing") {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-6 font-sans text-center h-[60vh]">
        <FaExclamationTriangle className="text-slate-300" size={40} />
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Notice</h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto">
            You can only manage prospects for campaigns actively in progress.
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all text-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 font-sans pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all"
          >
            <FaArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FaEnvelope className="text-indigo-600 hidden" /> Campaign Targets
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Currently processing {leads.length} records logic.
            </p>
          </div>
        </div>
        <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-2">
          Risk Filter: {campaign.send_to_risky ? "Valid + Risky" : "Valid Only"}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col font-sans">
        <div className="block max-w-full overflow-x-auto scrollbar-default">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">
                  Business Entity
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">
                  Decision Maker
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">
                  Public Email
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans text-center">
                  Quality
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans text-center">
                  Sequence Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans text-center">
                  Outreach Count
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans text-right">
                  System Guard
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => {
                const isRemovedOrReplied =
                  lead.status === "Removed" || lead.status === "Replied";
                return (
                  <tr
                    key={lead.id}
                    className={`transition-colors ${isRemovedOrReplied ? "opacity-40 grayscale bg-slate-50/50" : "hover:bg-slate-50/50"}`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 text-sm mb-1">
                        {lead.business_name}
                      </p>
                      <p className="text-[10px] font-bold text-indigo-500 uppercase px-2 py-0.5 bg-indigo-50 rounded-md w-fit">
                        {lead.business_category || "General"}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 text-sm">
                        {lead.decision_maker_name || (
                          <span className="italic text-slate-300">
                            Unspecified
                          </span>
                        )}
                      </p>
                      {lead.decision_maker_job && (
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-bold">
                          {lead.decision_maker_job}
                        </p>
                      )}
                      {lead.decision_maker_email && (
                        <p className="text-[10px] text-indigo-500 font-bold mt-1 line-clamp-1 break-all">
                          {lead.decision_maker_email}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-2">
                        <FaEnvelope className="text-slate-300" />
                        {lead.business_email || "N/A"}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {getValidityBadge(lead.email_validity)}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(lead.status)}
                    </td>

                    <td className="px-6 py-4 text-center font-black text-slate-700">
                      {lead.emails_sent || 0}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        disabled={isRemovedOrReplied || isRemoving === lead.id}
                        onClick={() => handleRemoveFromCampaign(lead.id)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ml-auto ${
                          isRemovedOrReplied
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-white border-2 border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-500 shadow-sm"
                        }`}
                      >
                        {isRemoving === lead.id ? (
                          <FaSpinner className="animate-spin" />
                        ) : isRemovedOrReplied ? (
                          "Locked"
                        ) : (
                          <>
                            <FaUserMinus size={12} /> Remove
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {leads.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center p-10 font-bold text-slate-400"
                  >
                    No valid targets found for your strategy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
