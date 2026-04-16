import React from 'react';
import { FaCog } from 'react-icons/fa';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <div className="bg-white p-12 rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mb-4">
           <FaCog size={32} />
        </div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Account Settings</h2>
        <p className="text-slate-500 max-w-sm">Manage your profile, security preferences, and integration API keys here. Coming Soon.</p>
      </div>
    </div>
  );
}
