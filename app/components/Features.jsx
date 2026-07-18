"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FaMagnifyingGlass, FaChartLine, FaEnvelopeOpenText, FaPaperPlane } from 'react-icons/fa6';

export default function Features() {
  const features = [
    {
      icon: <FaMagnifyingGlass className="text-[var(--color-signal)] text-2xl" />,
      title: "Smart Lead Extraction",
      description: "Instantly gather highly targeted lists of companies and decision-makers in any city or niche, fully automated by AI.",
      span: "md:col-span-7",
    },
    {
      icon: <FaChartLine className="text-[var(--color-signal)] text-2xl" />,
      title: "Automated Research Reports",
      description: "Input any company website URL, and our AI reads the page to generate comprehensive, tailored research reports.",
      span: "md:col-span-5",
    },
    {
      icon: <FaEnvelopeOpenText className="text-[var(--color-signal)] text-2xl" />,
      title: "Precision Contact Finder",
      description: "Search by target domain and role to uncover verified email addresses, job titles, and LinkedIn profiles of key decision-makers.",
      span: "md:col-span-5",
    },
    {
      icon: <FaPaperPlane className="text-[var(--color-signal)] text-2xl" />,
      title: "AI Email Campaigns",
      description: "Automatically generate tailored, high-converting outreach emails adjusting tone, subject, and call-to-action to your precise needs.",
      span: "md:col-span-7",
    }
  ];

  return (
    <section className="py-24 bg-white relative z-10" id="features">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4"
          >
            Everything You Need to Scale Outreach
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-slate-500"
          >
            A comprehensive suite of tools built to find, verify, and understand your targets before you ever send an email.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.1 * idx }}
              className={`group relative overflow-hidden bg-white border border-slate-200 rounded-[2rem] p-8 sm:p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--color-signal)]/10 hover:border-indigo-100 ${feature.span}`}
            >
              {/* Background Watermark Number */}
              <div className="absolute -bottom-6 -right-6 font-mono font-black text-[10rem] leading-none text-slate-50 opacity-60 z-0 transition-all duration-700 group-hover:scale-95 group-hover:opacity-100 group-hover:text-indigo-50/50 pointer-events-none select-none">
                0{idx + 1}
              </div>

              <div className="relative z-10 h-full flex flex-col">
                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-8 transition-colors duration-500 group-hover:bg-indigo-50/50 group-hover:border-indigo-100">
                  {feature.icon}
                </div>
                
                <div className="mt-auto">
                  <h3 className="font-heading text-2xl font-bold text-slate-900 mb-3 transition-colors duration-300 group-hover:text-[var(--color-signal)]">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed text-lg max-w-md">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
