import React from 'react';
import { FaDatabase } from 'react-icons/fa';

export default function ViewLeadsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">View Leads</h1>
      <div className="bg-white p-12 rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-16 h-16 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mb-4">
           <FaDatabase size={32} />
        </div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Lead Database</h2>
        <p className="text-slate-500 max-w-sm">Manage all the leads you have collected through our AI scrapers and finders. Coming Soon.</p>
      </div>
    </div>
  );
}
