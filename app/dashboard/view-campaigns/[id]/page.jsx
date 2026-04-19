"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useOrganization } from "@clerk/nextjs";
import {
  FaArrowLeft,
  FaRocket,
  FaDatabase,
  FaShieldAlt,
  FaClock,
  FaLightbulb,
  FaEye,
  FaChevronRight,
  FaChevronLeft,
  FaCheck,
  FaSpinner,
  FaExclamationTriangle,
  FaInfoCircle,
  FaMinus,
  FaPlus,
  FaCheckCircle,
  FaMagic,
  FaPaperPlane,
  FaExternalLinkAlt,
  FaLock,
} from "react-icons/fa";
import { supabase } from "../../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  {
    id: 1,
    name: "DataSource",
    icon: FaDatabase,
    description: "Select Lead Collection",
  },
  {
    id: 2,
    name: "Risk Control",
    icon: FaShieldAlt,
    description: "Filter & Quality",
  },
  {
    id: 3,
    name: "Cadence",
    icon: FaClock,
    description: "Intervals & Follow-ups",
  },
  { id: 4, name: "Strategy", icon: FaLightbulb, description: "Subject & Tone" },
  { id: 5, name: "Preview", icon: FaEye, description: "AI Final Review" },
];

export default function CampaignSetupWizard() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { organization } = useOrganization();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  // Campaign State
  const [campaign, setCampaign] = useState(null);
  const [tables, setTables] = useState([]);

  // Wizards Data
  const [selectedTableId, setSelectedTableId] = useState("");
  const [tableStats, setTableStats] = useState({
    total: 0,
    valid: 0,
    risky: 0,
    invalid: 0,
  });
  const [includeRisky, setIncludeRisky] = useState(false);
  const [followUps, setFollowUps] = useState(0);
  const [delayHours, setDelayHours] = useState(24);
  const [subject, setSubject] = useState("");
  const [tone, setTone] = useState("Friendly");
  const [goal, setGoal] = useState("");

  // Preview Data
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCampaign();
      fetchTables();
    }
  }, [id]);

  useEffect(() => {
    if (selectedTableId) {
      fetchTableStats(selectedTableId);
    }
  }, [selectedTableId]);

  const fetchCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setCampaign(data);
        setSelectedTableId(data.table_id || "");
        setFollowUps(data.follow_ups || 0);
        setDelayHours(data.delay_hours || 24);
        setSubject(data.subject || "");
        setTone(data.tone || "Friendly");
        setGoal(data.goal || "");
      }
    } catch (err) {
      console.error("Error fetching campaign:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTables = async () => {
    const orgId = organization?.id || user?.id;
    if (!orgId) return;
    try {
      const { data } = await supabase
        .from("lead_tables")
        .select("id, table_name, number_of_leads")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      setTables(data || []);
    } catch (err) {
      console.error("Error fetching tables:", err);
    }
  };

  const fetchTableStats = async (tableId) => {
    try {
      const { data } = await supabase
        .from("leads")
        .select("email_validity")
        .eq("table_id", tableId);

      const stats = {
        total: data?.length || 0,
        valid:
          data?.filter((l) => l.email_validity?.toLowerCase() === "valid")
            .length || 0,
        risky:
          data?.filter((l) => l.email_validity?.toLowerCase() === "risky")
            .length || 0,
        invalid:
          data?.filter((l) => l.email_validity?.toLowerCase() === "invalid")
            .length || 0,
      };
      setTableStats(stats);
    } catch (err) {
      console.error("Stats error:", err);
    }
  };

  const handleNext = async () => {
    // Blocks
    if (currentStep === 1 && !selectedTableId) return;
    if (currentStep === 2 && tableStats.valid === 0) return;

    // Save state on each step transition
    setIsSaving(true);
    try {
      await supabase
        .from("email_campaigns")
        .update({
          table_id: selectedTableId,
          follow_ups: followUps,
          delay_hours: delayHours,
          subject: subject,
          tone: tone,
          goal: goal,
        })
        .eq("id", id);

      if (currentStep < 5) {
        if (currentStep === 4) {
          generatePreview();
        }
        setCurrentStep((prev) => prev + 1);
      } else {
        handleLaunch();
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const generatePreview = async () => {
    setIsPreviewLoading(true);
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_N8N_EMAIL_PREVIEW_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "preview",
            campaign_id: id,
            table_id: selectedTableId,
            name: stripTimestamp(campaign?.campaign_name || ""),
            org_id: organization?.id || user?.id,
            tone,
            goal,
            subject,
            follow_ups: followUps,
            delay_hours: delayHours,
            include_risky: includeRisky,
          }),
        },
      );
      const data = await response.json();
      setPreviewData(data);
    } catch (err) {
      console.error("Preview error:", err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleLaunch = async () => {
    if (!confirm("Launch this campaign sequence now?")) return;
    setIsLaunching(true);
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_N8N_EMAIL_PREVIEW_URL,
        {
          // Use same URL as requested
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "campaign",
            campaign_id: id,
            table_id: selectedTableId,
            name: stripTimestamp(campaign?.campaign_name || ""),
            org_id: organization?.id || user?.id,
            tone,
            goal,
            subject,
            follow_ups: followUps,
            delay_hours: delayHours,
            include_risky: includeRisky,
          }),
        },
      );

      if (response.ok) {
        await supabase
          .from("email_campaigns")
          .update({ status: "Ongoing" })
          .eq("id", id);

        router.push("/dashboard/view-campaigns");
      } else {
        alert("Engine initialization failed. Please contact support.");
      }
    } catch (err) {
      console.error("Launch error:", err);
      alert("Failed to connect to the outreach engine.");
    } finally {
      setIsLaunching(false);
    }
  };

  const stripTimestamp = (name) =>
    name.replace(/ - \d{2}-\d{2}-\d{4} \d{2}:\d{2}$/, "");

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 font-sans">
        <FaSpinner className="animate-spin text-indigo-500" size={40} />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
          Waking Campaign...
        </p>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-10 font-sans pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all font-sans"
          >
            <FaArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {stripTimestamp(campaign?.campaign_name || "")}
            </h1>
            <p className="text-xs text-slate-500 font-medium font-sans">
              Campaign Configuration Wizard
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 font-sans">
          <FaRocket size={10} /> Campaign Status: Drafting
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative font-sans">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0 font-sans" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500 font-sans"
          style={{
            width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
          }}
        />
        <div className="relative z-10 flex justify-between font-sans">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            return (
              <div
                key={step.id}
                className="flex flex-col items-center gap-4 font-sans"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-slate-50 transition-all duration-300 font-sans ${isCompleted ? "bg-indigo-600 text-white scale-110" : isActive ? "bg-white border-indigo-100 text-indigo-600 shadow-xl" : "bg-white text-slate-300"}`}
                >
                  {isCompleted ? <FaCheck size={16} /> : <Icon size={18} />}
                </div>
                <div className="text-center font-sans">
                  <p
                    className={`text-[10px] font-black uppercase tracking-widest font-sans ${isActive ? "text-indigo-600" : "text-slate-400"}`}
                  >
                    {step.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 font-sans">
        <div className="lg:col-span-2 space-y-8 min-h-[500px] font-sans">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm font-sans"
              >
                <div className="space-y-2 font-sans">
                  <h2 className="text-3xl font-black text-slate-900 font-sans">
                    Select Data Source
                  </h2>
                  <p className="text-slate-500 font-medium font-sans">
                    Which lead collection should this campaign target?
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 font-sans">
                  {tables.map((table) => {
                    const isEmpty = table.number_of_leads === 0;
                    return (
                      <button
                        key={table.id}
                        disabled={isEmpty}
                        onClick={() => setSelectedTableId(table.id)}
                        className={`p-6 rounded-3xl border-2 text-left transition-all flex items-center justify-between group font-sans ${isEmpty ? "opacity-40 grayscale cursor-not-allowed border-slate-100" : selectedTableId === table.id ? "bg-indigo-50 border-indigo-600 shadow-lg shadow-indigo-100" : "bg-slate-50 border-transparent hover:border-slate-200"}`}
                      >
                        <div className="flex items-center gap-4 font-sans">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-sans ${selectedTableId === table.id ? "bg-white text-indigo-600 shadow-sm" : "bg-white text-slate-400 shadow-sm"}`}
                          >
                            {isEmpty ? (
                              <FaLock size={16} />
                            ) : (
                              <FaDatabase size={20} />
                            )}
                          </div>
                          <div className="font-sans">
                            <p className="font-black text-slate-900 font-sans">
                              {stripTimestamp(table.table_name)}
                            </p>
                            <p
                              className={`text-xs font-bold uppercase tracking-widest font-sans ${isEmpty ? "text-red-400" : "text-slate-500"}`}
                            >
                              {isEmpty
                                ? "0 Records • Workspace Blocked"
                                : `${table.number_of_leads} Records Available`}
                            </p>
                          </div>
                        </div>
                        {selectedTableId === table.id && !isEmpty && (
                          <FaCheckCircle
                            className="text-indigo-600 font-sans"
                            size={24}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm font-sans"
              >
                <div className="space-y-2 font-sans">
                  <h2 className="text-3xl font-black text-slate-900 font-sans">
                    Risk Assessment
                  </h2>
                  <p className="text-slate-500 font-medium font-sans">
                    Verify data quality and delivery safety.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 font-sans">
                  <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 space-y-2 font-sans">
                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest font-sans">
                      Guaranteed Safe
                    </p>
                    <p className="text-4xl font-black text-emerald-700 font-sans">
                      {tableStats.valid}
                    </p>
                    <p className="text-xs font-bold text-emerald-600 font-sans">
                      Verified reachable mailboxes
                    </p>
                  </div>
                  <div
                    className={`p-6 rounded-3xl border transition-all space-y-2 font-sans ${includeRisky ? "bg-amber-50 border-amber-200 shadow-inner" : "bg-slate-50 border-slate-100"}`}
                  >
                    <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest font-sans">
                      Catch-All / Risky
                    </p>
                    <p className="text-4xl font-black text-amber-700 font-sans">
                      {tableStats.risky}
                    </p>
                    <p className="text-xs font-bold text-amber-600 font-sans">
                      Experimental / Unverified
                    </p>
                  </div>
                </div>

                {tableStats.valid === 0 ? (
                  <div className="bg-red-50 p-10 rounded-3xl border border-red-200 space-y-6 animate-in zoom-in-95 font-sans">
                    <div className="flex gap-4 items-start font-sans">
                      <FaExclamationTriangle
                        className="text-red-500 shrink-0 mt-1 font-sans"
                        size={24}
                      />
                      <div className="space-y-2 font-sans">
                        <p className="text-lg font-black text-red-700 font-sans">
                          Table Usage Blocked
                        </p>
                        <p className="text-sm font-medium text-red-600 leading-relaxed font-sans">
                          You cannot use this table because it has no valid
                          emails. You are welcome to try and verify the emails
                          before using this table for your campaign.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/dashboard/view-leads/${selectedTableId}`)
                      }
                      className="w-full py-4 bg-white border-2 border-red-200 text-red-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-3 font-sans"
                    >
                      <FaExternalLinkAlt size={12} /> Verify Emails in Workspace
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex gap-4 items-start font-sans">
                      <FaExclamationTriangle
                        className="text-red-500 shrink-0 mt-1 font-sans"
                        size={20}
                      />
                      <div className="space-y-2 font-sans">
                        <p className="text-sm font-black text-red-700 uppercase tracking-tight font-sans">
                          Grey-listing Warning
                        </p>
                        <p className="text-xs font-medium text-red-600 leading-relaxed font-sans">
                          Sending to "Risky" emails can lead to server
                          blacklisting and reduced deliverability for your
                          entire domain. We recommend keeping this disabled
                          unless your target audience is highly specific.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 font-sans">
                      <div className="space-y-1 font-sans">
                        <p className="font-black text-slate-900 font-sans">
                          Include Risky Emails?
                        </p>
                        <p className="text-xs text-slate-500 font-medium font-sans font-sans">
                          Toggle to add secondary quality leads.
                        </p>
                      </div>
                      <button
                        onClick={() => setIncludeRisky(!includeRisky)}
                        className={`w-16 h-8 rounded-full relative transition-all duration-300 p-1 font-sans ${includeRisky ? "bg-amber-500" : "bg-slate-300"}`}
                      >
                        <div
                          className={`w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 font-sans ${includeRisky ? "translate-x-8" : "translate-x-0"}`}
                        />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10 bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm font-sans"
              >
                <div className="space-y-2 font-sans font-sans">
                  <h2 className="text-3xl font-black text-slate-900 font-sans">
                    Outreach Cadence
                  </h2>
                  <p className="text-slate-500 font-medium font-sans">
                    Determine the persistence and timing of your campaign.
                  </p>
                </div>

                <div className="space-y-12 font-sans">
                  <div className="space-y-4 font-sans font-sans">
                    <div className="flex justify-between items-center font-sans">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">
                        Sequence Depth (Follow-ups)
                      </label>
                      <span className="text-2xl font-black text-indigo-600 font-sans">
                        {followUps} Emails
                      </span>
                    </div>
                    <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-3xl border border-slate-100 font-sans">
                      <button
                        onClick={() => setFollowUps(Math.max(0, followUps - 1))}
                        className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all font-sans"
                      >
                        <FaMinus size={14} />
                      </button>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden font-sans">
                        <div
                          className="h-full bg-indigo-600 transition-all font-sans"
                          style={{ width: `${(followUps / 10) * 100}%` }}
                        />
                      </div>
                      <button
                        onClick={() =>
                          setFollowUps(Math.min(10, followUps + 1))
                        }
                        className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all font-sans"
                      >
                        <FaPlus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6 font-sans">
                    <div className="flex justify-between items-center font-sans">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">
                        Delay Interval (Per Follow-up)
                      </label>
                      <span className="text-2xl font-black text-indigo-600 font-sans">
                        {delayHours} Hours
                      </span>
                    </div>
                    <div className="px-2 font-sans">
                      <input
                        type="range"
                        min="2"
                        max="120"
                        step="2"
                        value={delayHours}
                        onChange={(e) =>
                          setDelayHours(parseInt(e.target.value))
                        }
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 font-sans"
                      />
                      <div className="flex justify-between mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest font-sans">
                        <span>2 Hours</span>
                        <span>24 Hours</span>
                        <span>48 Hours</span>
                        <span>72 Hours</span>
                        <span>96 Hours</span>
                        <span>120 Hours</span>
                      </div>
                    </div>
                    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex items-center gap-4 font-sans">
                      <FaInfoCircle className="text-indigo-400 shrink-0 font-sans" />
                      <p className="text-xs font-medium text-indigo-600 leading-relaxed font-sans">
                        Each follow-up will be sent approximately{" "}
                        <b>{delayHours} hours</b> after the previous
                        touch-point. We recommend 2-5 days (48h-120h) for
                        professional B2B outreach.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm font-sans"
              >
                <div className="space-y-2 font-sans font-sans">
                  <h2 className="text-3xl font-black text-slate-900 font-sans">
                    Campaign Strategy
                  </h2>
                  <p className="text-slate-500 font-medium font-sans">
                    Define the core message and psychological approach.
                  </p>
                </div>

                <div className="space-y-6 font-sans">
                  <div className="space-y-2 font-sans font-sans">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 font-sans">
                      Email Subject Line Idea
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Question about your website"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-lg font-bold outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all placeholder:text-slate-300 font-sans"
                    />
                  </div>

                  <div className="space-y-2 font-sans font-sans">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 font-sans">
                      Communication Tone
                    </label>
                    <div className="grid grid-cols-3 gap-4 font-sans font-sans">
                      {["Friendly", "Direct", "Professional"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTone(t)}
                          className={`py-4 font-black rounded-2xl border-2 transition-all font-sans ${tone === t ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-105" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 font-sans font-sans">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 font-sans">
                      Conversion Goal
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. I want to book a 15 min discovery call to discuss their SEO rank."
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-base font-medium outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all placeholder:text-slate-300 font-sans"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm font-sans font-sans"
              >
                <div className="flex items-center justify-between font-sans">
                  <div className="space-y-2 font-sans">
                    <h2 className="text-3xl font-black text-slate-900 font-sans">
                      Final Preview
                    </h2>
                    <p className="text-slate-500 font-medium font-sans font-sans">
                      Review the AI-generated outreach message.
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2 font-sans"
                  >
                    <FaMagic className="font-sans" /> Refine Strategy
                  </button>
                </div>

                {isPreviewLoading ? (
                  <div className="bg-slate-50 rounded-[2.5rem] p-20 flex flex-col items-center justify-center space-y-4 font-sans">
                    <FaSpinner
                      className="animate-spin text-indigo-500 font-sans"
                      size={32}
                    />
                    <p className="text-xs font-black uppercase tracking-widest text-indigo-400 font-sans">
                      Synthesizing Copy...
                    </p>
                  </div>
                ) : previewData ? (
                  <div className="bg-slate-900 rounded-[2.5rem] p-1 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 font-sans font-sans font-sans">
                    <div className="bg-slate-800 rounded-t-[2.3rem] p-6 border-b border-slate-700 flex items-center justify-between font-sans">
                      <div className="flex items-center gap-2 font-sans">
                        <div className="w-3 h-3 rounded-full bg-red-400 font-sans" />
                        <div className="w-3 h-3 rounded-full bg-amber-400 font-sans" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400 font-sans" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 font-sans">
                        Lead Lev Outreach Preview
                      </span>
                      <div className="w-10 font-sans" />
                    </div>
                    <div className="bg-white p-10 space-y-6 font-sans">
                      <div className="space-y-1 font-sans">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest font-sans">
                          Subject Line
                        </p>
                        <p className="text-lg font-bold text-slate-900 font-sans">
                          {previewData.subject || subject}
                        </p>
                      </div>
                      <div className="h-px bg-slate-100 font-sans" />
                      <div className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap font-sans font-sans">
                        {previewData.message || previewData.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 p-12 rounded-[2.5rem] border border-red-100 text-center space-y-4 font-sans font-sans">
                    <FaExclamationTriangle
                      className="text-red-400 mx-auto font-sans"
                      size={32}
                    />
                    <p className="text-red-800 font-black font-sans">
                      Preview Generation Interrupted
                    </p>
                    <p className="text-sm text-red-600 max-w-xs mx-auto font-sans">
                      We couldn't connect to the AI engine. Please verify your
                      Goal and Strategy.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sticky Nav Actions */}
          <div className="flex items-center justify-between pt-8 h-20 font-sans">
            <button
              disabled={currentStep === 1 || isSaving || isLaunching}
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className={`flex items-center gap-2 px-8 py-5 font-black text-sm uppercase tracking-widest transition-all font-sans ${currentStep === 1 ? "opacity-0" : "text-slate-400 hover:text-slate-900 hover:translate-x-[-4px]"}`}
            >
              <FaChevronLeft className="font-sans" /> Previous
            </button>

            <button
              disabled={
                isSaving ||
                isLaunching ||
                (currentStep === 1 && !selectedTableId) ||
                (currentStep === 2 && tableStats.valid === 0)
              }
              onClick={handleNext}
              className="flex items-center gap-4 px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-indigo-600 hover:scale-105 transition-all shadow-2xl shadow-indigo-100 disabled:bg-slate-200 disabled:scale-100 font-sans"
            >
              {isSaving || isLaunching ? (
                <FaSpinner className="animate-spin font-sans" />
              ) : currentStep === 5 ? (
                <>
                  <FaPaperPlane
                    className="text-indigo-400 font-sans"
                    size={14}
                  />{" "}
                  Launch Campaign
                </>
              ) : currentStep === 4 ? (
                <>
                  <FaMagic size={14} /> Generate Preview
                </>
              ) : (
                <>
                  Next Step <FaChevronRight className="font-sans" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6 font-sans">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 font-sans">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b border-slate-50 pb-4 font-sans">
              Configuration Summary
            </h3>

            <div className="space-y-6 font-sans font-sans">
              <div className="flex items-start gap-4 font-sans">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-sans">
                  <FaDatabase size={14} />
                </div>
                <div className="font-sans">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">
                    Dataset
                  </p>
                  <p className="text-xs font-bold text-slate-700 font-sans">
                    {selectedTableId
                      ? stripTimestamp(
                          tables.find((t) => t.id === selectedTableId)
                            ?.table_name || "",
                        )
                      : "Undetermined"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 font-sans">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-sans">
                  <FaShieldAlt size={14} />
                </div>
                <div className="font-sans">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">
                    Outreach Volume
                  </p>
                  <p className="text-xs font-bold text-slate-700 font-sans">
                    {includeRisky
                      ? tableStats.valid + tableStats.risky
                      : tableStats.valid}{" "}
                    Selected Profiles
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 font-sans">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 font-sans">
                  <FaClock size={14} />
                </div>
                <div className="font-sans">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">
                    Sequence Timing
                  </p>
                  <p className="text-xs font-bold text-slate-700 font-sans">
                    {followUps + 1} Touches • {delayHours}h Intervals
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 font-sans">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-sans">
                  <FaLightbulb size={14} />
                </div>
                <div className="font-sans">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">
                    Communication Alpha
                  </p>
                  <p className="text-xs font-bold text-slate-700 font-sans">
                    {tone} Approach • {goal ? "Custom Goal" : "Generic Goal"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl space-y-4 font-sans font-sans">
              <div className="flex items-center gap-2 font-sans font-sans">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse font-sans" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">
                  Campaign Logic
                </p>
              </div>
              <p className="text-[11px] text-slate-300 font-medium leading-relaxed font-sans font-sans">
                Lead Lev AI will automatically personalize{" "}
                {includeRisky
                  ? tableStats.valid + tableStats.risky
                  : tableStats.valid}{" "}
                unique emails across {followUps + 1} phases.
              </p>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100 text-white space-y-4 overflow-hidden relative font-sans">
            <FaPaperPlane
              className="absolute -right-4 -bottom-4 text-white/10 rotate-12 font-sans"
              size={120}
            />
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 font-sans">
              System Information
            </p>
            <div className="flex items-center gap-3 font-sans font-sans">
              <FaInfoCircle className="text-indigo-300 font-sans" />
              <p className="text-xs font-bold font-sans">Auto-save Enabled</p>
            </div>
            <p className="text-xs font-medium text-indigo-100 leading-relaxed font-sans">
              Every step you complete is automatically synced to the cloud. You
              can leave and return to this drafting session at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
