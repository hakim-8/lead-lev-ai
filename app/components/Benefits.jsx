"use client";

import React, { useEffect, useState } from 'react';
import { motion, animate, useInView } from 'framer-motion';

function CountUpItem({ value, suffix, label, description, delay }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration: 2,
        delay: delay,
        ease: "easeOut",
        onUpdate(v) {
          setDisplayValue(Math.floor(v));
        }
      });
      return controls.stop;
    }
  }, [isInView, value, delay]);

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      className="border-t border-slate-200 pt-6"
    >
      <div className="font-mono text-5xl md:text-6xl font-bold text-slate-900 mb-2 tracking-tighter">
        {displayValue}{suffix}
      </div>
      <h4 className="font-heading text-xl font-bold text-slate-800 mb-2">{label}</h4>
      <p className="text-slate-500 leading-relaxed text-sm">{description}</p>
    </motion.div>
  );
}

export default function Benefits() {
  const stats = [
    {
      value: 30,
      suffix: "+",
      label: "Hours Saved / Week",
      description: "Replace entirely manual data entry, copy-pasting, and scraping with instant, AI-driven automation."
    },
    {
      value: 5,
      suffix: "x",
      label: "Tools Replaced",
      description: "No need for different subscriptions. Combine lead discovery, verification, and CRM enrichment."
    },
    {
      value: 99,
      suffix: "%",
      label: "Delivery Rate",
      description: "Our AI verifies contacts against multiple active databases ensuring high inbox placement."
    },
    {
      value: 3,
      suffix: "x",
      label: "Lower Acquisition Cost",
      description: "Close deals faster with highly targeted and hyper-personalized initial outreach at scale."
    }
  ];

  return (
    <section className="py-32 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-16 items-start">
          
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight"
            >
              The impact of <br/><span className="text-[var(--color-signal)]">precision.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-slate-500 leading-relaxed"
            >
              We focus on the quality of your leads so you can focus on selling. Streamline your entire outbound engine with a single, incredibly simple interface.
            </motion.p>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-16">
              {stats.map((stat, idx) => (
                <CountUpItem 
                  key={idx} 
                  value={stat.value} 
                  suffix={stat.suffix}
                  label={stat.label}
                  description={stat.description}
                  delay={0.1 * idx}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
