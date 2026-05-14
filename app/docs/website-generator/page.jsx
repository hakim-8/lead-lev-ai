"use client";

import React, { useState, useRef, useEffect } from "react";
import { FaRobot, FaUserCircle, FaPaperPlane, FaGlobe } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function WebsiteGeneratorDocs() {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const REPORT_TARGET =
    "write me a report on this page: https://revlaunchdigital.com and send it to this email: info@revlaunchdigital.com";

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    setMessages([
      {
        id: "1",
        sender: "ai",
        text: "Hello! I can generate reports on any website, just give me the url and an email address to send the report to!",
      },
    ]);

    const typingDelay = setTimeout(() => {
      let currentString = "";
      let charIndex = 0;

      const typingTimer = setInterval(() => {
        currentString += REPORT_TARGET[charIndex];
        setInputVal(currentString);
        charIndex++;

        if (charIndex === REPORT_TARGET.length) {
          clearInterval(typingTimer);
          setTimeout(() => {
            triggerChatSubmit(REPORT_TARGET);
          }, 800);
        }
      }, 50);

      return () => clearInterval(typingTimer);
    }, 1500);

    return () => clearTimeout(typingDelay);
  }, []);

  const triggerChatSubmit = (userText) => {
    setInputVal("");
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: "user", text: userText },
    ]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { 
          id: (Date.now() + 1).toString(), 
          sender: "ai", 
          text: "The report has been sent to your email." 
        },
      ]);
    }, 1500);
  };

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">Website Report Generator</h1>
        <p className="text-slate-400 text-lg">
          Learn how to request comprehensive AI-generated audits and reports for any website.
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">How it Works</h2>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex gap-6 items-start">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
            <FaGlobe size={24} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Simple Requests</h3>
            <p className="text-slate-400 leading-relaxed">
              All you need to do is provide an <strong className="text-white">email address</strong> and a <strong className="text-white">website URL</strong>. 
              The system will analyze the target site, compile a detailed report, and have it generated and sent directly over to the provided email address.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Live Demonstration</h2>
        <p className="text-slate-400 mb-6">
          Watch the AI process a report request in real-time below:
        </p>

        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mt-8">
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-800"></div>
              <div className="w-3 h-3 rounded-full bg-slate-800"></div>
              <div className="w-3 h-3 rounded-full bg-slate-800"></div>
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-2">Web Report Demo</span>
          </div>
          <div className="h-[400px] flex flex-col">
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
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        msg.sender === "ai" 
                          ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" 
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {msg.sender === "ai" ? <FaRobot size={18} /> : <FaUserCircle size={20} />}
                    </div>
                    <div
                      className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${
                        msg.sender === "user" 
                          ? "bg-indigo-600 text-white rounded-tr-none" 
                          : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none"
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <FaRobot size={18} />
                  </div>
                  <div className="px-5 py-4 rounded-xl bg-slate-800 border border-slate-700 rounded-tl-none flex items-center gap-1.5 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 bg-slate-900 border-t border-slate-800">
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex gap-2 relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-1 shadow-inner"
              >
                <input
                  type="text"
                  readOnly
                  value={inputVal}
                  placeholder="e.g., Write a report on https://example.com"
                  className="flex-1 bg-transparent px-4 py-2 outline-none text-sm text-slate-300 pointer-events-none placeholder-slate-600"
                />
                <button
                  type="button"
                  disabled
                  className="w-10 h-10 bg-indigo-600/50 text-indigo-200 flex justify-center items-center rounded-lg transition disabled:opacity-50"
                >
                  <FaPaperPlane className="text-sm -ml-1" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
