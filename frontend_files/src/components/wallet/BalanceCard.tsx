import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { TabType } from '../../types';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Cpu,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Layers
} from 'lucide-react';

interface BalanceCardProps {
  setActiveTab: (tab: TabType) => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ setActiveTab }) => {
  const { currentUser } = useAuth();

  const balanceBdt = currentUser?.balance_bdt || 0;
  const balancePoisha = currentUser?.balance || 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-700/60 p-6 sm:p-8 shadow-2xl glow-emerald-box">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar inside Card */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <span>Primary Liquid Account</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-sm font-bold text-slate-200">
              {currentUser?.name} <span className="text-xs text-slate-500 font-mono">({currentUser?.phone})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-full text-xs font-medium text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>ACID Protected</span>
        </div>
      </div>

      {/* Main Balance Display */}
      <div className="relative z-10 my-8">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          Available Guaranteed Balance
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-light text-emerald-400 font-mono">৳</span>
          <span className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-mono">
            {balanceBdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-400 ml-1">BDT</span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
          <span className="bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700 font-mono text-[11px]">
            Stored: <strong className="text-emerald-400">{balancePoisha.toLocaleString()}</strong> Poisha
          </span>
          <span className="text-[11px] text-slate-500">
            Wallet ID: <code className="font-mono text-slate-400">{currentUser?.wallet_id}</code>
          </span>
        </div>
      </div>

      {/* Quick Action Matrix */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
        <button
          onClick={() => setActiveTab('send')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Send Money</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowDownLeft className="w-4 h-4 text-teal-400" />
          <span>Request Money</span>
        </button>

        <button
          onClick={() => setActiveTab('stress')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 hover:text-white border border-indigo-700/40 font-semibold text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Concurrency Lab</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Audit Ledger</span>
        </button>
      </div>
    </div>
  );
};
