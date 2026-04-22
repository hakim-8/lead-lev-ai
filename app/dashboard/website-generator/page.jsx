"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPaperPlane,
  FaRobot,
  FaUserCircle,
  FaSpinner,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import { supabase } from "../../lib/supabase";
import { useScrapeStatus } from "../../../hooks/useScrapeStatus";
import Link from "next/link";

export default function WebReportGeneratorPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState({
    website_url: null,
    email: null,
  });
  const [agencyContext, setAgencyContext] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const orgId = organization?.id || user?.id;
  const { activeRequest, scrapeStatus, resetStatus } = useScrapeStatus(orgId);

  const scrollContainerRef = useRef(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Fetch Agency Context from Supabase
  useEffect(() => {
    async function fetchAgencyContext() {
      if (organization?.id) {
        const { data, error } = await supabase
          .from("organizations")
          .select("business_context")
          .eq("org_id", organization.id)
          .single();

        if (data) setAgencyContext(data.business_context);
      }
    }
    fetchAgencyContext();
  }, [organization?.id]);

  // Load Persistent Chat Messages
  useEffect(() => {
    async function loadMessages() {
      if (!(isUserLoaded && isOrgLoaded) || !orgId) return;

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("org_id", orgId)
        .eq("type", "website_report_generator")
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            sender: m.role === "assistant" ? "ai" : "user",
            text: m.content,
          })),
        );
      } else {
        // Initial Welcome if no history Found
        setMessages([
          {
            id: "initial",
            sender: "ai",
            text: "Hello! I can generate detailed website optimization reports. Just provide a URL and an email address to send the report to (e.g., 'write me a report on https://revlaunchdigital.com and send it to info@revlaunchdigital.com').",
          },
        ]);
      }
      setIsInitialLoading(false);
    }
    loadMessages();
  }, [orgId, isUserLoaded, isOrgLoaded]);

  // Ref to track processed statuses
  const processedStatusRef = useRef(null);

  // Handle "Completed" Status Transition
  useEffect(() => {
    if (
      scrapeStatus === "completed_web" &&
      processedStatusRef.current !== "completed_web"
    ) {
      const completionText =
        "Excellent! Your comprehensive website optimization report has been generated and sent to your email. Check your inbox to see the full analysis.";

      const aiMsg = {
        id: Date.now().toString(),
        sender: "ai",
        text: completionText,
      };

      setMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].text === completionText)
          return prev;
        return [...prev, aiMsg];
      });

      saveMessage("assistant", completionText);
      processedStatusRef.current = "completed_web";

      // Auto-reset status after unblocking
      setTimeout(() => {
        resetStatus();
        processedStatusRef.current = null;
      }, 5000);
    } else if (scrapeStatus !== "completed_web" && scrapeStatus !== null) {
      processedStatusRef.current = scrapeStatus;
    }
  }, [scrapeStatus, resetStatus]);

  const saveMessage = async (role, content) => {
    if (!orgId) {
      console.warn("Save skipped: orgId not yet available");
      return;
    }

    // Normalize role to 'user' or 'assistant'
    const normalizedRole =
      role === "ai" ? "assistant" : role === "user" ? "user" : role;

    try {
      console.log(`Saving ${normalizedRole} message to DB for org: ${orgId}`);
      const { error } = await supabase.from("chat_messages").insert({
        org_id: orgId,
        user_id: user?.id,
        role: normalizedRole,
        content: content,
        type: "website_report_generator",
      });

      if (error) {
        console.error(
          "Supabase Save Error (Web):",
          error.message,
          error.details,
        );
        throw error;
      } else {
        console.log("Web message saved successfully");
      }
    } catch (err) {
      console.error(
        "Critical: Failed to save web chat message to Supabase:",
        err,
      );
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isTyping) return;

    const userMessage = inputVal;
    setInputVal("");

    // Optimistic Update
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: "user", text: userMessage },
    ]);
    setIsTyping(true);

    // Save User Message
    await saveMessage("user", userMessage);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request_type: "web_audit",
            previous_context: {
              website_url: context.website_url,
              email: context.email,
            },
            chat_message: userMessage,
            user_id: user?.id,
            org_id: organization?.id || user?.id,
            requesting_agency_context: agencyContext,
          }),
        },
      );

      if (!response.ok) throw new Error("Webhook failed");

      const data = await response.json();

      // Update local context from webhook response
      setContext({
        website_url: data.website_url || context.website_url,
        email: data.email || context.email,
      });

      const aiResponse =
        data.message ||
        "I've started generating your report. You should receive it soon.";
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: aiResponse,
        },
      ]);

      // Save AI Response
      await saveMessage("assistant", aiResponse);
    } catch (error) {
      console.error("Error submitting chat:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: "Sorry, I encountered an error. Please check the URL and try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Web Report Generator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Analyze any website and get a professional audit report.
          </p>
        </div>

        {/* Context Status Badges */}
        <div className="flex items-center gap-2">
          {context.website_url && (
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100 uppercase overflow-hidden max-w-[150px] truncate">
              {context.website_url.replace(/^https?:\/\//, "")}
            </span>
          )}
          {context.email && (
            <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-full border border-purple-100 uppercase overflow-hidden max-w-[150px] truncate">
              {context.email}
            </span>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
        >
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex gap-4 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.sender === "ai" ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-600"}`}
                >
                  {msg.sender === "ai" ? (
                    <FaRobot size={20} />
                  ) : (
                    <FaUserCircle size={24} />
                  )}
                </div>
                <div
                  className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed ${msg.sender === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-50 text-slate-800 rounded-tl-none shadow-sm"}`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Real-time Status Loaders */}
          {activeRequest &&
            (scrapeStatus === "scraping_web" ||
              scrapeStatus === "composing_web") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-200">
                  <FaRobot size={20} />
                </div>
                <div className="p-6 rounded-2xl bg-white border border-blue-100 shadow-md rounded-tl-none flex flex-col gap-3 min-w-[280px]">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                        <FaSpinner className="animate-spin text-lg" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        {scrapeStatus === "scraping_web" ? (
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                            Deep Technical Audit
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                            Drafting Report
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                          Live Analysis
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {scrapeStatus === "scraping_web"
                          ? "Our AI is currently performing a deep technical audit of the specified website."
                          : "Audit complete! Our AI is now synthesizing the data into a professional report."}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <FaRobot size={20} />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 rounded-tl-none flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 mt-auto relative">
          {/* Blocking Overlay for Lead Scraping (Only on active tasks) */}
          {(scrapeStatus === "scraping_leads" ||
            scrapeStatus === "verifying_leads") && (
            <div className="absolute inset-0 z-10 bg-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
              <div className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-xl">
                <FaClock className="text-indigo-500 animate-pulse" />
                <span className="text-sm font-bold text-slate-700 font-sans">
                  AI Busy with Lead Generation. Audit available once completed.
                </span>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex gap-2 max-w-4xl mx-auto items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-200"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={
                isTyping ||
                scrapeStatus === "scraping_leads" ||
                scrapeStatus === "verifying_leads" ||
                scrapeStatus === "scraping_web" ||
                scrapeStatus === "composing_web"
              }
              placeholder={
                scrapeStatus === "scraping_leads" ||
                scrapeStatus === "verifying_leads"
                  ? "AI is busy with another task..."
                  : activeRequest &&
                      (scrapeStatus === "scraping_web" ||
                        scrapeStatus === "composing_web")
                    ? "Generating your technical report..."
                    : "e.g. Generate a report for https://example.com and send to me@example.com"
              }
              className="flex-1 px-4 py-2 outline-none text-slate-700 placeholder:text-slate-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={
                isTyping ||
                !inputVal.trim() ||
                scrapeStatus === "scraping_leads" ||
                scrapeStatus === "verifying_leads" ||
                scrapeStatus === "scraping_web" ||
                scrapeStatus === "composing_web"
              }
              className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-100"
            >
              <FaPaperPlane size={16} />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-2 font-medium uppercase tracking-wider">
            Reports are typically generated and sent within 2 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
