import React from 'react';
import Link from 'next/link';
import { FaCheck } from 'react-icons/fa';

export default function Pricing() {
  const tiers = [
    {
      name: "Starter",
      oldPrice: "$49",
      price: "$29",
      period: "/month",
      description: "Perfect for solo founders and small sales teams just getting started.",
      features: [
        "Up to 1,000 verified leads/mo",
        "50 automated research reports",
        "Basic email finder",
        "Standard support"
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Pro",
      oldPrice: "$149",
      price: "$99",
      period: "/month",
      description: "Ideal for growing organizations scaling their outbound efforts.",
      features: [
        "Up to 5,000 verified leads/mo",
        "Unlimited research reports",
        "Advanced email & LinkedIn finder",
        "Priority support",
        "CRM Integrations"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large teams requiring custom limits and dedicated success managers.",
      features: [
        "Unlimited leads & reports",
        "API access",
        "Dedicated account manager",
        "SLA guarantee",
        "Custom onboarding"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <section className="py-24 bg-slate-50 relative border-t border-slate-200" id="pricing">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-slate-600">
            Start automating your outreach today. No hidden fees or complex contracts.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-center">
          {tiers.map((tier, idx) => (
            <div 
              key={idx} 
              className={`relative bg-white rounded-3xl p-8 shadow-xl ${
                tier.popular 
                  ? 'border-2 border-indigo-600 shadow-indigo-100 scale-105 z-10' 
                  : 'border border-slate-200 shadow-slate-100'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
              <p className="text-slate-500 text-sm mb-6 h-10">{tier.description}</p>
              
              <div className="mb-8">
                {tier.oldPrice && (
                  <span className="text-slate-400 line-through text-lg mr-2">{tier.oldPrice}</span>
                )}
                <span className="text-4xl font-extrabold text-slate-900">{tier.price}</span>
                <span className="text-slate-500 font-medium">{tier.period}</span>
              </div>
              
              <Link href="#" className={`w-full block text-center py-4 rounded-full font-semibold transition-all ${
                tier.popular 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200' 
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
              }`}>
                {tier.cta}
              </Link>
              
              <div className="mt-8 space-y-4">
                {tier.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-3">
                    <FaCheck className="text-indigo-600 text-sm shrink-0" />
                    <span className="text-slate-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
