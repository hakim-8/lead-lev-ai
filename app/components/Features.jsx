import React from 'react';
import { FaMagnifyingGlass, FaChartLine, FaEnvelopeOpenText, FaPaperPlane } from 'react-icons/fa6';

export default function Features() {
  const features = [
    {
      icon: <FaMagnifyingGlass className="text-indigo-600 text-2xl" />,
      title: "Smart Lead Extraction",
      description: "Instantly gather highly targeted lists of companies and decision-makers in any city or niche, fully automated by AI.",
    },
    {
      icon: <FaChartLine className="text-indigo-600 text-2xl" />,
      title: "Automated Research Reports",
      description: "Input any company website URL, and our AI reads the page to generate comprehensive, tailored research reports.",
    },
    {
      icon: <FaEnvelopeOpenText className="text-indigo-600 text-2xl" />,
      title: "Precision Contact Finder",
      description: "Search by target domain and role to uncover verified email addresses, job titles, and LinkedIn profiles of key decision-makers.",
    },
    {
      icon: <FaPaperPlane className="text-indigo-600 text-2xl" />,
      title: "AI Email Campaigns",
      description: "Automatically generate tailored, high-converting outreach emails adjusting tone, subject, and call-to-action to your precise needs.",
    }
  ];

  return (
    <section className="py-24 bg-white relative z-10" id="features">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything You Need to Scale Outreach</h2>
          <p className="text-lg text-slate-600">
            A comprehensive suite of tools built to find, verify, and understand your targets before you ever send an email.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:shadow-indigo-100 transition-all duration-300">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
