import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ApiService } from '../../services/api';
import { LedgerAuditResult, LedgerEntry } from '../../types';
import {
  FileSpreadsheet,
  ShieldCheck,
  RotateCw,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Scale
} from 'lucide-react';

export const LedgerAuditView: React.FC = () => {
  const [audit, setAudit] = useState<LedgerAuditResult | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(20);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  const fetchLedgerData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [auditData, ledgerData] = await Promise.all([
        ApiService.getLedgerAudit(),
        ApiService.getLedgerEntries(undefined, pageSize, page * pageSize),
      ]);
      setAudit(auditData);
      setEntries(ledgerData.entries);
      setTotalEntries(ledgerData.total);
    } catch (err) {
      console.error('Failed to load ledger records:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchLedgerData();
  }, [fetchLedgerData]);

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const auditData = await ApiService.getLedgerAudit();
      setAudit(auditData);
    } catch (err) {
      console.error('Audit verification failed:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const totalPages = Math.ceil(totalEntries / pageSize);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-400" />
            Double-Entry Audit Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic mathematical invariant: <code className="text-emerald-400 font-mono">∑Debits - ∑Credits ≡ 0</code>
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRunAudit}
          disabled={isAuditing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-bold transition-all shadow-sm"
        >
          <RotateCw className={`w-4 h-4 text-emerald-400 ${isAuditing ? 'animate-spin' : ''}`} />
          <span>Verify Invariant Checksum</span>
        </motion.button>
      </div>

      {/* Financial Health Summary Banner */}
      {audit && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-2xl relative overflow-hidden space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <Scale className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-white">System Double-Entry Audit Health</span>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit ${
                audit.is_balanced
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {audit.is_balanced ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  100% Balanced (Zero Drift)
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Discrepancy Detected
                </>
              )}
            </span>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Total Debits (∑D)
              </div>
              <div className="text-lg font-bold font-mono text-rose-400">
                ৳{audit.total_debit_bdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Total Credits (∑C)
              </div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                ৳{audit.total_credit_bdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Net Drift (∑D - ∑C)
              </div>
              <div className="text-lg font-bold font-mono text-white flex items-center gap-1">
                <span>৳{audit.discrepancy_bdt.toFixed(2)}</span>
                <span className="text-xs text-emerald-400">✓</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Total Ledger Rows
              </div>
              <div className="text-lg font-bold font-mono text-slate-200">
                {audit.total_ledger_entries.toLocaleString()}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Ledger Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Immutable Double-Entry Ledger Stream
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {totalEntries} records recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Reference ID</th>
                <th className="px-5 py-3">Account</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-right">Balance Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 font-sans">
                    Loading ledger stream...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 font-sans">
                    No ledger entries found.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isDebit = entry.entry_type === 'DEBIT';
                  const amountBdt = (entry.amount / 100).toFixed(2);
                  const balanceAfterBdt = (entry.balance_after / 100).toFixed(2);

                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-5 py-3 text-slate-300 font-semibold text-[11px]">
                        {entry.reference_id}
                      </td>
                      <td className="px-5 py-3 font-sans">
                        <span className="text-slate-200 font-semibold">{entry.user_name}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${
                            isDebit
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isDebit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          {entry.entry_type}
                        </span>
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-bold ${
                          isDebit ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {isDebit ? '-' : '+'}৳{amountBdt}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-300">
                        ৳{balanceAfterBdt}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Page <span className="font-bold text-slate-200">{page + 1}</span> of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
