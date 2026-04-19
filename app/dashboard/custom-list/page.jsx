"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganization, useUser } from "@clerk/nextjs";
import {
  FaTable,
  FaArrowLeft,
  FaPlus,
  FaSpinner,
  FaInfoCircle,
  FaMagic,
} from "react-icons/fa";
import { supabase } from "../../lib/supabase";
import { format } from "date-fns";
import Link from "next/link";

export default function CustomListPage() {
  const router = useRouter();
  const { organization } = useOrganization();
  const { user } = useUser();
  const [listName, setListName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!listName.trim() || isCreating) return;

    // Org ID or User ID for personal workspace
    const orgId = organization?.id || user?.id;
    if (!orgId) {
      setError("No identity found. Please ensure you are logged in.");
      return;
    }

    setIsCreating(true);
    setError("");

    // Format: "ListName - 22-03-2026 23:39"
    const timestamp = format(new Date(), "dd-MM-yyyy HH:mm");
    const finalTableName = `${listName.trim()} - ${timestamp}`;

    try {
      // Uniqueness check for same org
      const { data: existing } = await supabase
        .from("lead_tables")
        .select("id")
        .eq("org_id", orgId)
        .eq("table_name", finalTableName);

      if (existing && existing.length > 0) {
        setError(
          "A list with this exact name already exists. Please choose a different name.",
        );
        setIsCreating(false);
        return;
      }

      // Insert into lead_tables
      const { data, error: insertError } = await supabase
        .from("lead_tables")
        .insert({
          user_id: user?.id,
          org_id: orgId,
          table_name: finalTableName,
          number_of_leads: 0,
          created_list: true, // Flag for custom lists
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Success - Redirect to the new dynamic list page
      router.push(`/dashboard/view-leads/${data.id}`);
    } catch (err) {
      console.error("Error creating custom list:", err);
      setError(
        "Failed to create the list. Please check your connection and try again.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/view-leads"
          className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all font-sans"
        >
          <FaArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">
            Initialize Custom List
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-sans">
            Build a private workspace for your specific lead segments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6 text-sans">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <form onSubmit={handleCreateList} className="space-y-6 text-sans">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 font-sans">
                  Collection Name
                </label>
                <div className="relative font-sans">
                  <FaTable className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="text"
                    placeholder="e.g. Real Estate VIP Contacts"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all font-bold text-slate-900 placeholder:text-slate-300 font-sans"
                  />
                </div>
                <p className="text-[10px] text-slate-400 ml-1 font-sans">
                  A unique timestamp will be automatically appended to your list
                  for internal tracking.
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold font-sans">
                  <span className="shrink-0">⚠️</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isCreating || !listName.trim()}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-600 disabled:bg-slate-200 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-100 font-sans"
              >
                {isCreating ? (
                  <>
                    <FaSpinner className="animate-spin" /> Finalizing
                    Collection...
                  </>
                ) : (
                  <>
                    <FaPlus size={14} /> Create Collection
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-6 space-y-4 font-sans">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm font-sans">
              <FaInfoCircle size={20} />
            </div>
            <h3 className="font-bold text-indigo-900 text-sans">
              Custom Segments
            </h3>
            <p className="text-xs text-indigo-700 leading-relaxed text-sans">
              Custom lists allow you to manually curate leads without using the
              AI generator. Once created, you can add individual leads, edit
              their details, and verify their contact information manually and
              launch a campaign with your new custom list.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 space-y-4 font-sans text-sans text-sans">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-500 shadow-sm">
                <FaMagic size={14} />
              </div>
              <span className="text-xs font-bold text-slate-700 font-sans">
                What's Next?
              </span>
            </div>
            <ul className="space-y-3 font-sans">
              <li className="flex items-center gap-2 text-[11px] text-slate-500 font-sans">
                <span className="w-1 h-1 bg-indigo-400 rounded-full" />
                Add manual leads
              </li>
              <li className="flex items-center gap-2 text-[11px] text-slate-500 font-sans">
                <span className="w-1 h-1 bg-indigo-400 rounded-full" />
                Enrich data profiles
              </li>
              <li className="flex items-center gap-2 text-[11px] text-slate-500 font-sans">
                <span className="w-1 h-1 bg-indigo-400 rounded-full" />
                Export to CSV / Excel
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
