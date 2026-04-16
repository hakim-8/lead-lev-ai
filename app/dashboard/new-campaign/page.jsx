import React from 'react';
import { FaPlus } from 'react-icons/fa';

export default function NewCampaignPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">New Email Campaign</h1>
      <div className="bg-white p-12 rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
           <FaPlus size={32} />
        </div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Create New Campaign</h2>
        <p className="text-slate-500 max-w-sm">Launch a new targeted email sequence with AI-powered copy and scheduling. Coming Soon.</p>
      </div>
    </div>
  );
}
