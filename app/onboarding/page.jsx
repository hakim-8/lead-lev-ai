"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useOrganization } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { FaBuilding, FaUsers, FaLightbulb, FaCheck, FaSpinner, FaArrowRight, FaArrowLeft } from "react-icons/fa";
import { supabase } from "../lib/supabase";

const COMPANY_TYPES = [
  "Software Development",
  "Real Estate",
  "E-commerce",
  "Marketing Agency",
  "Law Firm",
  "Financial Services",
  "Healthcare",
  "Construction",
  "Consulting",
  "Education",
  "Hospitality",
  "Other"
];

const EMPLOYEE_RANGES = [
  "Just me",
  "1-10",
  "10-25",
  "25-50",
  "50-100",
  "100-250",
  "250-500",
  "500+"
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const { organization } = useOrganization();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [companyType, setCompanyType] = useState("");
  const [customCompanyType, setCustomCompanyType] = useState("");
  const [numEmployees, setNumEmployees] = useState("");
  const [businessContext, setBusinessContext] = useState("");

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    const orgId = organization?.id || user?.id;
    if (!orgId) return;
    setIsSubmitting(true);

    const finalCompanyType = companyType === "Other" ? customCompanyType : companyType;

    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          company_type: finalCompanyType,
          number_of_employees: numEmployees,
          business_context: businessContext
        })
        .eq("org_id", orgId);

      if (error) throw error;
      router.push("/dashboard");
    } catch (err) {
      console.error("Onboarding submission error:", err);
      alert("Failed to save onboarding data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isNextDisabled = () => {
    if (step === 1) return !companyType || (companyType === "Other" && !customCompanyType);
    if (step === 2) return !numEmployees;
    if (step === 3) return !businessContext || businessContext.length < 10;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col">
        {/* Progress Bar */}
        <div className="h-2 w-full bg-slate-100 relative">
          <motion.div 
            className="h-full bg-indigo-600"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="p-10 md:p-14 space-y-10 flex-1">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-110">
                    <FaBuilding size={24} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">What type of business do you run?</h2>
                  <p className="text-slate-500 font-medium">Select the category that best describes your organization.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {COMPANY_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCompanyType(type)}
                      className={`p-4 rounded-2xl text-[11px] font-bold transition-all border-2 ${companyType === type ? 'bg-slate-900 border-slate-900 text-white shadow-xl translate-y-[-2px]' : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-200 hover:bg-white'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {companyType === "Other" && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Specify Category</label>
                    <input 
                      type="text" 
                      placeholder="Enter your business type..."
                      value={customCompanyType}
                      onChange={(e) => setCustomCompanyType(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 font-bold text-slate-700 transition-all"
                    />
                  </motion.div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-110">
                    <FaUsers size={24} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">How many employees work at your business?</h2>
                  <p className="text-slate-500 font-medium">This helps us tailor management and reporting features.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {EMPLOYEE_RANGES.map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setNumEmployees(range)}
                      className={`p-6 rounded-3xl text-sm font-black transition-all border-2 flex flex-col items-center gap-2 ${numEmployees === range ? 'bg-slate-900 border-slate-900 text-white shadow-xl translate-y-[-2px]' : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-200 hover:bg-white'}`}
                    >
                      <span className="text-lg">{range}</span>
                      <span className="text-[10px] opacity-60 uppercase tracking-widest">Team Members</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-110">
                    <FaLightbulb size={24} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">About your organization</h2>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Provide a few details about what you do. This context allows our AI to generate more high-impact and personalized solutions for your specific needs.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Business Context / Mission</label>
                  <textarea 
                    rows={6}
                    placeholder="e.g. We are a software agency specializing in AI automations for law firms..."
                    value={businessContext}
                    onChange={(e) => setBusinessContext(e.target.value)}
                    className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-base font-medium outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all placeholder:text-slate-300 text-slate-700"
                  />
                  <p className="text-[10px] font-bold text-slate-400 mt-2 ml-4">The more context you provide, the better the AI results.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-8 px-12 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className={`flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <FaArrowLeft size={12} /> Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isNextDisabled() || isSubmitting}
            className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 hover:scale-105 transition-all shadow-xl shadow-slate-200 disabled:bg-slate-200 disabled:scale-100 flex items-center gap-3"
          >
            {isSubmitting ? <FaSpinner className="animate-spin" /> : step === totalSteps ? (
              <>Finish Onboarding <FaCheck size={14} /></>
            ) : (
              <>Next Step <FaArrowRight size={14} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
