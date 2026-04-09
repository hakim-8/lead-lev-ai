import React from 'react';
import Link from 'next/link';
import { FaRobot, FaTwitter, FaLinkedin, FaGithub } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          
          <div className="max-w-xs text-center md:text-left">
            <Link href="/" className="flex items-center justify-center md:justify-start gap-2 mb-4 group">
              <div className="bg-indigo-600 p-2 rounded-xl text-white group-hover:bg-indigo-500 transition">
                <FaRobot size={20} />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Lead Lev AI
              </span>
            </Link>
            <p className="text-sm text-slate-500 mb-6">
              The next generation of AI-powered lead prospecting and generation tools for modern sales teams.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              <Link href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition">
                <FaTwitter />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition">
                <FaLinkedin />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition">
                <FaGithub />
              </Link>
            </div>
          </div>

          <div className="flex gap-16 text-sm">
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-slate-500">
                <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition">How it Works</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-slate-500">
                <li><Link href="#" className="hover:text-white transition">About</Link></li>
                <li><Link href="#" className="hover:text-white transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-slate-500">
                <li><Link href="#" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-600">
          © {new Date().getFullYear()} Lead Lev AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
