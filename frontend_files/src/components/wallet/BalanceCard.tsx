import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { TabType } from '../../types';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Cpu,
  Layers,
  ShieldCheck,
  Sparkles,
  Wallet
} from 'lucide-react';

interface BalanceCardProps {
  setActiveTab: (tab: TabType) => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ setActiveTab }) => {
  const { currentUser } = useAuth();

  const balanceBdt = currentUser?.balance_bdt || 0;
  const balancePoisha = currentUser?.balance || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 p-6 sm:p-8 shadow-2xl glow-emerald-box"
    >
      {/* Subtle background ambient gradients */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Meta Bar */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>Primary Wallet</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-sm font-bold text-slate-200">
              {currentUser?.name} <span className="text-xs text-slate-500 font-mono">({currentUser?.phone})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-full text-xs font-medium text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>PostgreSQL ACID Locked</span>
        </div>
      </div>

      {/* Main Balance Display */}
      <div className="relative z-10 my-7">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Guaranteed Liquid Funds
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-light text-emerald-400 font-mono">৳</span>
          <motion.span
            key={balanceBdt}
            initial={{ opacity: 0.8, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-mono"
          >
            {balanceBdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </motion.span>
          <span className="text-xs sm:text-sm font-semibold text-slate-400 ml-1">BDT</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
          <span className="bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-[11px]">
            Stored: <strong className="text-emerald-400">{balancePoisha.toLocaleString()}</strong> Poisha
          </span>
          <span className="text-[11px] text-slate-500">
            Wallet: <code className="font-mono text-slate-400">{currentUser?.wallet_id}</code>
          </span>
        </div>
      </div>

      {/* Action Buttons Matrix */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-slate-800/80">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('send')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition-all"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Send Money</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('requests')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-slate-700/80 font-bold text-xs sm:text-sm transition-all"
        >
          <ArrowDownLeft className="w-4 h-4 text-teal-400" />
          <span>Request Money</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('stress')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 hover:text-white border border-indigo-700/50 font-bold text-xs sm:text-sm transition-all"
        >
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Concurrency Lab</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('ledger')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-slate-700/80 font-bold text-xs sm:text-sm transition-all"
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Audit Ledger</span>
        </motion.button>
      </div>
    </motion.div>
  );
};
