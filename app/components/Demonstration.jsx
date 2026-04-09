"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaRobot, FaUserCircle, FaEnvelopeOpen } from 'react-icons/fa';
import Loader from './Loader';

const LEADS_TARGET = "find me 100 construction companies in Nairobi";
const REPORT_TARGET = "write me a report on this page: https://revlaunchdigital.com and send it to this email: info@revlaunchdigital.com";
const EMAIL_TARGET = "apple.com";

export default function Demonstration() {
  const [activeTab, setActiveTab] = useState('leads');
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Email Finder specific state
  const [domain, setDomain] = useState('');
  const [emailResult, setEmailResult] = useState(null);
  const [isSearchingEmail, setIsSearchingEmail] = useState(false);

  // Email Campaign specific state
  const [campaignTone, setCampaignTone] = useState('human');
  const [campaignSubject, setCampaignSubject] = useState('discount');
  const [campaignGoal, setCampaignGoal] = useState('phone call');

  // Timers to handle playback
  const typingTimerRef = useRef(null);
  const submitTimerRef = useRef(null);
  const autoPlayDelayRef = useRef(null);

  useEffect(() => {
    // Only scroll the specific chat container instead of the whole page to prevent jumping
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, isTyping, emailResult]);

  useEffect(() => {
    // Clear outstanding timers on tab switch
    clearInterval(typingTimerRef.current);
    clearTimeout(submitTimerRef.current);
    clearTimeout(autoPlayDelayRef.current);

    // Reset State
    setInputVal('');
    setDomain('');
    setEmailResult(null);
    setIsSearchingEmail(false);
    setIsTyping(false);
    setMessages([]);
    
    // We only auto-play strings for leads, report, and email
    if (activeTab === 'campaign') return;

    let targetText = "";
    if (activeTab === 'leads') {
      setMessages([{ id: Date.now().toString(), sender: 'ai', text: 'Hi! Tell me what companies or businesses you are looking for (e.g. "find me 100 construction companies in Nairobi").' }]);
      targetText = LEADS_TARGET;
    } else if (activeTab === 'report') {
      setMessages([{ id: Date.now().toString(), sender: 'ai', text: 'Hello! I can generate reports on any website, just give me the url and an email address to send the report to!' }]);
      targetText = REPORT_TARGET;
    } else if (activeTab === 'email') {
      targetText = EMAIL_TARGET;
    }

    // Start auto playback
    autoPlayDelayRef.current = setTimeout(() => {
      let currentString = "";
      let charIndex = 0;

      typingTimerRef.current = setInterval(() => {
        currentString += targetText[charIndex];
        
        if (activeTab === 'email') {
          setDomain(currentString);
        } else {
          setInputVal(currentString);
        }

        charIndex++;

        // Typing finished
        if (charIndex === targetText.length) {
          clearInterval(typingTimerRef.current);
          
          submitTimerRef.current = setTimeout(() => {
            if (activeTab === 'email') {
              triggerEmailSearch(targetText);
            } else {
              triggerChatSubmit(targetText);
            }
          }, 800); // short pause before submission
        }
      }, 50); // MS per character
    }, 1000); // MS wait before starting to type

    return () => {
      clearInterval(typingTimerRef.current);
      clearTimeout(submitTimerRef.current);
      clearTimeout(autoPlayDelayRef.current);
    };
  }, [activeTab]);

  const triggerChatSubmit = (userText) => {
    setInputVal('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userText }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let aiResponse = "I have processed your request.";
      if (activeTab === 'leads') {
        aiResponse = "Your results have been collected, you can view them in the view leads page.";
      } else if (activeTab === 'report') {
        aiResponse = "The report has been sent to your email.";
      }
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', text: aiResponse }]);
    }, 1500);
  };

  const triggerEmailSearch = (dom) => {
    setIsSearchingEmail(true);
    setEmailResult(null);

    setTimeout(() => {
      setIsSearchingEmail(false);
      setEmailResult({
        name: 'Jane Doe',
        title: 'CEO',
        email: `jane.doe@${dom}`,
        linkedin: `linkedin.com/in/janedoe-${dom.split('.')[0]}`
      });
    }, 2000);
  };

  const generateCampaignEmail = () => {
    let greeting = campaignTone === 'robotic' ? 'Greetings,' : (campaignTone === 'team' ? 'Hi there from our team,' : 'Hi [Name],');
    
    let hook = campaignSubject === 'discount' ? 'We are currently offering a 20% discount on all audits this month.' : 
               campaignSubject === 'offer' ? 'I wanted to share an exclusive offer we have tailored for your business.' :
               'We have a crucial update regarding your account processes that I wanted to share.';
                
    let push = campaignGoal === 'phone call' ? 'Are you available for a brief phone call next Tuesday to discuss this?' : 
               campaignGoal === 'visit link' ? 'Please visit the link below to claim this opportunity before it expires.' : 
               'Could you please fill out our quick intake form so we can finalize the details?';
    
    let signoff = campaignTone === 'robotic' ? 'Automated System\nLead Lev AI' : (campaignTone === 'team' ? 'Cheers,\nThe Lead Lev AI Team' : 'Best,\nMarc\nLead Lev AI');
    
    return `${greeting}\n\n${hook}\n\n${push}\n\n${signoff}`;
  };

  return (
    <section className="py-24 bg-slate-50 relative border-t border-slate-200" id="how-it-works">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Experience the power of our conversational and targeted AI workflows effortlessly. Watch the automation or interact with our template builders below.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex flex-col sm:flex-row border-b border-slate-200 bg-slate-50/50">
            <button 
              onClick={() => setActiveTab('leads')}
              className={`flex-1 py-4 px-6 text-sm font-semibold transition-colors ${activeTab === 'leads' ? 'text-indigo-600 bg-white border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Lead Finder
            </button>
            <button 
               onClick={() => setActiveTab('report')}
              className={`flex-1 py-4 px-6 text-sm font-semibold transition-colors ${activeTab === 'report' ? 'text-indigo-600 bg-white border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Report Generator
            </button>
            <button 
               onClick={() => setActiveTab('email')}
              className={`flex-1 py-4 px-6 text-sm font-semibold transition-colors ${activeTab === 'email' ? 'text-indigo-600 bg-white border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Email Finder
            </button>
            <button 
               onClick={() => setActiveTab('campaign')}
              className={`flex-1 py-4 px-6 text-sm font-semibold transition-colors ${activeTab === 'campaign' ? 'text-indigo-600 bg-white border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Email Campaigns
            </button>
          </div>

          <div className="p-0 sm:p-6 bg-slate-50 min-h-[500px] flex items-center justify-center">
            
            {/* Chat Interface for Leads & Reports Auto-Play */}
            {(activeTab === 'leads' || activeTab === 'report') && (
              <div className="w-full max-w-3xl bg-white h-[500px] sm:rounded-2xl shadow-sm border border-slate-200 flex flex-col pointer-events-none">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id} 
                        className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'ai' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
                          {msg.sender === 'ai' ? <FaRobot size={20} /> : <FaUserCircle size={24} />}
                        </div>
                        <div className={`p-4 rounded-xl max-w-[80%] ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <FaRobot size={20} />
                      </div>
                      <div className="p-4 rounded-xl bg-slate-100 rounded-tl-none flex items-center gap-1">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-white border-t border-slate-100 rounded-b-2xl">
                  <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 relative shadow-sm rounded-full overflow-hidden border border-slate-300 bg-slate-50 p-1">
                    <input 
                      type="text" 
                      readOnly
                      value={inputVal}
                      placeholder={activeTab === 'leads' ? 'e.g., Target 100 construction companies in Nairobi' : 'e.g., Write a report on https://example.com'}
                      className="flex-1 bg-transparent px-4 py-2 outline-none text-sm text-slate-700 pointer-events-none"
                    />
                    <button type="button" disabled className="w-10 h-10 bg-indigo-400 text-white flex justify-center items-center rounded-full transition disabled:opacity-50">
                      <FaPaperPlane className="text-sm -ml-1" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Form Interface for Email Finder Auto-Play */}
            {activeTab === 'email' && (
              <div className="w-full max-w-xl mx-auto pointer-events-none">
                <form onSubmit={(e) => e.preventDefault()} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Target Domain</label>
                    <input 
                      type="text"
                      readOnly
                      value={domain}
                      placeholder="e.g. apple.com" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Decision Maker Category</label>
                    <select 
                      disabled
                      value="CEO"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 opacity-80"
                    >
                      <option value="CEO">CEO</option>
                    </select>
                  </div>
                  <button type="button" disabled className="w-full py-3 bg-indigo-400 text-white font-semibold rounded-xl transition flex justify-center items-center mt-4 h-12">
                     {isSearchingEmail ? <Loader size={20} className="text-white border-white" /> : "Find Contact"}
                  </button>
                </form>

                {emailResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-white p-6 rounded-2xl border border-green-200 shadow-md">
                    <h4 className="text-sm font-bold text-green-700 mb-4 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-green-500"></span> Verified Match Found!
                    </h4>
                    <div className="space-y-3 text-sm text-slate-700">
                      <p><span className="font-semibold w-20 inline-block">Name:</span> {emailResult.name}</p>
                      <p><span className="font-semibold w-20 inline-block">Title:</span> {emailResult.title}</p>
                      <p><span className="font-semibold w-20 inline-block">Email:</span> <span className="text-indigo-600 font-medium">{emailResult.email}</span></p>
                      <p><span className="font-semibold w-20 inline-block">LinkedIn:</span> <span className="text-indigo-600 underline">{emailResult.linkedin}</span></p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Interactive Form for Email Campaigns */}
            {activeTab === 'campaign' && (
              <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Tone</label>
                    <select 
                      value={campaignTone}
                      onChange={(e) => setCampaignTone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white text-slate-700"
                    >
                      <option value="human">Human-like (Friendly)</option>
                      <option value="robotic">Robotic (Direct)</option>
                      <option value="team">Team (Collaborative)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Subject Matter</label>
                    <select 
                      value={campaignSubject}
                      onChange={(e) => setCampaignSubject(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white text-slate-700"
                    >
                      <option value="discount">20% Discount Offer</option>
                      <option value="offer">Exclusive Service Offer</option>
                      <option value="update">Account/Process Update</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Call to Action (Goal)</label>
                    <select 
                      value={campaignGoal}
                      onChange={(e) => setCampaignGoal(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white text-slate-700"
                    >
                      <option value="phone call">Schedule a Phone Call</option>
                      <option value="visit link">Visit a Landing Page</option>
                      <option value="fill out form">Fill Out Intake Form</option>
                    </select>
                  </div>
                </div>

                <div className="flex-[1.5] bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
                  <div className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center gap-3">
                    <FaEnvelopeOpen className="text-indigo-400" />
                    <span className="text-sm font-semibold text-white">Generated Email Draft</span>
                  </div>
                  <div className="p-6 flex-1 text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-line font-mono selection:bg-indigo-500/30">
                     {generateCampaignEmail()}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}
