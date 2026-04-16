"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaUser,
  FaBuilding,
  FaIdBadge,
  FaSpinner,
  FaCheckCircle,
  FaHistory,
  FaChevronLeft,
  FaChevronRight,
  FaEnvelope,
  FaLinkedin,
  FaExternalLinkAlt,
  FaCopy,
  FaCheck,
} from "react-icons/fa";
import { supabase } from "../../lib/supabase";

const ROLES = [
  { label: "CEO / Founder / Director", value: "ceo" },
  { label: "Finance", value: "finance" },
  { label: "Human Resource (HR)", value: "hr" },
  { label: "Marketing", value: "marketing" },
  { label: "Operations / Admin", value: "operations" },
  { label: "Sales", value: "sales" },
];

const SEARCH_MODES = [
  { id: "company", label: "Company Emails", icon: FaBuilding },
  { id: "person", label: "Find Person", icon: FaUser },
  { id: "decision_maker", label: "Decision Makers", icon: FaIdBadge },
];

const ITEMS_PER_PAGE = 6;

export default function EmailFinderPage() {
  const { user } = useUser();
  const { organization } = useOrganization();

  // Form State
  const [mode, setMode] = useState("company");
  const [domain, setDomain] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("ceo");
  const [isSearching, setIsSearching] = useState(false);

  // History State
  const [results, setResults] = useState([]);
  const [curPage, setCurPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const cleanDomain = (url) => {
    return url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .toLowerCase();
  };

  const fetchHistory = useCallback(async () => {
    if (!organization?.id && !user?.id) return;

    setIsLoadingHistory(true);
    const orgId = organization?.id || user?.id;

    try {
      // Get total count for pagination
      const { count } = await supabase
        .from("email_finder_results")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId);

      setTotalCount(count || 0);

      // Get page data
      const { data, error } = await supabase
        .from("email_finder_results")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .range(curPage * ITEMS_PER_PAGE, (curPage + 1) * ITEMS_PER_PAGE - 1);

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [organization?.id, user?.id, curPage]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!domain.trim() || isSearching) return;

    setIsSearching(true);
    const cleanedDomain = cleanDomain(domain);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request_type: "email_finder",
            search_mode: mode,
            domain: cleanedDomain,
            full_name: mode === "person" ? fullName : null,
            decision_maker_category: mode === "decision_maker" ? role : null,
            user_id: user?.id,
            org_id: organization?.id || user?.id,
          }),
        },
      );

      if (!response.ok) throw new Error("Search failed");

      // Wait a bit for Supabase triggers to finish if n8n takes time
      setTimeout(() => {
        setCurPage(0); // Reset to first page
        fetchHistory();
        setIsSearching(false);
        setDomain("");
        setFullName("");
      }, 2000);
    } catch (err) {
      console.error("Search error:", err);
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Finder</h1>
          <p className="text-sm text-slate-500 mt-1">
            Locate verified contact data across any domain.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Section: Search Form */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FaSearch className="text-indigo-600" /> New Search
            </h2>

            {/* Mode Switcher */}
            <div className="flex bg-slate-50 p-1 rounded-2xl mb-8 border border-slate-100">
              {SEARCH_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                    mode === m.id
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <m.icon size={16} />
                  {m.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Domain Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. apple.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-700 font-medium"
                />
              </div>

              <AnimatePresence mode="wait">
                {mode === "person" && (
                  <motion.div
                    key="person-input"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Person's Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tim Cook"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-700 font-medium"
                    />
                  </motion.div>
                )}

                {mode === "decision_maker" && (
                  <motion.div
                    key="role-input"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Select Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium appearance-none"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                {isSearching ? (
                  <>
                    <FaSpinner className="animate-spin" /> Performing Search...
                  </>
                ) : (
                  <>
                    <FaSearch size={14} /> Find Contacts
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Section: History Results */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FaHistory className="text-indigo-600" /> Recent Results
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {totalCount} Total
              </span>
            </h2>

            {isLoadingHistory ? (
              <div className="flex-1 flex items-center justify-center">
                <FaSpinner className="animate-spin text-indigo-400" size={32} />
              </div>
            ) : results.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                  <FaSearch size={24} />
                </div>
                <h3 className="text-slate-900 font-bold">
                  No results found yet
                </h3>
                <p className="text-slate-500 text-sm max-w-xs">
                  Start your first search to begin building your verified list
                  of contacts.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="space-y-3">
                  {results.map((res) => {
                    const status = res.email_status?.toLowerCase();
                    const isNotFound = status === "not_found";
                    const isRisky = status === "risky";
                    const isValid = status === "valid";

                    let statusColor = "text-red-500";
                    if (isValid) statusColor = "text-emerald-500";
                    else if (isRisky) statusColor = "text-amber-500";
                    else if (isNotFound) statusColor = "text-slate-400";

                    return (
                      <div
                        key={res.id}
                        className={`group border rounded-2xl transition-all ${expandedId === res.id ? "border-indigo-200 bg-indigo-50/20" : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"}`}
                      >
                        <div
                          className={`p-4 flex items-center gap-4 ${isNotFound ? "cursor-default" : "cursor-pointer"}`}
                          onClick={() =>
                            !isNotFound &&
                            setExpandedId(expandedId === res.id ? null : res.id)
                          }
                        >
                          {/* Domain & Meta Info */}
                          <div className="flex-1 min-w-[200px]">
                            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              {res.domain}
                              {res.search_type && (
                                <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-tighter">
                                  {res.search_type}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              {res.full_name || "Company View"} •{" "}
                              {new Date(res.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Validity Status - Positioned in the Middle */}
                          <div className="flex-1 flex justify-center">
                            <div
                              className={`text-[10px] font-black uppercase tracking-tighter px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 ${statusColor}`}
                            >
                              {status || "unknown"}
                            </div>
                          </div>

                          {/* Actions - Only visible if not 'not found' */}
                          <div className="flex-1 flex justify-end">
                            {!isNotFound && (
                              <button
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                                  expandedId === res.id
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                                }`}
                              >
                                {expandedId === res.id
                                  ? "Hide Details"
                                  : "Show Emails"}
                              </button>
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedId === res.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-4 pb-4 overflow-hidden"
                            >
                              <div className="border-t border-indigo-100/50 pt-4 space-y-4">
                                <div className="space-y-3">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Verified Contacts
                                  </span>
                                  <div className="grid gap-2">
                                    {(res.valid_emails || []).map(
                                      (email, i) => (
                                        <div
                                          key={i}
                                          className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl group/email"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                              <FaEnvelope size={12} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">
                                              {email}
                                            </span>
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigator.clipboard.writeText(
                                                email,
                                              );
                                            }}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                            title="Copy to clipboard"
                                          >
                                            <FaCopy size={12} />
                                          </button>
                                        </div>
                                      ),
                                    )}
                                    {(res.valid_emails || []).length === 0 && (
                                      <span className="text-xs text-slate-400 italic">
                                        None found
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {(res.full_name || res.person_job_title) && (
                                  <div className="p-4 bg-indigo-600 text-white rounded-2xl flex items-center justify-between shadow-lg shadow-indigo-100">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <FaUser size={18} />
                                      </div>
                                      <div>
                                        <div className="text-sm font-bold">
                                          {res.full_name || "Company Contact"}
                                        </div>
                                        <div className="text-[10px] font-medium opacity-80 uppercase tracking-wider">
                                          {res.person_job_title || "Person"}
                                        </div>
                                      </div>
                                    </div>
                                    {res.person_linkedin_url && (
                                      <a
                                        href={res.person_linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                                      >
                                        <FaLinkedin size={18} />
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="mt-auto pt-8 flex items-center justify-between border-t border-slate-50">
                  <span className="text-xs font-bold text-slate-400">
                    Page {curPage + 1} of{" "}
                    {Math.ceil(totalCount / ITEMS_PER_PAGE)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={curPage === 0}
                      onClick={() => setCurPage((prev) => prev - 1)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-0 transition-all"
                    >
                      <FaChevronLeft size={12} />
                    </button>
                    <button
                      disabled={(curPage + 1) * ITEMS_PER_PAGE >= totalCount}
                      onClick={() => setCurPage((prev) => prev + 1)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-0 transition-all"
                    >
                      <FaChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
