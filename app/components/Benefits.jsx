import React from 'react';
import { FaBolt, FaDatabase, FaMoneyBillWave, FaClock } from 'react-icons/fa';

export default function Benefits() {
  const benefits = [
    {
      icon: <FaClock className="text-white text-xl" />,
      title: "Save 30+ Hours a Week",
      description: "Replace entirely manual data entry and scraping with instant, AI-driven automation."
    },
    {
      icon: <FaDatabase className="text-white text-xl" />,
      title: "Consolidated Tools",
      description: "No need for 5 different subscriptions. Lead Lev AI combines lead discovery, email verification, and reporting into one."
    },
    {
      icon: <FaBolt className="text-white text-xl" />,
      title: "Unmatched Accuracy",
      description: "Our AI verifies contacts against multiple databases ensuring high delivery rates."
    },
    {
      icon: <FaMoneyBillWave className="text-white text-xl" />,
      title: "Lower Acquisition Costs",
      description: "Close deals faster with highly targeted and hyper-personalized initial outreach."
    }
  ];

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Why Modern Sales Teams Rely on Lead Lev AI</h2>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              We focus on the quality of your leads so you can focus on selling. Streamline your entire outbound engine with a single, incredibly simple interface.
            </p>
            <div className="space-y-8">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2">{benefit.title}</h4>
                    <p className="text-slate-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/2 w-full pt-10 lg:pt-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-blue-50 transform rounded-3xl -rotate-3 scale-105 -z-10"></div>
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-12 shadow-xl">
                 <div className="space-y-6">
                   <div className="h-4 w-1/3 bg-slate-200 rounded-full"></div>
                   <div className="h-32 w-full bg-white border border-slate-100 rounded-xl shadow-sm p-4 space-y-3">
                      <div className="h-3 w-1/4 bg-indigo-100 rounded"></div>
                      <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                      <div className="h-3 w-3/4 bg-slate-100 rounded"></div>
                   </div>
                   <div className="h-32 w-full bg-white border border-slate-100 rounded-xl shadow-sm p-4 space-y-3">
                      <div className="h-3 w-1/4 bg-indigo-100 rounded"></div>
                      <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                      <div className="h-3 w-3/4 bg-slate-100 rounded"></div>
                   </div>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
