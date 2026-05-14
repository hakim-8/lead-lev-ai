"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaRobot,
  FaGlobe,
  FaSearch,
  FaPaperPlane,
  FaCode,
  FaCreditCard,
  FaBars,
  FaTimes,
  FaChevronRight,
  FaArrowLeft,
} from "react-icons/fa";

export default function DocsLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  const navigation = [
    {
      title: "Core Features",
      items: [
        {
          name: "Lead Generator",
          href: "/docs/lead-generator",
          icon: FaRobot,
        },
        {
          name: "Website Report Generator",
          href: "/docs/website-generator",
          icon: FaGlobe,
        },
        {
          name: "Email Finder",
          href: "/docs/email-finder",
          icon: FaSearch,
        },
        {
          name: "Email Campaign",
          href: "/docs/email-campaign",
          icon: FaPaperPlane,
        },
      ],
    },
    {
      title: "Developers",
      items: [
        { name: "API Documentation", href: "/docs/api", icon: FaCode },
      ],
    },
    {
      title: "Account",
      items: [
        {
          name: "Billing & Pricing",
          href: "/docs/billing-pricing",
          icon: FaCreditCard,
        },
      ],
    },
  ];

  const isActive = (href) => pathname === href || pathname === `/docs` && href === "/docs/lead-generator";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Sidebar Desktop */}
      <aside
        className={`${
          isSidebarOpen ? "w-72" : "w-20"
        } left-0 bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out z-30 md:flex flex-col shrink-0`}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/50">
              <FaRobot size={20} />
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-xl text-white tracking-tight">
                Documentation
              </span>
            )}
          </Link>
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
          {navigation.map((section, idx) => (
            <div key={idx} className="space-y-4">
              {isSidebarOpen && (
                <h3 className="px-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const baseClass = `w-full flex cursor-pointer items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    active
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`;

                  return (
                    <Link key={item.href} href={item.href} className={baseClass}>
                      <item.icon
                        className={`${
                          active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                        } transition-colors`}
                        size={18}
                      />
                      {isSidebarOpen && (
                        <>
                          <span className="text-sm font-medium flex-1 text-left">
                            {item.name}
                          </span>
                          {active && <FaChevronRight size={10} className="text-indigo-500" />}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Back to App Section */}
        <div className="p-4 border-t border-slate-800">
          <Link 
            href="/dashboard"
            className={`flex items-center ${
              isSidebarOpen ? "justify-center gap-2" : "justify-center px-0"
            } py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700`}
          >
            <FaArrowLeft size={14} />
            {isSidebarOpen && <span className="text-sm font-semibold">Back to Dashboard</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Header */}
        <header className="h-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
            >
              {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
            <div className="hidden sm:block">
              <nav className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Link href="/docs" className="hover:text-slate-300 transition-colors">Documentation</Link>
                {pathname !== "/docs" && (
                  <>
                    <FaChevronRight size={8} className="text-slate-600" />
                    <span className="text-slate-200 capitalize">
                      {pathname.split("/").pop().replace(/-/g, " ")}
                    </span>
                  </>
                )}
              </nav>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 min-w-0 w-full overflow-hidden">
          <div className="h-full overflow-y-auto p-6 md:p-12 scrollbar-hide">
            <div className="max-w-4xl mx-auto w-full prose prose-invert prose-indigo">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
