"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { FaPaperPlane, FaRobot, FaUserCircle, FaSpinner, FaExternalLinkAlt, FaClock } from "react-icons/fa";
import { supabase } from "../../lib/supabase";
import { useScrapeStatus } from "../../../hooks/useScrapeStatus";
import Link from "next/link";

export default function LeadGeneratorPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState({
    business_type: null,
    location: null,
    result_count: null,
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
      // Only load when both Clerk and Org info are definitive
      if (!(isUserLoaded && isOrgLoaded) || !orgId) return;
      
      console.log("Fetching chat history for org:", orgId);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("org_id", orgId)
        .eq("type", "lead_generator")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
      }

      if (data && data.length > 0) {
        setMessages(data.map(m => ({
          id: m.id,
          sender: m.role === 'assistant' ? 'ai' : 'user',
          text: m.content
        })));
      } else {
        // Initial Welcome if no history found in DB
        setMessages([
          {
            id: "initial",
            sender: "ai",
            text: "Hi! To get started, please tell me the business type, location, and how many results you need (e.g. 'find me 100 restaurants in Nairobi'). I'll then find the best leads for you!",
          },
        ]);
      }
      setIsInitialLoading(false);
    }
    loadMessages();
  }, [orgId, isUserLoaded, isOrgLoaded]);

  // Ref to track if we've already shown completion message for the current status session
  const processedStatusRef = useRef(null);

  // Handle "Completed" Status Transition
  useEffect(() => {
    // Only fire when status is completed and we haven't processed this specific transition yet
    if (scrapeStatus === 'completed_leads' && processedStatusRef.current !== 'completed_leads') {
      const completionText = "Great news! Your leads have been collected and verified. You can access the full list in your dashboard.";
      
      const aiMsg = {
        id: Date.now().toString(),
        sender: "ai",
        text: completionText,
        isCompletion: true
      };
      
      setMessages(prev => {
        // Double check against last message just in case history loaded late
        if (prev.length > 0 && prev[prev.length - 1].text === completionText) return prev;
        return [...prev, aiMsg];
      });
      
      saveMessage("assistant", completionText);
      processedStatusRef.current = 'completed_leads';
      
      // Auto-reset status after a short delay to keep the UI clean
      setTimeout(() => {
        resetStatus();
        processedStatusRef.current = null; // Prepare for next session
      }, 5000);
    } 
    // Reset the ref if status changes back to something else (null or active)
    else if (scrapeStatus !== 'completed_leads' && scrapeStatus !== null) {
      processedStatusRef.current = scrapeStatus;
    }
  }, [scrapeStatus, resetStatus]);

  const saveMessage = async (role, content) => {
    if (!orgId) {
      console.warn("Save skipped: orgId not yet available");
      return;
    }
    
    // Normalize role to 'user' or 'assistant'
    const normalizedRole = role === 'ai' ? 'assistant' : (role === 'user' ? 'user' : role);
    
    try {
      console.log(`Saving ${normalizedRole} message to DB for org: ${orgId}`);
      const { error } = await supabase.from("chat_messages").insert({
        org_id: orgId,
        user_id: user?.id,
        role: normalizedRole,
        content: content,
        type: "lead_generator"
      });
      
      if (error) {
        console.error("Supabase Save Error:", error.message, error.details);
        throw error;
      } else {
        console.log("Message saved successfully");
      }
    } catch (err) {
      console.error("Critical: Failed to save chat message to Supabase:", err);
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
            request_type: "lead_generation",
            previous_context: {
              business_type: context.business_type,
              result_count: context.result_count,
              location: context.location,
            },
            chat_message: userMessage,
            user_id: user?.id,
            org_id: organization?.id || user?.id, // Fallback to user_id if no org
            requesting_agency_context: agencyContext,
          }),
        },
      );

      if (!response.ok) throw new Error("Webhook failed");

      const data = await response.json();

      // Update local context from webhook response
      setContext({
        business_type: data.business_type || context.business_type,
        location: data.location || context.location,
        result_count: data.result_count || context.result_count,
      });

      const aiResponse = data.message || "I've processed your request.";
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
          text: "Sorry, I encountered an error. Please try again later.",
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
          <h1 className="text-2xl font-bold text-slate-900">Lead Generator</h1>
          <p className="text-sm text-slate-500 mt-1">
            Find niche construction companies and more with AI.
          </p>
        </div>

        {/* Context Status Badges */}
        <div className="flex items-center gap-2">
          {context.business_type && (
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100 uppercase">
              {context.business_type}
            </span>
          )}
          {context.location && (
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100 uppercase">
              {context.location}
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
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.sender === "ai" ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-600"}`}
                >
                  {msg.sender === "ai" ? (
                    <FaRobot size={20} />
                  ) : (
                    <FaUserCircle size={24} />
                  )}
                </div>
                <div
                  className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed ${msg.sender === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none shadow-sm"}`}
                >
                  {msg.text}
                  {msg.isCompletion && (
                    <div className="mt-4">
                      <Link 
                        href="/dashboard/view-leads"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all inline-flex"
                      >
                        <FaExternalLinkAlt size={10} /> View Leads Collection
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Real-time Status Loaders */}
          {(scrapeStatus === 'scraping_leads' || scrapeStatus === 'verifying_leads') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm border border-indigo-200">
                <FaRobot size={20} />
              </div>
              <div className="p-6 rounded-2xl bg-white border border-indigo-100 shadow-md rounded-tl-none flex flex-col gap-3 min-w-[280px]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                      <FaSpinner className="animate-spin text-lg" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      {scrapeStatus === 'scraping_leads' ? (
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                           Researching Leads
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                           Verifying Data
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">Live Status</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {scrapeStatus === 'scraping_leads' 
                        ? "Our AI is currently scouring the web for high-quality leads matching your criteria."
                        : "Leads found! We are now verifying each email to ensure maximum deliverability."}
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
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <FaRobot size={20} />
              </div>
              <div className="p-4 rounded-2xl bg-slate-100 rounded-tl-none flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 mt-auto relative">
          {/* Blocking Overlay for Web Audit (Only on active tasks) */}
          {(scrapeStatus === 'scraping_web' || scrapeStatus === 'composing_web') && (
            <div className="absolute inset-0 z-10 bg-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
              <div className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-xl">
                <FaClock className="text-amber-500 animate-pulse" />
                <span className="text-sm font-bold text-slate-700">
                  AI Busy with Website Audit. Lead generation available soon.
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
              disabled={isTyping || (scrapeStatus === 'scraping_web' || scrapeStatus === 'composing_web') || (activeRequest && (scrapeStatus === 'scraping_leads' || scrapeStatus === 'verifying_leads'))}
              placeholder={(scrapeStatus === 'scraping_web' || scrapeStatus === 'composing_web') ? "AI is busy with another task..." : (activeRequest && (scrapeStatus === 'scraping_leads' || scrapeStatus === 'verifying_leads')) ? "AI is searching for leads..." : "e.g. Find me 100 construction companies in Nairobi..."}
              className="flex-1 px-4 py-2 outline-none text-slate-700 placeholder:text-slate-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isTyping || !inputVal.trim() || (scrapeStatus === 'scraping_web' || scrapeStatus === 'composing_web') || (activeRequest && (scrapeStatus === 'scraping_leads' || scrapeStatus === 'verifying_leads'))}
              className="w-10 h-10 bg-indigo-600 text-white flex items-center justify-center rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-100"
            >
              <FaPaperPlane size={16} />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
            Shift + Enter for new line. Powered by Advanced AI Context.
          </p>
        </div>
      </div>
    </div>
  );
}
