"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useOrganization } from "@clerk/nextjs";
import { 
  FaRocket, 
  FaArrowLeft, 
  FaPlus,
  FaSpinner,
  FaExclamationCircle
} from "react-icons/fa";
import { supabase } from "../../lib/supabase";
import { format } from "date-fns";

export default function NewCampaignPage() {
  const router = useRouter();
  const { user } = useUser();
  const { organization } = useOrganization();
  const [campaignName, setCampaignName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!campaignName.trim()) return;

    setIsSaving(true);
    setError("");

    const orgId = organization?.id || user?.id;
    if (!orgId) {
      setError("Authorization context missing. Please refresh.");
      setIsSaving(false);
      return;
    }

    try {
      // 1. Generate timestamped name for uniqueness and record
      const timestamp = format(new Date(), "dd-MM-yyyy HH:mm");
      const finalName = `${campaignName.trim()} - ${timestamp}`;

      // 2. Check for collisions (strip timestamp for matching user intent)
      const { data: existing } = await supabase
        .from("email_campaigns")
        .select("campaign_name")
        .eq("org_id", orgId);

      const isDuplicate = existing?.some(c => {
         const baseName = c.campaign_name.replace(/ - \d{2}-\d{2}-\d{4} \d{2}:\d{2}$/, "");
         return baseName.toLowerCase() === campaignName.trim().toLowerCase();
      });

      if (isDuplicate) {
        setError("A campaign with this name already exists in your organization.");
        setIsSaving(false);
        return;
      }

      // 3. Create entry
      const { data, error: insertError } = await supabase
        .from("email_campaigns")
        .insert({
          user_id: user?.id,
          org_id: orgId,
          campaign_name: finalName,
          status: "Not Started",
          table_id: null,
          follow_ups: 0,
          delay_hours: 24,
          subject: "",
          tone: "Friendly",
          goal: ""
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 4. Redirect to dynamic setup page
      router.push(`/dashboard/view-campaigns/${data.id}`);
    } catch (err) {
      console.error("Error creating campaign:", err);
      setError("Failed to initialize campaign. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-xl">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-sm"
        >
          <FaArrowLeft size={12} /> Back to Dashboard
        </button>

        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
          <div className="p-12 text-center space-y-4">
             <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FaRocket size={32} />
             </div>
             <h1 className="text-3xl font-black text-slate-900">Create New Campaign</h1>
             <p className="text-slate-500 font-medium max-w-sm mx-auto">
               Initialize your outreach sequence. You'll specify the leads and copy in the next step.
             </p>
          </div>

          <form onSubmit={handleCreateCampaign} className="px-12 pb-16 space-y-8">
             <div className="space-y-4">
               <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Campaign Identity</label>
               <input 
                 required
                 autoFocus
                 type="text"
                 placeholder="e.g. Q4 Saas Outreach"
                 value={campaignName}
                 onChange={(e) => setCampaignName(e.target.value)}
                 className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-lg font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all placeholder:text-slate-300"
               />
               {error && (
                 <div className="flex items-center gap-2 text-red-500 text-xs font-bold mt-2 ml-4">
                   <FaExclamationCircle /> {error}
                 </div>
               )}
             </div>

             <button 
               type="submit"
               disabled={isSaving || !campaignName.trim()}
               className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 hover:bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-300 transition-all shadow-2xl shadow-indigo-100"
             >
               {isSaving ? (
                 <><FaSpinner className="animate-spin" /> Initializing...</>
               ) : (
                 <><FaPlus size={16} /> Create Campaign</>
               )}
             </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
           Step 1 of 6 • Environment Initialized
        </p>
      </div>
    </div>
  );
}
