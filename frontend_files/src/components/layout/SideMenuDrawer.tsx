import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { FastPayLogo } from '../common/FastPayLogo';
import {
  Layers,
  FileSpreadsheet,
  Cpu,
  X,
  RotateCcw,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Database,
  ArrowUpRight
} from 'lucide-react';

interface SideMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const SideMenuDrawer: React.FC<SideMenuDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
}) => {
  const { currentUser, resetDemoData, isLoading } = useAuth();

  const handleSelect = (tab: TabType) => {
    setActiveTab(tab);
    onClose();
  };

  const sideNavItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Overview & Analytics',
      desc: 'Wallet balance, quick stats & recent timeline',
      icon: Layers,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'ledger' as TabType,
      label: 'Double-Entry Audit Ledger',
      desc: 'Immutable debit/credit journal & math integrity',
      icon: FileSpreadsheet,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'stress' as TabType,
      label: 'Concurrency & Stress Lab',
      desc: 'Multi-threaded race condition defense tester',
      icon: Cpu,
      color: 'from-amber-500 to-orange-600',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Slide-in */}
          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-screen max-w-sm bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col justify-between"
            >
              {/* Top Drawer Header */}
              <div className="p-6 border-b border-slate-800/80">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FastPayLogo size="sm" showText={false} />
                    <span className="font-bold text-slate-100 text-sm tracking-wide">
                      System & Audit
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Active Session
                  </div>
                  <div className="text-xs font-bold text-slate-200 mt-0.5">
                    {currentUser?.name || 'User'} ({currentUser?.phone})
                  </div>
                  <div className="text-xs font-mono text-emerald-400 font-bold mt-1">
                    ৳{currentUser?.balance_bdt.toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT
                  </div>
                </div>
              </div>

              {/* Main Menu Links */}
              <div className="p-4 space-y-2.5 flex-1 overflow-y-auto">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Audit & Analytics
                </div>

                {sideNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        isActive
                          ? 'bg-slate-800 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30 text-white'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${item.color} text-white shadow-sm`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>{item.label}</span>
                          {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Drawer Footer: Reset & Architecture Assurance */}
              <div className="p-4 border-t border-slate-800/80 bg-slate-950/70 space-y-3">
                <button
                  onClick={() => {
                    if (window.confirm('Reset all demo balances to ৳100,000 in PostgreSQL?')) {
                      resetDemoData();
                      onClose();
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-amber-400 flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
                  <span>Reset All Balances to ৳100k</span>
                </button>

                <div className="flex items-center gap-2 px-2 text-[10px] text-slate-500 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>PSTU 2026 Engine • Row-Locked Ledger</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
