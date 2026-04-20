"use client";

import React, { useState, useEffect, useRef } from "react";
import { SignUp } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaRobot,
  FaUserCircle,
  FaGlobe,
  FaSearch,
  FaEnvelopeOpen,
} from "react-icons/fa";
import Loader from "../../../components/Loader";

const STEPS = [
  {
    id: "leads",
    name: "Lead Generator",
    icon: FaRobot,
    color: "indigo",
    target: "find me 100 construction companies in Nairobi",
    response:
      "I've collected 100 construction companies in Nairobi. You can view them in the dashboard.",
  },
  {
    id: "report",
    name: "Website Report",
    icon: FaGlobe,
    color: "blue",
    target: "https://revlaunchdigital.com",
    response:
      "Generated a 15-page optimization report for revlaunchdigital.com. Sent to your email.",
  },
  {
    id: "email",
    name: "Email Finder",
    icon: FaSearch,
    color: "purple",
    target: "apple.com",
    response: {
      name: "Tim Cook",
      title: "CEO",
      email: "tim.cook@apple.com",
      linkedin: "linkedin.com/in/tim-cook",
    },
  },
];

export default function SignUpPage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  const [isSearchingEmail, setIsSearchingEmail] = useState(false);

  const step = STEPS[activeIdx];
  const typingTimerRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    startAnimation();

    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, [activeIdx]);

  const startAnimation = () => {
    setMessages([]);
    setInputVal("");
    setEmailResult(null);
    setIsTyping(false);
    setIsSearchingEmail(false);

    const initialAiMsg =
      activeIdx === 0
        ? "Hi! Tell me what companies you are looking for."
        : activeIdx === 1
          ? "Hello! Enter a website URL to generate a full report."
          : "";

    if (initialAiMsg) {
      setMessages([{ id: "1", sender: "ai", text: initialAiMsg }]);
    }

    transitionTimerRef.current = setTimeout(() => {
      let currentString = "";
      let charIndex = 0;
      const targetText = step.target;

      typingTimerRef.current = setInterval(() => {
        currentString += targetText[charIndex];
        setInputVal(currentString);
        charIndex++;

        if (charIndex === targetText.length) {
          if (typingTimerRef.current) clearInterval(typingTimerRef.current);

          transitionTimerRef.current = setTimeout(() => {
            handleSubmission(targetText);
          }, 800);
        }
      }, 40);
    }, 1200);
  };

  const handleSubmission = (text) => {
    if (activeIdx === 2) {
      // Email Finder Form Logic
      setIsSearchingEmail(true);
      transitionTimerRef.current = setTimeout(() => {
        setIsSearchingEmail(false);
        setEmailResult(step.response);

        transitionTimerRef.current = setTimeout(() => {
          setActiveIdx((prev) => (prev + 1) % STEPS.length);
        }, 4000);
      }, 2000);
    } else {
      // Chat Logic
      setInputVal("");
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: "user", text },
      ]);
      setIsTyping(true);

      transitionTimerRef.current = setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "ai",
            text: step.response,
          },
        ]);

        transitionTimerRef.current = setTimeout(() => {
          setActiveIdx((prev) => (prev + 1) % STEPS.length);
        }, 4000);
      }, 1500);
    }
  };

  const getColorClass = (color, type) => {
    const colors = {
      indigo: {
        bg: "bg-indigo-600",
        text: "text-indigo-400",
        border: "border-indigo-500/20",
        light: "bg-indigo-600/10",
      },
      blue: {
        bg: "bg-blue-600",
        text: "text-blue-400",
        border: "border-blue-500/20",
        light: "bg-blue-600/10",
      },
      purple: {
        bg: "bg-purple-600",
        text: "text-purple-400",
        border: "border-purple-500/20",
        light: "bg-purple-600/10",
      },
    };
    return colors[color][type];
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#0f1015]">
      {/* Left Side: Auth Section */}
      <div className="flex items-center justify-center p-8 bg-slate-950/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent opacity-50"></div>
        <SignUp
          path="/sign-up"
          routing="path"
          forceRedirectUrl="/oboarding"
          appearance={{
            variables: {
              colorPrimary: "#4f46e5",
              colorText: "#ffffff",
              colorInputText: "#ffffff",
              colorTextSecondary: "#94a3b8",
            },
            elements: {
              card: "border border-slate-800/50 shadow-[0_0_20px_rgba(79,70,229,0.1)] bg-[#0f1015]",
              headerTitle: "text-2xl font-bold",
              socialButtonsBlockButton:
                "border-slate-700 hover:border-indigo-500 transition-all text-white",
              formFieldLabel: "text-slate-300",
              formFieldInput: "bg-[#1a1c23] border-slate-800 text-white",
              footerActionLink: "text-indigo-400 hover:text-indigo-300",
              dividerLine: "bg-slate-800",
              dividerText: "text-slate-500",
            },
          }}
        />
      </div>

      {/* Right Side: Demo Section */}
      <div className="hidden lg:flex bg-[#0a0b10] border-l border-slate-900 overflow-hidden relative">
        <div className="w-full h-full flex flex-col p-8 lg:p-12 justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">
            {/* Stage Title */}
            <div className="text-center">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 mb-4"
              >
                <div
                  className={`w-2 h-2 rounded-full ${getColorClass(step.color, "bg")} animate-pulse`}
                ></div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                  {step.name}
                </span>
              </motion.div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Experience automated excellence.
              </h2>
              <p className="text-slate-500 mt-2 text-sm">
                Watch how our AI handles complex workflows in seconds.
              </p>
            </div>

            {/* Dynamic Preview Box */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[400px]">
              {/* Content Switching */}
              <div
                className="flex-1 overflow-y-auto p-6 scrollbar-hide"
                ref={scrollContainerRef}
              >
                <AnimatePresence mode="wait">
                  {activeIdx !== 2 ? (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === "ai" ? getColorClass(step.color, "light") + " " + getColorClass(step.color, "text") : "bg-slate-800 text-slate-400"}`}
                          >
                            {msg.sender === "ai" ? (
                              <FaRobot size={16} />
                            ) : (
                              <FaUserCircle size={18} />
                            )}
                          </div>
                          <div
                            className={`p-3 rounded-2xl text-sm max-w-[85%] leading-relaxed ${msg.sender === "user" ? getColorClass(step.color, "bg") + " text-white rounded-tr-none" : "bg-slate-800 text-slate-300 rounded-tl-none"}`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getColorClass(step.color, "light") + " " + getColorClass(step.color, "text")}`}
                          >
                            <FaRobot size={16} />
                          </div>
                          <div className="p-3 rounded-2xl bg-slate-800 rounded-tl-none flex items-center gap-1">
                            <div
                              className={`w-1.5 h-1.5 ${getColorClass(step.color, "bg")} rounded-full animate-bounce`}
                            ></div>
                            <div
                              className={`w-1.5 h-1.5 ${getColorClass(step.color, "bg")} rounded-full animate-bounce delay-100`}
                            ></div>
                            <div
                              className={`w-1.5 h-1.5 ${getColorClass(step.color, "bg")} rounded-full animate-bounce delay-200`}
                            ></div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-4"
                    >
                      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Target Domain
                          </label>
                          <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white">
                            {inputVal || step.target}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Search Mode
                          </label>
                          <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-400">
                            CEO / Decision Makers
                          </div>
                        </div>
                        <button
                          className={`w-full py-2 ${getColorClass(step.color, "bg")} text-white text-xs font-bold rounded-lg transition-opacity flex justify-center items-center h-9`}
                        >
                          {isSearchingEmail ? (
                            <Loader size={16} className="text-white" />
                          ) : (
                            "Find Verified Contacts"
                          )}
                        </button>
                      </div>

                      {emailResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 ${getColorClass(step.color, "light")} border ${getColorClass(step.color, "border")} rounded-2xl`}
                        >
                          <div
                            className={`text-[10px] font-bold ${getColorClass(step.color, "text")} uppercase mb-2`}
                          >
                            Verified Match Found
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="text-white font-bold">
                              {emailResult.name}
                            </div>
                            <div className="text-slate-400">
                              {emailResult.title}
                            </div>
                            <div
                              className={`${getColorClass(step.color, "text")} underline font-medium`}
                            >
                              {emailResult.email}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chat Input (Visible only for chat steps) */}
              <AnimatePresence>
                {activeIdx !== 2 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-4 bg-slate-900 border-t border-slate-800"
                  >
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        readOnly
                        value={inputVal}
                        placeholder="Ask AI anything..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none"
                      />
                      <div
                        className={`absolute right-2 w-8 h-8 ${getColorClass(step.color, "bg")} rounded-lg flex items-center justify-center text-white`}
                      >
                        <FaEnvelopeOpen size={14} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-3 mt-4">
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${activeIdx === i ? getColorClass(s.color, "bg") : "bg-slate-800"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
