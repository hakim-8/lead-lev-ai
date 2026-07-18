"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";

/**
 * ── Design notes ──────────────────────────────────────────────────────────
 * Dark theme, full viewport height, built around a real background image
 * (/public/hero.jpg — near-black indigo base, faint grid, neon violet
 * targeting brackets, single teal "confirmed" accent). No motion effects
 * layered over the image itself — it carries the atmosphere on its own.
 * The extra vertical space is filled with real content weight (a proof
 * row of the product's four stages) rather than empty padding, plus a
 * scroll cue anchoring the bottom edge.
 *
 * Palette:
 *   --bg           #0E0B16   near-black indigo (matches hero.jpg base)
 *   --paper        #F6F1E7   off-white text on dark
 *   --violet       #8B7FFF   primary neon accent
 *   --violet-dim   #4338CA   deeper indigo, borders/secondary
 *   --teal         #2DD4BF   rare "confirmed" highlight only
 *   --line         rgba(246,241,231,0.14)  hairlines on dark
 * ───────────────────────────────────────────────────────────────────────── */

export default function Hero() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      <style jsx global>{`
        :root {
          --bg: #0e0b16;
          --paper: #f6f1e7;
          --violet: #8b7fff;
          --violet-dim: #4338ca;
          --teal: #2dd4bf;
          --line: rgba(246, 241, 231, 0.14);
        }
      `}</style>

      {/* ── Background image + scrim ── */}
      <div className="absolute inset-0 -z-20">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero.jpg')" }}
        />
        {/* base tint so the image reads dark even if it's shot lighter than
            expected, and to guarantee text contrast regardless of source */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "var(--bg)", opacity: 0.45 }}
        />
        {/* vertical scrim: strongest behind the headline/copy column,
            fading out toward the very top and bottom edges */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(14,11,22,0.75) 0%, rgba(14,11,22,0.35) 30%, rgba(14,11,22,0.55) 70%, rgba(14,11,22,0.85) 100%)",
          }}
        />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-6 py-32">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-2 mb-8 font-mono text-[11px] tracking-wide uppercase"
          style={{ color: "var(--violet)" }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: "var(--teal)",
              boxShadow: "0 0 6px var(--teal)",
              animation: reducedMotion
                ? "none"
                : "pulseDot 1.8s ease-in-out infinite",
            }}
          />
          scanning public records — live
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-center font-[Fraunces,serif] text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.05]"
          style={{ color: "var(--paper)" }}
        >
          Every lead,{" "}
          <span
            style={{
              color: "var(--violet)",
              textShadow: "0 0 24px rgba(139,127,255,0.45)",
            }}
          >
            locked in.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-center text-lg lg:text-xl mb-10 max-w-xl mx-auto leading-relaxed"
          style={{ color: "var(--paper)", opacity: 0.7 }}
        >
          Lead Lev AI finds, researches, and verifies your ideal decision-makers
          — automatically, in minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="#"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-full transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
            style={{
              backgroundColor: "var(--violet)",
              color: "var(--bg)",
              boxShadow: "0 0 28px rgba(139,127,255,0.35)",
            }}
          >
            Start free trial <FaArrowRight className="text-sm" />
          </Link>
          <Link
            href="#how-it-works"
            className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-transparent text-base font-semibold rounded-full border transition-all transform hover:border-[var(--violet)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
            style={{ borderColor: "var(--line)", color: "var(--paper)" }}
          >
            See how it works
          </Link>
        </motion.div>

        {/* Proof row: the four real stages of the product, standing in
            for generic hero stats and giving the extra vertical space
            of a full-height section something substantive to hold. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="w-full mt-20 pt-10 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8"
          style={{ borderTop: "1px solid var(--line)" }}
        >
          {[
            { n: "01", label: "Smart lead extraction" },
            { n: "02", label: "Automated research reports" },
            { n: "03", label: "Precision contact finder" },
            { n: "04", label: "AI email campaigns" },
          ].map((stage) => (
            <div key={stage.n} className="text-center lg:text-left">
              <span
                className="block font-mono text-[11px] mb-1.5"
                style={{ color: "var(--violet)" }}
              >
                {stage.n}
              </span>
              <span
                className="block text-sm leading-snug"
                style={{ color: "var(--paper)", opacity: 0.75 }}
              >
                {stage.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll cue anchoring the bottom edge of the full-height section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="relative flex flex-col items-center gap-2 pb-10"
      >
        <span
          className="font-mono text-[10px] tracking-widest uppercase"
          style={{ color: "var(--paper)", opacity: 0.4 }}
        >
          Scroll
        </span>
        <span
          className="block w-px h-8"
          style={{
            background: "linear-gradient(180deg, var(--violet), transparent)",
            animation: reducedMotion
              ? "none"
              : "scrollCue 2s ease-in-out infinite",
          }}
        />
      </motion.div>

      <style jsx>{`
        @keyframes pulseDot {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }
        @keyframes scrollCue {
          0%,
          100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(6px);
          }
        }
      `}</style>
    </section>
  );
}
