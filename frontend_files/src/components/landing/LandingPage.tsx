import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TabType } from '../../types';
import { FastPayLogo } from '../common/FastPayLogo';
import {
  Banknote,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  ArrowRightLeft
} from 'lucide-react';

interface LandingPageProps {
  setActiveTab: (tab: TabType) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setActiveTab }) => {
  const [cycle, setCycle] = useState<number>(0);
  const [shakibBalance, setShakibBalance] = useState<number>(100000);
  const [tanmoyBalance, setTanmoyBalance] = useState<number>(100000);
  const [showPulse, setShowPulse] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Step 1: Trigger transfer phase
      setCycle((prev) => prev + 1);

      // Step 2: Mid-flight balance settlement
      setTimeout(() => {
        setShakibBalance((b) => (b === 100000 ? 97500 : 100000));
        setTanmoyBalance((b) => (b === 100000 ? 102500 : 100000));
        setShowPulse(true);
      }, 1500);

      // Step 3: Reset pulse
      setTimeout(() => {
        setShowPulse(false);
      }, 2700);
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[85vh] flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* Hero & Live Transaction Animation */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col items-center justify-center text-center">
        
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6 shadow-sm shadow-emerald-950/40"
        >
          <Zap className="w-3.5 h-3.5 fill-emerald-400" />
          <span>PSTU National Hackathon 2026 Money Movement</span>
        </motion.div>

        {/* Hero Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-3xl"
        >
          Send money. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Instantly.</span>
          <br />
          Trustworthy to the last poisha.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm sm:text-base text-slate-400 max-w-xl mt-4 mb-8"
        >
          Zero floating-point rounding errors, PostgreSQL row-locking ACID transactions, and double-entry immutable auditability.
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3.5 mb-14"
        >
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-950/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Launch FastPay App</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('stress')}
            className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold px-6 py-3.5 rounded-2xl border border-slate-700/80 shadow-md transition-all hover:border-indigo-500/50"
          >
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Concurrency Lab</span>
          </button>
        </motion.div>

        {/* Centerpiece: Live SwiftUI-style Transaction Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-2xl glass-card border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden glow-emerald-box"
        >
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-4">
            
            {/* Phone A: Shakib (Sender) */}
            <div className="w-full sm:w-60 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-left transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center text-xs font-bold border border-slate-700">
                    S
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">Shakib</h4>
                    <span className="text-[11px] text-slate-400 font-mono">01711-111111</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                  Sender
                </span>
              </div>
              <div className="pt-2.5 border-t border-slate-800/80">
                <span className="text-[11px] font-medium text-slate-400">Available Balance</span>
                <div className="text-xl font-bold font-mono text-white tracking-tight transition-all duration-500 mt-0.5">
                  ৳{shakibBalance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Flight Path with Animated Traveling Money Pill */}
            <div className="relative flex-1 w-full sm:w-auto h-16 flex items-center justify-center px-2">
              <div className="w-full border-t-2 border-dashed border-emerald-500/40 absolute"></div>

              <div
                key={cycle}
                className="absolute z-10 flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg shadow-emerald-950/60 animate-flyMoney"
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>৳2,500</span>
              </div>
            </div>

            {/* Phone B: Tanmoy (Receiver) */}
            <div className="w-full sm:w-60 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-left relative transition-all">
              {/* Green Receipt Pulse */}
              <div
                className={`absolute -top-3.5 right-4 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1 transition-all duration-300 ${
                  showPulse ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>+৳2,500 Received</span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center text-xs font-bold">
                    T
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">Tanmoy</h4>
                    <span className="text-[11px] text-slate-400 font-mono">01722-222222</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Receiver
                </span>
              </div>
              <div className="pt-2.5 border-t border-slate-800/80">
                <span className="text-[11px] font-medium text-slate-400">Available Balance</span>
                <div className="text-xl font-bold font-mono text-white tracking-tight transition-all duration-500 mt-0.5">
                  ৳{tanmoyBalance.toLocaleString()}
                </div>
              </div>
            </div>

          </div>

          {/* Under-animation Trust Caption */}
          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Real-time PostgreSQL row-level locks, atomic settlement, zero drift</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
