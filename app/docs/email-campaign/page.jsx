"use client";

import React from "react";
import { FaPaperPlane, FaListAlt, FaClock, FaBullseye, FaEye, FaRobot } from "react-icons/fa";

export default function EmailCampaignDocs() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">Email Campaign Setup</h1>
        <p className="text-slate-400 text-lg">
          Configure, generate, and launch a fully autonomous AI-driven cold outreach campaign.
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Launching a New Campaign</h2>
        <p className="text-slate-400">
          To get started, visit the <strong className="text-white">New Campaign page</strong>. Follow the steps below to instruct the AI on how to handle the outreach.
        </p>
        
        <div className="relative border-l border-slate-800 ml-3 md:ml-4 space-y-8 mt-8">
          
          <div className="relative pl-8 md:pl-10">
            <div className="absolute left-[-16px] top-1 w-8 h-8 rounded-full bg-slate-900 border-2 border-indigo-500/50 flex items-center justify-center">
              <span className="text-indigo-400 font-bold text-xs">1</span>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Campaign Name & List Selection</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Enter a recognizable name for your campaign. Next, you must select the target audience by choosing one of your <strong className="text-slate-200">AI generated lists</strong> or your manually created <strong className="text-slate-200">custom lists</strong>.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50 mt-2">
              <FaListAlt className="text-indigo-400" size={14} />
              <span className="text-xs font-medium text-slate-300">Select List to apply leads</span>
            </div>
          </div>

          <div className="relative pl-8 md:pl-10">
            <div className="absolute left-[-16px] top-1 w-8 h-8 rounded-full bg-slate-900 border-2 border-indigo-500/50 flex items-center justify-center">
              <span className="text-indigo-400 font-bold text-xs">2</span>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Follow-up Sequences</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Define your cadence by entering the <strong className="text-slate-200">number of follow up emails</strong> that should be sent per lead in the event of no response. Then, specify the <strong className="text-slate-200">time intervals</strong> (e.g., days) between each of these follow-ups.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50 mt-4">
              <FaClock className="text-indigo-400" size={14} />
              <span className="text-xs font-medium text-slate-300">Configure intervals</span>
            </div>
          </div>

          <div className="relative pl-8 md:pl-10">
            <div className="absolute left-[-16px] top-1 w-8 h-8 rounded-full bg-slate-900 border-2 border-indigo-500/50 flex items-center justify-center">
              <span className="text-indigo-400 font-bold text-xs">3</span>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Messaging Strategy</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              This dictates how the AI formulates the email content. You must select:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-sm text-slate-400 ml-1">
              <li><strong className="text-slate-200">Subject:</strong> The premise of the cold email (e.g., Discount offer)</li>
              <li><strong className="text-slate-200">Tone:</strong> The personality of the email (e.g., Professional, Friendly, Robotic, Team)</li>
              <li><strong className="text-slate-200">Conversion Goal:</strong> What you want the lead to do (e.g., <span className="text-indigo-300">"get a phone call"</span> or <span className="text-indigo-300">"visit a link"</span>)</li>
            </ul>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50 mt-4">
              <FaBullseye className="text-indigo-400" size={14} />
              <span className="text-xs font-medium text-slate-300">Set conversion goal</span>
            </div>
          </div>

          <div className="relative pl-8 md:pl-10">
            <div className="absolute left-[-16px] top-1 w-8 h-8 rounded-full bg-slate-900 border-2 border-indigo-500/50 flex items-center justify-center">
              <span className="text-indigo-400 font-bold text-xs">4</span>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Preview & Launch</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Before confirming, you can <strong>view a preview email</strong> generated using a sample lead from your selected list. If you are satisfied with the AI generation, you can launch the campaign.
            </p>
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-start gap-4 inline-block mt-2">
               <FaRobot className="text-indigo-400 shrink-0 mt-1" size={20} />
               <p className="text-indigo-200 text-sm">
                 Once launched, the AI will completely automate your <strong className="text-indigo-100">cold outreach</strong>, queuing initial emails and processing the set follow-up schedules.
               </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
