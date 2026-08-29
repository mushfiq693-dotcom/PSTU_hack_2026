import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';
import { Transaction, TabType } from '../types';
import { BalanceCard } from '../components/wallet/BalanceCard';
import {
  Layers,
  Search,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: TabType) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { currentUser, unfreezeMyWallet, refreshWallet } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isUnfreezing, setIsUnfreezing] = useState<boolean>(false);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const txs = await ApiService.getHistory(20);
      setTransactions(txs);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleUnfreeze = async () => {
    setIsUnfreezing(true);
    try {
      await unfreezeMyWallet();
      await fetchHistory();
    } catch (e) {
      console.error('Unfreeze failed:', e);
    } finally {
      setIsUnfreezing(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const search = searchTerm.toLowerCase();
    return (
      tx.reference_id?.toLowerCase().includes(search) ||
      tx.sender_name?.toLowerCase().includes(search) ||
      tx.receiver_name?.toLowerCase().includes(search) ||
      tx.note?.toLowerCase().includes(search) ||
      tx.category?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      
      {/* 🚨 CRITICAL FRAUD INTERVENTION & AUTO-FROZEN SECURITY BANNER */}
      {currentUser?.status === 'FROZEN' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border-2 border-rose-500/80 shadow-2xl shadow-rose-950/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 shrink-0 animate-pulse">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 uppercase">
                  SECURITY DEFENSE ACTIVE
                </span>
                <h4 className="text-base font-extrabold text-white">
                  FastPay Fraud Engine Auto-Froze This Wallet
                </h4>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                An unauthorized high-risk attack (liquidation/burst anomaly) was intercepted on your account from a rogue session. All outgoing funds have been locked to preserve your balance. <strong>Zero Taka was lost!</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
            <button
              onClick={handleUnfreeze}
              disabled={isUnfreezing}
              className="flex-1 md:flex-none px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all"
            >
              {isUnfreezing ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                  <span>Restoring Account...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>🛡️ Verify & Unfreeze Wallet</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* 1. Primary Wallet Balance Card */}
      <BalanceCard setActiveTab={setActiveTab} />

      {/* 2. Recent Transactions Section with Professional Expand/Collapse Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="glass-card rounded-3xl border border-slate-800/80 p-6 sm:p-7 shadow-2xl space-y-5"
      >
        {/* Section Header with Expand / Collapse Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Recent Activity</h3>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-emerald-400">
                  {transactions.length} events
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Live double-entry verified transaction stream
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Search bar (visible when expanded) */}
            {isExpanded && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search ref, user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 outline-none w-44 sm:w-56 transition-all"
                />
              </div>
            )}

            {/* Professional Expand/Collapse Toggle */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
            >
              <span>{isExpanded ? 'Collapse' : 'Expand View'}</span>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Accordion Content */}
        <AnimatePresence initial={false}>
          {isExpanded ? (
            <motion.div
              key="expanded-table"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden space-y-4"
            >
              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Counterparty</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Note</th>
                      <th className="px-4 py-3 text-right">Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-slate-500 font-sans">
                          Loading recent activity...
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-slate-500 font-sans">
                          No transactions recorded.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => {
                        const isDebit = tx.sender_phone === currentUser?.phone;
                        const otherName = isDebit ? tx.receiver_name : tx.sender_name;
                        const otherPhone = isDebit ? tx.receiver_phone : tx.sender_phone;
                        const amountBdt = (tx.amount / 100).toFixed(2);

                        return (
                          <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 text-slate-400 text-[11px] whitespace-nowrap">
                              {new Date(tx.created_at).toLocaleDateString()}{' '}
                              {new Date(tx.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-4 py-3 text-slate-300 font-semibold text-[11px]">
                              {tx.reference_id}
                            </td>
                            <td className="px-4 py-3 font-sans">
                              <span className="text-slate-200 font-semibold text-xs">
                                {otherName || 'System'}
                              </span>
                              <span className="text-slate-500 text-[10px] font-mono ml-1.5">
                                ({otherPhone})
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-900 text-slate-300 border border-slate-800">
                                {tx.category || 'General'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-400 font-sans text-xs truncate max-w-[140px]">
                              {tx.note || '-'}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-bold text-xs ${
                                isDebit ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {isDebit ? '-' : '+'}৳{amountBdt}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            /* Collapsed Compact Summary Preview */
            <motion.div
              key="collapsed-summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsExpanded(true)}
              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition-all group"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-medium">
                  {transactions.length > 0
                    ? `Latest: ${transactions[0].sender_name || 'User'} ➔ ${transactions[0].receiver_name || 'User'} (৳${(transactions[0].amount / 100).toFixed(2)})`
                    : 'No recent transactions'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold group-hover:text-emerald-300 text-[11px]">
                <span>Click to Expand All Activity</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
