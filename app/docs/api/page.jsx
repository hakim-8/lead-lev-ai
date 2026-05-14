"use client";

import React from "react";
import { FaCode, FaTools } from "react-icons/fa";

export default function ApiDocs() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">API Documentation</h1>
        <p className="text-slate-400 text-lg">
          Integrate Lead Lev AI into your own applications and workflows.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-3xl mt-12 text-center px-6">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 relative">
          <FaCode className="text-indigo-400" size={32} />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-800 rounded-full border-4 border-slate-900 flex items-center justify-center">
            <FaTools className="text-slate-400" size={12} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Coming Soon</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          We are currently working hard on our public API. The API will be available very soon, providing programmatic access to lead generation, email finding, and report capabilities.
        </p>
      </div>
    </div>
  );
}
