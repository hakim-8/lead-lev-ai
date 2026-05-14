"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { FaRobot, FaUserCircle, FaPaperPlane } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function LeadGeneratorDocs() {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const LEADS_TARGET = "find me 100 construction companies in Nairobi";

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    setMessages([
      {
        id: "1",
        sender: "ai",
        text: 'Hi! Tell me what companies or businesses you are looking for (e.g. "find me 100 construction companies in Nairobi").',
      },
    ]);

    const typingDelay = setTimeout(() => {
      let currentString = "";
      let charIndex = 0;

      const typingTimer = setInterval(() => {
        currentString += LEADS_TARGET[charIndex];
        setInputVal(currentString);
        charIndex++;

        if (charIndex === LEADS_TARGET.length) {
          clearInterval(typingTimer);
          setTimeout(() => {
            triggerChatSubmit(LEADS_TARGET);
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
          text: "Your results have been collected, you can view them in the view leads page." 
        },
      ]);
    }, 1500);
  };

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">Lead Generator Documentation</h1>
        <p className="text-slate-400 text-lg">
          Learn how to generate high-quality leads effortlessly using our AI-powered Lead Generator.
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">How it Works</h2>
        <p className="text-slate-400">
          All you need to do is enter details such as the <strong className="text-white">business type</strong>, <strong className="text-white">location</strong>, and the <strong className="text-white">number of results</strong> you want, and the AI will handle the rest.
        </p>
        
        {/* Interactive Demo */}
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mt-8">
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-800"></div>
              <div className="w-3 h-3 rounded-full bg-slate-800"></div>
              <div className="w-3 h-3 rounded-full bg-slate-800"></div>
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-2">Live Demonstration</span>
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
                  placeholder="e.g., Target 100 construction companies in Nairobi"
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

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Viewing Collected Leads</h2>
        <p className="text-slate-400">
          After the AI finishes generating and processing your request, all the collected leads are automatically compiled and listed in the <strong className="text-white">View Leads</strong> page.
        </p>
        
        <div className="rounded-2xl border border-slate-800 overflow-hidden relative shadow-2xl">
          <Image 
            src="/lead-list-sc.png" 
            alt="Lead List View" 
            width={1200} 
            height={800} 
            className="w-full h-auto"
          />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Custom Lists & Email Verification</h2>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-slate-400 mb-6 font-medium leading-relaxed">
            Need to manage your own specialized contacts outside of the generated leads? You can create <strong>Custom Lists</strong> by visiting the Custom List page. 
          </p>
          <ul className="space-y-4 text-slate-400">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold border border-indigo-500/30">1</div>
              <span>Enter the name of your new custom list to initialize it.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold border border-indigo-500/30">2</div>
              <span>Add your own leads manually into the newly created list.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold border border-indigo-500/30">3</div>
              <span>Use the <strong className="text-white">Verify Emails</strong> button to automatically check the validity of all emails within your custom list.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
