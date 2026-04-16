"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { FaPaperPlane, FaRobot, FaUserCircle } from "react-icons/fa";
import { supabase } from "../../lib/supabase";

export default function LeadGeneratorPage() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState({
    business_type: null,
    location: null,
    result_count: null,
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
        text: "Hi! To get started, please tell me the business type, location, and how many results you need (e.g. 'find me 100 restaurants in Nairobi'). I'll then find the best leads for you!",
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
          request_type: "lead_generator",
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
      });

      if (!response.ok) throw new Error("Webhook failed");

      const data = await response.json();
      
      // Update local context from webhook response
      setContext({
        business_type: data.business_type || context.business_type,
        location: data.location || context.location,
        result_count: data.result_count || context.result_count,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: data.message || "I've processed your request.",
        },
      ]);
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
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.sender === "ai" ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-600"}`}>
                  {msg.sender === "ai" ? <FaRobot size={20} /> : <FaUserCircle size={24} />}
                </div>
                <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed ${msg.sender === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none shadow-sm"}`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
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
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 mt-auto">
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Find me 100 construction companies in Nairobi..."
              className="flex-1 px-4 py-2 outline-none text-slate-700 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={isTyping || !inputVal.trim()}
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
