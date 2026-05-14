"use client";

import React from "react";
import { FaCreditCard, FaLock } from "react-icons/fa";

export default function BillingPricingDocs() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-white mb-4">Pricing, Billing & Usage</h1>
        <p className="text-slate-400 text-lg">
          Understand how credits work, manage your subscriptions, and view usage limits.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-3xl mt-12 text-center px-6">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 relative">
          <FaCreditCard className="text-indigo-400" size={32} />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-800 rounded-full border-4 border-slate-900 flex items-center justify-center">
            <FaLock className="text-slate-400" size={12} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Coming Soon</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          We are actively working on finalizing our billing structure and usage tracking. Comprehensive documentation for Pricing, Billing & Usage will be available soon.
        </p>
      </div>
    </div>
  );
}
