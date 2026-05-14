"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaUserTie, FaBuilding, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { motion } from "framer-motion";

export default function EmailFinderDocs() {
  const [domain, setDomain] = useState("");
  const [emailResult, setEmailResult] = useState(null);
  const [isSearchingEmail, setIsSearchingEmail] = useState(false);
  const [key, setKey] = useState(0); // Used to restart the animation if needed

  const EMAIL_TARGET = "apple.com";

  useEffect(() => {
    // Reset state when component mounts or key changes
    setDomain("");
    setEmailResult(null);
    setIsSearchingEmail(false);

    const typingDelay = setTimeout(() => {
      let currentString = "";
      let charIndex = 0;

      const typingTimer = setInterval(() => {
        currentString += EMAIL_TARGET[charIndex];
        setDomain(currentString);
        charIndex++;

        if (charIndex === EMAIL_TARGET.length) {
          clearInterval(typingTimer);
          setTimeout(() => {
            triggerEmailSearch(EMAIL_TARGET);
          }, 800);
        }
      }, 100);

      return () => clearInterval(typingTimer);
    }, 1500);

    return () => clearTimeout(typingDelay);
  }, [key]);

  const triggerEmailSearch = (dom) => {
    setIsSearchingEmail(true);
    setEmailResult(null);

    setTimeout(() => {
      setIsSearchingEmail(false);
      setEmailResult({
        name: "Jane Doe",
        title: "CEO",
        email: `jane.doe@${dom}`,
        linkedin: `linkedin.com/in/janedoe-${dom.split(".")[0]}`,
      });
    }, 2000);
  };

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">Email Finder & Validation</h1>
        <p className="text-slate-400 text-lg">
          Detailed guide on locating professional emails, finding decision makers, and validating contact addresses.
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">How to Find Emails</h2>
        <p className="text-slate-400">
          The Email Finder provides several distinct methods for locating the right administrative and executive contacts.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-4 shadow-sm hover:border-indigo-500/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <FaBuilding size={18} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Domain Search</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Find generic and business-wide emails simply by typing in the <strong className="text-slate-200">domain of the business</strong> (e.g., <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">apple.com</code>). It will fetch available public company contacts.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-4 shadow-sm hover:border-indigo-500/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <FaUserTie size={18} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Specific Person Search</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                If you know who you are looking for, you can find them by entering the target <strong className="text-slate-200">domain and the full name</strong> of the person.
              </p>
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-4 shadow-sm hover:border-indigo-500/30 transition-colors md:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <FaSearch size={18} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Decision Maker Search</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Easily filter contacts by role. Enter the domain, and choose a <strong className="text-slate-200">decision maker category</strong> such as <span className="text-indigo-400">CEO/Director</span>, <span className="text-indigo-400">Finance</span>, or <span className="text-indigo-400">Marketing</span>. The system will retrieve the best fitting lead for that specific role.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Live Demonstration</h2>
        <p className="text-slate-400 mb-6 flex justify-between items-center">
          <span>Watch how the AI resolves a decision maker email:</span>
          <button 
            onClick={() => setKey(k => k + 1)}
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition"
          >
            Replay Demo
          </button>
        </p>

        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mt-8">
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-800"></div>
              <div className="w-3 h-3 rounded-full bg-slate-800"></div>
              <div className="w-3 h-3 rounded-full bg-slate-800"></div>
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-2">Email Finder Demo</span>
          </div>
          <div className="p-8">
            <div className="pointer-events-none space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">
                  Target Domain
                </label>
                <div className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-slate-300 flex items-center min-h-[48px]">
                  {domain || <span className="text-slate-600">e.g. apple.com</span>}
                  {domain.length > 0 && domain.length < EMAIL_TARGET.length && (
                    <span className="w-0.5 h-4 bg-indigo-500 animate-pulse ml-1"></span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">
                  Decision Maker Category
                </label>
                <div className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-slate-300 opacity-80">
                  CEO
                </div>
              </div>
              <button
                type="button"
                disabled
                className="w-full py-3 bg-indigo-600/50 text-indigo-200 font-semibold rounded-xl transition flex justify-center items-center mt-4 h-12 border border-indigo-500/20"
              >
                {isSearchingEmail ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching...</span>
                  </div>
                ) : (
                  "Find Contact"
                )}
              </button>
            </div>

            {emailResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-slate-950 p-6 rounded-2xl border border-green-500/30 shadow-md relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50"></div>
                <h4 className="text-sm font-bold text-green-400 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>{" "}
                  Verified Match Found!
                </h4>
                <div className="space-y-3 text-sm text-slate-300">
                  <p>
                    <span className="font-semibold text-slate-500 w-20 inline-block">
                      Name:
                    </span>{" "}
                    {emailResult.name}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500 w-20 inline-block">
                      Title:
                    </span>{" "}
                    {emailResult.title}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500 w-20 inline-block">
                      Email:
                    </span>{" "}
                    <span className="text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded">
                      {emailResult.email}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500 w-20 inline-block">
                      LinkedIn:
                    </span>{" "}
                    <span className="text-indigo-400 underline">
                      {emailResult.linkedin}
                    </span>
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Email Validation</h2>
        <p className="text-slate-400">
          The validation tool ensures that you don't waste time or harm your campaign's email reputation by sending to invalid addresses.
        </p>
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <ul className="space-y-4">
             <li className="flex gap-4">
               <FaCheckCircle className="text-green-400 shrink-0 mt-1" />
               <p className="text-slate-300">Enter any email address to check its validity. The tool performs a deeply integrated check across DNS records, SMTP validation, and catch-all analysis.</p>
             </li>
             <li className="flex items-start gap-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl mt-4">
               <FaExclamationTriangle className="text-orange-400 shrink-0 mt-0.5" />
               <div>
                 <strong className="block text-orange-400 mb-1">Important regarding free mail extensions</strong>
                 <p className="text-orange-200/80 text-sm leading-relaxed">
                   Single email validation is specifically designed for <strong>custom business domains</strong>. Extensions like <code className="bg-orange-500/20 px-1 py-0.5 rounded">gmail.com</code>, <code className="bg-orange-500/20 px-1 py-0.5 rounded">hotmail.com</code>, and <code className="bg-orange-500/20 px-1 py-0.5 rounded">yahoo.com</code> will typically return as invalid in this check as public mail servers mask their valid routing information.
                 </p>
               </div>
             </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
