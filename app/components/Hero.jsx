"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaArrowRight, FaRobot } from 'react-icons/fa';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] max-w-7xl opacity-50 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-8"
        >
          <FaRobot />
          <span>The Next Generation of AI Prospecting</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight max-w-4xl mx-auto"
        >
          Find, Verify, and Contact Leads with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Superhuman AI</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg lg:text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Stop wasting hours compiling lists and searching for contact information manually. Lead Lev AI automates your entire lead generation pipeline in minutes.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="#" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold rounded-full shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95">
            Start Free Trial <FaArrowRight className="text-sm" />
          </Link>
          <Link href="#how-it-works" className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 text-base font-semibold rounded-full border border-slate-200 transition-all transform hover:scale-105 active:scale-95">
            See How It Works
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
