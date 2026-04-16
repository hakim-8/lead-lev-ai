import React from 'react';
import { FaChartBar } from 'react-icons/fa';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
      <div className="bg-white p-12 rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mb-4">
           <FaChartBar size={32} />
        </div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Detailed Insights</h2>
        <p className="text-slate-500 max-w-sm">Access comprehensive reports on your lead generation and email campaign performance. Coming Soon.</p>
      </div>
    </div>
  );
}
