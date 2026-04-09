import React from 'react';
import { FaRobot } from 'react-icons/fa';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <FaRobot size={40} />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Welcome to Lead Lev AI</h1>
      <p className="text-lg text-slate-600 max-w-lg mb-8">
        This is your dashboard placeholder. We will integrate Clerk authentication here soon to unlock all features.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl mt-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
             <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
             <div className="h-2 w-full bg-slate-100 rounded mt-4"></div>
             <div className="h-2 w-5/6 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
