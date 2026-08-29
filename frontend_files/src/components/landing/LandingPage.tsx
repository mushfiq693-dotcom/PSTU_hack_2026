import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FastPayLogo } from '../common/FastPayLogo';
import { AuthModal } from '../auth/AuthModal';
import {
  Banknote,
  Check,
  LogIn,
  UserPlus
} from 'lucide-react';

interface LandingPageProps {
  onAuthSuccess?: () => void;
  openAuthModalDirectly?: 'login' | 'register' | null;
  onCloseDirectModal?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onAuthSuccess,
  openAuthModalDirectly = null,
  onCloseDirectModal,
}) => {
  const [cycle, setCycle] = useState<number>(0);
  const [shakibBalance, setShakibBalance] = useState<number>(100000);
  const [tanmoyBalance, setTanmoyBalance] = useState<number>(100000);
  const [showPulse, setShowPulse] = useState<boolean>(false);

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');

  useEffect(() => {
    if (openAuthModalDirectly) {
      setAuthModalMode(openAuthModalDirectly);
      setAuthModalOpen(true);
    }
  }, [openAuthModalDirectly]);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleCloseModal = () => {
    setAuthModalOpen(false);
    if (onCloseDirectModal) onCloseDirectModal();
  };

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
    <div className="min-h-[82vh] flex flex-col justify-center items-center">
      
      {/* Hero & Live Transaction Animation */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-16 flex-1 flex flex-col items-center justify-center text-center">
        
        {/* Hero Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-4xl sm:text-6xl font-bold text-white tracking-tight leading-[1.15] max-w-2xl mb-8"
        >
          Send money.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            Instantly.
          </span>
          <br />
          Trustworthy to the last poisha.
        </motion.h1>

        {/* Action CTAs: Clean & Minimal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-3.5 mb-14"
        >
          {/* 1. Create Account Button */}
          <button
            onClick={() => openAuth('register')}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>

          {/* 2. Log In Button */}
          <button
            onClick={() => openAuth('login')}
            className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 font-semibold px-6 py-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            <LogIn className="w-4 h-4 text-emerald-400" />
            <span>Log In</span>
          </button>
        </motion.div>

        {/* Centerpiece: Clean Live Transaction Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="w-full max-w-xl glass-card rounded-2xl p-5 sm:p-7 shadow-xl relative overflow-hidden"
        >
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-3">
            
            {/* Phone A: Shakib (Sender) */}
            <div className="w-full sm:w-52 bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 text-left transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold border border-slate-700/60">
                    S
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Shakib</h4>
                    <span className="text-[10px] text-slate-500 font-mono">01711-111111</span>
                  </div>
                </div>
                <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
                  Sender
                </span>
              </div>
              <div className="pt-2 border-t border-slate-850">
                <span className="text-[10px] text-slate-400">Available</span>
                <div className="text-base font-bold font-mono text-slate-100 tracking-tight transition-all mt-0.5">
                  ৳{shakibBalance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Flight Path with Animated Traveling Money Pill */}
            <div className="relative flex-1 w-full sm:w-auto h-12 flex items-center justify-center px-2">
              <div className="w-full border-t border-dashed border-emerald-500/30 absolute"></div>

              <div
                key={cycle}
                className="absolute z-10 flex items-center gap-1 bg-emerald-500 text-slate-950 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md shadow-emerald-950/40 animate-flyMoney"
              >
                <Banknote className="w-3 h-3" />
                <span>৳2,500</span>
              </div>
            </div>

            {/* Phone B: Tanmoy (Receiver) */}
            <div className="w-full sm:w-52 bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 text-left relative transition-all">
              {/* Green Receipt Pulse */}
              <div
                className={`absolute -top-3 right-3 bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 transition-all duration-300 ${
                  showPulse ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
              >
                <Check className="w-3 h-3 stroke-[2.5]" />
                <span>+৳2,500</span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-900/60 text-teal-300 flex items-center justify-center text-xs font-bold border border-teal-700/40">
                    T
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Tanmoy</h4>
                    <span className="text-[10px] text-slate-500 font-mono">01722-222222</span>
                  </div>
                </div>
                <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Receiver
                </span>
              </div>
              <div className="pt-2 border-t border-slate-850">
                <span className="text-[10px] text-slate-400">Available</span>
                <div className="text-base font-bold font-mono text-slate-100 tracking-tight transition-all mt-0.5">
                  ৳{tanmoyBalance.toLocaleString()}
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </main>

      {/* Interactive Authentication & OTP Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={handleCloseModal}
        initialMode={authModalMode}
        onSuccess={() => {
          if (onAuthSuccess) onAuthSuccess();
        }}
      />
    </div>
  );
};
