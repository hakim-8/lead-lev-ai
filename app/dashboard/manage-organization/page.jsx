import React from 'react';
import { FaBuilding } from 'react-icons/fa';

export default function ManageOrganizationPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Manage Organization</h1>
      <div className="bg-white p-12 rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mb-4">
           <FaBuilding size={32} />
        </div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Team & Organization</h2>
        <p className="text-slate-500 max-w-sm">Manage your team members, roles, and organization-wide configurations. Coming Soon.</p>
      </div>
    </div>
  );
}
