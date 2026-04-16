import React from 'react';
import { FaCreditCard } from 'react-icons/fa';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Billing & Usage</h1>
      <div className="bg-white p-12 rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
           <FaCreditCard size={32} />
        </div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Subscription Management</h2>
        <p className="text-slate-500 max-w-sm">View your current usage, manage invoices, and upgrade your subscription plan. Coming Soon.</p>
      </div>
    </div>
  );
}
