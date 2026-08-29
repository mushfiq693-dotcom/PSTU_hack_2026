import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';
import { Transaction, TabType } from '../types';
import { BalanceCard } from '../components/wallet/BalanceCard';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Search,
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: TabType) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* 1. Primary Wallet Balance Card */}
      <BalanceCard setActiveTab={setActiveTab} />

      {/* 2. Recent Transactions Section */}
      <div className="glass-card rounded-3xl border border-slate-800/80 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              Recent Account Activity
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live double-entry verified transaction records
            </p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search reference, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 outline-none w-full sm:w-64"
            />
          </div>
        </div>

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
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500 font-sans">
                    Loading activity...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500 font-sans">
                    No transactions found.
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
                      <td className="px-4 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3.5 text-slate-300 font-semibold text-[11px]">
                        {tx.reference_id}
                      </td>
                      <td className="px-4 py-3.5 font-sans">
                        <div className="text-slate-200 font-semibold text-xs">{otherName || 'System'}</div>
                        <div className="text-slate-500 text-[10px] font-mono">{otherPhone}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {tx.category || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 font-sans text-xs truncate max-w-[150px]">
                        {tx.note || '-'}
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right font-bold text-xs ${
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
      </div>
    </div>
  );
};
