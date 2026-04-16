"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { FaPaperPlane, FaRobot, FaUserCircle } from "react-icons/fa";
import { supabase } from "../../lib/supabase";

export default function WebReportGeneratorPage() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState({
    website_url: null,
    email: null,
  });
  const [agencyContext, setAgencyContext] = useState(null);
  
  const scrollContainerRef = useRef(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
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

  // Initial Welcome Message
  useEffect(() => {
    setMessages([
      {
        id: "initial",
        sender: "ai",
        text: "Hello! I can generate detailed website optimization reports. Just provide a URL and an email address to send the report to (e.g., 'write me a report on https://revlaunchdigital.com and send it to info@revlaunchdigital.com').",
      },
    ]);
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isTyping) return;

    const userMessage = inputVal;
    setInputVal("");
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: "user", text: userMessage },
    ]);
    setIsTyping(true);

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL, {
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
      });

      if (!response.ok) throw new Error("Webhook failed");

      const data = await response.json();
      
      // Update local context from webhook response
      setContext({
        website_url: data.website_url || context.website_url,
        email: data.email || context.email,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: data.message || "I've started generating your report. You should receive it soon.",
        },
      ]);
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
          <h1 className="text-2xl font-bold text-slate-900">Web Report Generator</h1>
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
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.sender === "ai" ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-600"}`}>
                  {msg.sender === "ai" ? <FaRobot size={20} /> : <FaUserCircle size={24} />}
                </div>
                <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed ${msg.sender === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-50 text-slate-800 rounded-tl-none shadow-sm"}`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
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
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 mt-auto">
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Generate a report for https://example.com and send to me@example.com"
              className="flex-1 px-4 py-2 outline-none text-slate-700 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={isTyping || !inputVal.trim()}
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
