import React, { useState, useEffect } from 'react';
import { Zap, Banknote, Check, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
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
    <div className="min-h-screen bg-[#FBFDFD] text-slate-900 flex flex-col justify-between selection:bg-teal-100 selection:text-teal-900">
      {/* 1. Header (Sticky & Minimal) */}
      <header className="sticky top-0 z-50 bg-[#FBFDFD]/80 backdrop-blur-md border-b border-slate-100/80 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-sm shadow-teal-700/20">
              <Zap className="w-5 h-5 fill-white/20 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">FastPay</span>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Log In
            </button>
            <button className="text-sm font-medium bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl shadow-sm shadow-teal-700/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Register
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero & 3. Live Transaction Animation */}
      <main className="max-w-5xl mx-auto px-6 py-12 md:py-16 flex-1 flex flex-col items-center justify-center text-center">
        {/* Understated Tagline */}
        <p className="text-base md:text-lg text-slate-500 font-medium tracking-tight mb-8">
          Send money. Instantly. Trustworthy to the last taka.
        </p>

        {/* Action CTAs */}
        <div className="flex items-center gap-4 mb-16">
          <button className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold px-6 py-3 rounded-2xl shadow-md shadow-teal-700/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button className="bg-white hover:bg-slate-50 text-slate-700 font-medium px-6 py-3 rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
            Log In
          </button>
        </div>

        {/* Centerpiece: Live SwiftUI-style Transaction Mockups */}
        <div className="w-full max-w-2xl bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-4">
            
            {/* Phone A: Shakib (Sender) */}
            <div className="w-full sm:w-60 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 text-left transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                    S
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Shakib</h4>
                    <span className="text-[11px] text-slate-400 font-mono">01712-345678</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-slate-200/60 text-slate-600">
                  Sender
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-400">Available Balance</span>
                <div className="text-xl font-bold font-mono text-slate-900 tracking-tight transition-all duration-500">
                  ৳{shakibBalance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Middle: Flight path with Traveling Money Badge */}
            <div className="relative flex-1 w-full sm:w-auto h-16 flex items-center justify-center px-2">
              {/* Dashed connector line */}
              <div className="w-full border-t-2 border-dashed border-teal-200/80 absolute"></div>

              {/* Animated Floating Coin / Money Pill */}
              <div
                key={cycle}
                className="absolute z-10 flex items-center gap-1.5 bg-teal-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg shadow-teal-700/30 animate-flyMoney"
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>৳2,500</span>
              </div>
            </div>

            {/* Phone B: Tanmoy (Receiver) */}
            <div className="w-full sm:w-60 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 text-left relative transition-all">
              {/* Green Receipt Pulse */}
              <div
                className={`absolute -top-3 right-4 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 transition-all duration-300 ${
                  showPulse ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span>+৳2,500 Received</span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-bold">
                    T
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Tanmoy</h4>
                    <span className="text-[11px] text-slate-400 font-mono">01812-987654</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700">
                  Receiver
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-400">Available Balance</span>
                <div className="text-xl font-bold font-mono text-slate-900 tracking-tight transition-all duration-500">
                  ৳{tanmoyBalance.toLocaleString()}
                </div>
              </div>
            </div>

          </div>

          {/* Under-animation Trust Caption */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-ping"></span>
            <span>Real-time, atomic, zero drift</span>
          </div>
        </div>
      </main>

      {/* 4. Footer (Minimal) */}
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <p>FastPay Engine • PSTU National Hackathon 2026. Real-time ACID Money Movement.</p>
      </footer>
    </div>
  );
};
