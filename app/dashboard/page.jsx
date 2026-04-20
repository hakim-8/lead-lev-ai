"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, useOrganization } from "@clerk/nextjs";
import {
  FaRocket,
  FaRobot,
  FaSearch,
  FaEnvelope,
  FaChartLine,
  FaBook,
  FaQuestionCircle,
  FaArrowRight,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowAltCircleRight,
  FaLightbulb,
} from "react-icons/fa";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";

export default function DashboardHome() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const [orgData, setOrgData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization?.id) {
      fetchOrgData();
    }
  }, [organization?.id]);

  const fetchOrgData = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("org_id", organization.id)
        .single();

      if (data) setOrgData(data);
    } catch (err) {
      console.error("Error fetching org data:", err);
    } finally {
      setLoading(false);
    }
  };

  const isOnboardingComplete =
    orgData?.company_type && orgData?.business_context;

  const quickLinks = [
    {
      title: "Lead Generator",
      description: "Find high-quality B2B leads using our AI engine.",
      href: "/dashboard/lead-generator",
      icon: FaRobot,
      color: "bg-indigo-600",
      lightColor: "bg-indigo-50",
      textColor: "text-indigo-600",
    },
    {
      title: "Email Finder",
      description: "Locate and verify individual target emails.",
      href: "/dashboard/email-finder",
      icon: FaSearch,
      color: "bg-amber-500",
      lightColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      title: "Outreach Campaigns",
      description: "Launch automated AI-powered email sequences.",
      href: "/dashboard/view-campaigns",
      icon: FaEnvelope,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
  ];

  const docLinks = [
    { title: "Getting Started Guide", href: "#", icon: FaRocket },
    { title: "Best Outreach Practices", href: "#", icon: FaCheckCircle },
    { title: "AI Prompt Optimization", href: "#", icon: FaLightbulb },
    { title: "API Documentation", href: "#", icon: FaBook },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Welcome back,{" "}
            <span className="text-indigo-600">
              {user?.firstName || "there"}
            </span>
            ! 👋
          </h1>
          <p className="text-slate-500 font-medium">
            Here's what's happening with{" "}
            <span className="font-bold text-slate-700">
              {organization?.name}
            </span>{" "}
            today.
          </p>
        </div>

        {!loading && !isOnboardingComplete && (
          <Link href="/onboarding">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-4 bg-amber-50 border border-amber-200 p-4 rounded-[2rem] cursor-pointer group shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                <FaExclamationTriangle size={20} />
              </div>
              <div className="flex flex-col pr-4">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">
                  Attention Required
                </span>
                <span className="text-sm font-bold text-amber-900 group-hover:text-indigo-600 transition-colors">
                  Complete your onboarding profile
                </span>
              </div>
              <FaArrowRight className="text-amber-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </motion.div>
          </Link>
        )}
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickLinks.map((link, idx) => (
          <Link key={idx} href={link.href}>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group flex flex-col h-full"
            >
              <div
                className={`w-14 h-14 ${link.lightColor} ${link.textColor} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3`}
              >
                <link.icon size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">
                {link.title}
              </h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 flex-1">
                {link.description}
              </p>
              <div className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest group-hover:gap-4 transition-all">
                Launch Tool <FaArrowRight />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity / Stats Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 p-10 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900">
              Platform Overview
            </h3>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <FaChartLine /> Performance Metrics
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              {
                label: "Leads Collected",
                value: orgData?.leads_collected || 0,
                color: "text-indigo-600",
              },
              {
                label: "Emails Sent",
                value: orgData?.cold_emails_sent || 0,
                color: "text-emerald-500",
              },
              {
                label: "Active Campaigns",
                value: orgData?.campaigns_launched || 0,
                color: "text-amber-500",
              },
              {
                label: "Replies",
                value: orgData?.replies || 0,
                color: "text-rose-500",
              },
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <p className="text-2xl font-black text-slate-900">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h4 className="font-black text-slate-900">
                Need help maximizing your results?
              </h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Schedule a complimentary strategy call with our automation
                experts to refine your outreach.
              </p>
            </div>
            <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
              Book Strategy Call
            </button>
          </div>
        </div>

        {/* Documentation / Resources */}
        <div className="bg-slate-900 rounded-[3rem] p-10 space-y-8 text-white relative overflow-hidden group">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative space-y-2">
            <h3 className="text-xl font-black tracking-tight">
              Growth Resources
            </h3>
            <p className="text-indigo-300 text-xs font-medium uppercase tracking-widest">
              Knowledge Base
            </p>
          </div>

          <div className="relative space-y-3">
            {docLinks.map((doc, i) => (
              <Link
                key={i}
                href={doc.href}
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <doc.icon className="text-indigo-400" size={16} />
                  <span className="text-sm font-bold text-slate-200">
                    {doc.title}
                  </span>
                </div>
                <FaArrowAltCircleRight className="text-white/20 group-hover:text-indigo-400 transition-colors" />
              </Link>
            ))}
          </div>

          <div className="relative pt-6">
            <button className="w-full py-4 bg-indigo-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3">
              <FaQuestionCircle /> Visit Help Center
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
