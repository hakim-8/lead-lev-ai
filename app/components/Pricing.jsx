"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { FaCheck, FaBolt, FaBuilding } from "react-icons/fa";

const TIERS = [
  {
    name: "Starter",
    description:
      "Solo founders and small teams getting their first outbound motion running.",
    basePrice: 49,
    baseCredits: 500,
    creditOptions: [500, 1000, 1500, 2500, 4000],
    extraCreditRate: 0.049, // matches the +500 top-up pack rate
    campaigns: false,
    features: [
      "Lead scraping & enrichment",
      "Website report generator",
      "Email finder & verification",
      "Up to 5 team members",
      "Standard support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Growth",
    description: "Scale outbound with real email campaigns and a bigger team.",
    basePrice: 149,
    baseCredits: 3000,
    creditOptions: [3000, 4000, 6000, 8000, 12000],
    extraCreditRate: 0.0399, // matches the +2,000 top-up pack rate
    campaigns: true,
    campaignDetail: "1 active campaign · 3 inboxes min · up to 2 follow-ups",
    features: [
      "Everything in Starter",
      "Email campaigns (1 active)",
      "Maximum 3 sending inboxes (120 emails a day)",
      "Up to 2 follow-ups per campaign",
      "Up to 10 team members",
      "Priority support",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Scale",
    description:
      "Full send capacity for teams running multiple campaigns at volume.",
    basePrice: 239,
    baseCredits: 5000,
    creditOptions: [5000, 10000, 15000, 20000, 30000],
    extraCreditRate: 0.0378, // matches the +5,000 top-up pack rate
    campaigns: true,
    campaignDetail: "2 active campaigns · 5 inboxes · up to 5 follow-ups",
    features: [
      "Everything in Growth",
      "Email campaigns (2 active)",
      "5 sending inboxes (200 emails a day)",
      "Up to 5 follow-ups per campaign",
      "Up to 20 team members",
      "Priority support",
    ],
    cta: "Get Started",
    popular: false,
  },
];

// Enterprise / custom tier — handled separately from TIERS because it has
// no fixed price, no credit dropdown, and no formula-driven cost, so it
// doesn't fit the shared `pricing` calculation used for the other three.
const CUSTOM_TIER = {
  name: "Enterprise",
  description:
    "For businesses that need full control, scale, and a dedicated environment.",
  features: [
    "Everything in Scale",
    "Custom number of active campaigns",
    "Custom number of sending inboxes (custom daily send volume)",
    "Custom number of follow-ups per campaign",
    "Custom number of team members",
    "Hyper-priority support",
    "Privately hosted version of the platform",
  ],
  cta: "Contact Sales",
};

const ANNUAL_MONTHS_CHARGED = 11; // 1 month free when paying annually

// ---------------------------------------------------------------------
// Custom "clean price" rounding.
// Rounds the units digit of a number to a psychologically clean ending:
//   remainder in a tens-band (0-9) buckets as follows:
//     0    to 2.5  (inclusive) -> 0   (round down)
//     2.5+ to 5    (inclusive) -> 5   (round up)
//     5+   to 9    (inclusive) -> 9   (round up)
//     9+   to 10 (exclusive)   -> next multiple of 10 (round up)
// Examples: 156.59 -> 159 | 212.5 -> 210 | 165 -> 165 | 331 -> 330 | 189.98 -> 190
// ---------------------------------------------------------------------
function roundToCleanPrice(n) {
  const tens = Math.floor(n / 10) * 10;
  const remainder = n - tens;
  let bucketed;
  if (remainder <= 2.5) {
    bucketed = 0;
  } else if (remainder <= 5) {
    bucketed = 5;
  } else if (remainder <= 9) {
    bucketed = 9;
  } else {
    bucketed = 10;
  }
  return tens + bucketed;
}

function formatUSD(n) {
  const clean = roundToCleanPrice(n);
  return clean.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function Pricing() {
  const [billing, setBilling] = useState("monthly"); // 'monthly' | 'annual'
  const [creditIndex, setCreditIndex] = useState(TIERS.map(() => 0));

  const setCreditForTier = (tierIdx, optionIdx) => {
    setCreditIndex((prev) => {
      const next = [...prev];
      next[tierIdx] = optionIdx;
      return next;
    });
  };

  const pricing = useMemo(() => {
    return TIERS.map((tier, i) => {
      const selectedCredits = tier.creditOptions[creditIndex[i]];
      const extraCredits = Math.max(0, selectedCredits - tier.baseCredits);
      const extraCost = extraCredits * tier.extraCreditRate;
      const monthlyTotal = tier.basePrice + extraCost;
      const annualTotal = monthlyTotal * ANNUAL_MONTHS_CHARGED;
      const effectiveMonthly =
        billing === "annual" ? annualTotal / 12 : monthlyTotal;
      const displayTotal = billing === "annual" ? annualTotal : monthlyTotal;
      const savings = monthlyTotal * 12 - annualTotal; // = 1 month's cost

      return {
        selectedCredits,
        extraCredits,
        extraCost,
        monthlyTotal,
        annualTotal,
        effectiveMonthly,
        displayTotal,
        savings,
      };
    });
  }, [creditIndex, billing]);

  return (
    <section
      className="py-24 bg-slate-50 relative border-t border-slate-200"
      id="pricing"
    >
      <div className=" mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-slate-600">
            Pick a plan, choose how many credits you need, and see your price
            update instantly. No hidden fees, no complex contracts.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-14">
          <span
            className={`text-sm font-semibold transition-colors ${
              billing === "monthly" ? "text-slate-900" : "text-slate-400"
            }`}
          >
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={billing === "annual"}
            onClick={() =>
              setBilling(billing === "monthly" ? "annual" : "monthly")
            }
            className="relative w-14 h-8 rounded-full bg-indigo-600 transition-colors shrink-0"
          >
            <span
              className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                billing === "annual" ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`text-sm font-semibold transition-colors ${
              billing === "annual" ? "text-slate-900" : "text-slate-400"
            }`}
          >
            Annually
          </span>
          <span className="ml-1 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
            1 month free
          </span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
          {TIERS.map((tier, idx) => {
            const p = pricing[idx];
            return (
              <div
                key={tier.name}
                className={`relative bg-white rounded-3xl p-8 shadow-xl flex flex-col h-full ${
                  tier.popular
                    ? "border-2 border-indigo-600 shadow-indigo-100 lg:scale-105 z-10"
                    : "border border-slate-200 shadow-slate-100"
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                    Most popular
                  </div>
                )}

                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {tier.name}
                </h3>
                <p className="text-slate-500 text-sm mb-6 min-h-[40px]">
                  {tier.description}
                </p>

                {/* Credit selector */}
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                  Monthly credits
                </label>
                <select
                  value={creditIndex[idx]}
                  onChange={(e) =>
                    setCreditForTier(idx, Number(e.target.value))
                  }
                  className="w-full mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                >
                  {tier.creditOptions.map((c, i) => (
                    <option key={c} value={i}>
                      {c.toLocaleString()} credits
                      {c === tier.baseCredits ? " (included)" : ""}
                    </option>
                  ))}
                </select>

                {/* Price */}
                <div className="mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">
                      {formatUSD(p.effectiveMonthly)}
                    </span>
                    <span className="text-slate-500 font-medium">/month</span>
                  </div>
                  {billing === "annual" ? (
                    <p className="text-xs text-slate-500 mt-1">
                      Billed {formatUSD(p.annualTotal)}/year · you save{" "}
                      {formatUSD(p.savings)}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">
                      Billed monthly
                    </p>
                  )}
                </div>

                <Link
                  href="#"
                  className={`w-full block text-center py-4 rounded-full font-semibold transition-all mt-2 ${
                    tier.popular
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                      : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {tier.cta}
                </Link>

                {tier.campaigns && (
                  <div className="mt-6 flex items-start gap-2 bg-indigo-50 rounded-xl p-3">
                    <FaBolt className="text-indigo-600 text-xs mt-0.5 shrink-0" />
                    <span className="text-xs text-indigo-700 font-medium">
                      {tier.campaignDetail}
                    </span>
                  </div>
                )}

                <div className="mt-8 space-y-4 flex-1">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <FaCheck className="text-indigo-600 text-sm shrink-0" />
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* ── Enterprise / Custom card ──────────────────────────────────
              Deliberately styled darker (slate-900) rather than white like
              the other three: it has no price number and no dropdown, so a
              plain white card in the same shape would look like a broken
              or empty version of the others. The dark surface reads as a
              distinct "talk to us" tier instead of a missing price. */}
          <div className="relative bg-slate-900 rounded-3xl p-8 shadow-xl flex flex-col h-full border border-slate-800">
            <h3 className="text-2xl font-bold text-white mb-2">
              {CUSTOM_TIER.name}
            </h3>
            <p className="text-slate-400 text-sm mb-6 min-h-[40px]">
              {CUSTOM_TIER.description}
            </p>

            {/* Credits — static label, no dropdown, kept at the same
                position as the selector on the other cards so the row
                heights still line up across the grid. */}
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Monthly credits
            </label>
            <div className="w-full mb-6 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm font-semibold text-white">
              Custom volume
            </div>

            {/* Price — "Custom" at the same visual weight as a real price
                so the card doesn't look empty next to the other three. */}
            <div className="mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">
                  Custom
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Tailored to your usage — talk to sales for a quote
              </p>
            </div>

            <Link
              href="/contact"
              className="w-full block text-center py-4 rounded-full font-semibold transition-all mt-2 bg-white hover:bg-slate-100 text-slate-900"
            >
              {CUSTOM_TIER.cta}
            </Link>

            <div className="mt-6 flex items-start gap-2 bg-indigo-500/10 rounded-xl p-3">
              <FaBolt className="text-indigo-400 text-xs mt-0.5 shrink-0" />
              <span className="text-xs text-indigo-300 font-medium">
                Custom active campaigns · custom inboxes · custom follow-ups
              </span>
            </div>

            <div className="mt-8 space-y-4 flex-1">
              {CUSTOM_TIER.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <FaCheck className="text-indigo-400 text-sm shrink-0" />
                  <span className="text-slate-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-10">
          Need more credits later? Buy top-up packs any time — no need to change
          your plan.
        </p>
      </div>
    </section>
  );
}
