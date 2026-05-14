"use client";

import React from "react";
import Link from "next/link";
import { FaRobot } from "react-icons/fa";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-indigo-100 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-indigo-600 p-2 rounded-xl text-white group-hover:bg-indigo-700 transition">
            <FaRobot size={24} />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            Lead Lev AI
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
          >
            How it Works
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
          >
            Pricing
          </Link>
          <Link
            href="/docs"
            className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
          >
            Documentation
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-full shadow-md shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}
