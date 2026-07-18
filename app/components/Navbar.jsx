"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaRobot } from "react-icons/fa";

/**
 * ── Design notes ──────────────────────────────────────────────────────────
 * The hero is a dark image (/hero.jpg), so at the top the navbar sits
 * transparent with light (--paper) text directly on the image. On scroll,
 * the bar switches to a solid white surface with dark text/logo — for
 * legibility once the nav is no longer sitting on the dark hero image
 * (works best if the page content below the hero is on a light surface;
 * if everything below the hero is also dark, consider the dark-glass
 * scrolled variant instead so the bar doesn't look like a stray light
 * panel on an otherwise dark page).
 * ───────────────────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "/docs", label: "Documentation" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 px-6 transition-all duration-300 ${
        scrolled ? "py-3" : "py-5"
      }`}
      style={{
        backgroundColor: scrolled ? "#FFFFFF" : "transparent",
        backdropFilter: "none",
        WebkitBackdropFilter: "none",
        borderBottom: scrolled
          ? "1px solid rgba(33,29,44,0.08)"
          : "1px solid transparent",
        boxShadow: scrolled ? "0 4px 20px rgba(14,11,22,0.08)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div
            className="p-2 rounded-xl transition-colors"
            style={{
              backgroundColor: "var(--violet, #8B7FFF)",
              color: scrolled ? "#FFFFFF" : "var(--bg, #0E0B16)",
              boxShadow: scrolled ? "none" : "0 0 16px rgba(139,127,255,0.35)",
            }}
          >
            <FaRobot size={20} />
          </div>
          <span
            className="text-lg font-bold tracking-tight transition-colors"
            style={{ color: scrolled ? "#211D2C" : "var(--paper, #F6F1E7)" }}
          >
            Lead Lev AI
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold transition-colors"
              style={{
                color: scrolled
                  ? "rgba(33,29,44,0.65)"
                  : "rgba(246,241,231,0.72)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--violet, #8B7FFF)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = scrolled
                  ? "rgba(33,29,44,0.65)"
                  : "rgba(246,241,231,0.72)")
              }
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="hidden sm:inline text-sm font-medium transition-colors"
            style={{
              color: scrolled
                ? "rgba(33,29,44,0.65)"
                : "rgba(246,241,231,0.72)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = scrolled
                ? "#211D2C"
                : "var(--paper, #F6F1E7)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = scrolled
                ? "rgba(33,29,44,0.65)"
                : "rgba(246,241,231,0.72)")
            }
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="px-5 py-2.5 text-sm font-semibold rounded-full transition-all transform hover:scale-105 active:scale-95"
            style={{
              backgroundColor: "var(--violet, #8B7FFF)",
              color: "var(--bg, #0E0B16)",
              boxShadow: "0 0 20px rgba(139,127,255,0.3)",
            }}
          >
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  );
}
