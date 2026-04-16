"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaRobot,
  FaGlobe,
  FaSearch,
  FaPlus,
  FaList,
  FaDatabase,
  FaTable,
  FaBuilding,
  FaCreditCard,
  FaChartBar,
  FaCog,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaChevronRight,
  FaCoins, // Added for Credits icon
} from "react-icons/fa";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  // Mock credits - you can later replace this with a prop or fetch from Supabase
  const userCredits = 1250;

  const navigation = [
    {
      title: "AI Assistants",
      items: [
        {
          name: "Lead Generator",
          href: "/dashboard/lead-generator",
          icon: FaRobot,
        },
        {
          name: "Web Report Generator",
          href: "/dashboard/website-generator",
          icon: FaGlobe,
        },
        {
          name: "Email Finder",
          href: "/dashboard/email-finder",
          icon: FaSearch,
        },
      ],
    },
    {
      title: "Email Campaign",
      items: [
        { name: "New Campaign", href: "/dashboard/new-campaign", icon: FaPlus },
        {
          name: "View Campaigns",
          href: "/dashboard/view-campaigns",
          icon: FaList,
        },
      ],
    },
    {
      title: "Leads",
      items: [
        { name: "View Leads", href: "/dashboard/view-leads", icon: FaDatabase },
        { name: "Custom List", href: "/dashboard/custom-list", icon: FaTable },
      ],
    },
    {
      title: "Management",
      items: [
        {
          name: "Manage Organization",
          href: "/dashboard/manage-organization",
          icon: FaBuilding,
        },
        {
          name: "Billing & Usage",
          href: "/dashboard/billing",
          icon: FaCreditCard,
        },
        {
          name: "Reports & Analytics",
          href: "/dashboard/reports",
          icon: FaChartBar,
        },
        { name: "Settings", href: "/dashboard/settings", icon: FaCog },
      ],
    },
  ];

  const isActive = (href) => pathname === href;

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar Desktop */}
      <aside
        className={`${
          isSidebarOpen ? "w-72" : "w-20"
        } fixed inset-y-0 left-0 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out z-30 hidden md:flex flex-col`}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <FaRobot size={20} />
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-xl text-slate-900 tracking-tight">
                Lead Lev AI
              </span>
            )}
          </Link>
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
          {navigation.map((section, idx) => (
            <div key={idx} className="space-y-4">
              {isSidebarOpen && (
                <h3 className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                      isActive(item.href)
                        ? "bg-indigo-50 text-indigo-700 shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <item.icon
                      className={`${isActive(item.href) ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"} transition-colors`}
                      size={18}
                    />
                    {isSidebarOpen && (
                      <>
                        <span className="text-sm font-semibold flex-1">
                          {item.name}
                        </span>
                        {isActive(item.href) && <FaChevronRight size={10} />}
                      </>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* User Footer - Moved UserButton here */}
        <div className="p-4 border-t border-slate-100">
          <div
            className={`flex items-center ${isSidebarOpen ? "justify-between" : "justify-center"} bg-slate-50 rounded-2xl p-2 border border-slate-100`}
          >
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/" />
              {isSidebarOpen && (
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900">
                    Profile
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium leading-none">
                    Account Settings
                  </span>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <FaChevronRight size={10} className="text-slate-400 mr-2" />
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "md:ml-72" : "md:ml-20"
        }`}
      >
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <FaBars size={20} />
            </button>
            <div className="hidden sm:block">
              <nav className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <span>Dashboard</span>
                {pathname !== "/dashboard" && (
                  <>
                    <FaChevronRight size={8} />
                    <span className="text-slate-900 capitalize">
                      {pathname.split("/").pop().replace(/-/g, " ")}
                    </span>
                  </>
                )}
              </nav>
            </div>
          </div>

          {/* Credits Section - Replacing old UserButton location */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <FaCoins size={14} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter leading-none">
                  Available Credits
                </span>
                <span className="text-sm font-extrabold text-indigo-900 leading-tight">
                  {userCredits.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
