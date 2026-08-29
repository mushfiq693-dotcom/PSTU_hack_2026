import React, { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../../services/api';
import { LedgerAuditResult, LedgerEntry } from '../../types';
import {
  FileSpreadsheet,
  ShieldCheck,
  RotateCw,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
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
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-400" />
            Double-Entry Auditable Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-proof immutable ledger enforcing the financial invariant: <code className="text-emerald-400 font-mono">∑Debits - ∑Credits ≡ 0</code>
          </p>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={isAuditing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <RotateCw className={`w-4 h-4 text-emerald-400 ${isAuditing ? 'animate-spin' : ''}`} />
          <span>Verify Mathematical Invariant</span>
        </button>
      </div>

      {/* Financial Integrity Audit Status Box */}
      {audit && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-700/60 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  System Financial Health
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
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
              <h2 className="text-lg font-bold text-white mt-1">
                PostgreSQL Double-Entry Verification Report
              </h2>
            </div>

            <div className="text-xs text-slate-400">
              Last Verified: <span className="text-slate-200 font-mono">{new Date(audit.audited_at).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Total System Debits (∑D)
              </div>
              <div className="text-xl font-bold font-mono text-rose-400">
                ৳{audit.total_debit_bdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Total System Credits (∑C)
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                ৳{audit.total_credit_bdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Discrepancy (∑D - ∑C)
              </div>
              <div className="text-xl font-bold font-mono text-white flex items-center gap-1">
                <span>৳{audit.discrepancy_bdt.toFixed(2)}</span>
                <span className="text-xs text-emerald-400">✓</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Total Ledger Entries
              </div>
              <div className="text-xl font-bold font-mono text-slate-200">
                {audit.total_ledger_entries.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Immutable Ledger Exploration Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Immutable Double-Entry Ledger Logs
          </h3>
          <span className="text-xs text-slate-400">
            Total records: <strong className="text-slate-200 font-mono">{totalEntries}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Reference ID</th>
                <th className="px-6 py-3.5">Account / User</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5 text-right">Amount (BDT)</th>
                <th className="px-6 py-3.5 text-right">Balance Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-sans">
                    Loading ledger data...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-sans">
                    No ledger entries found.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isDebit = entry.entry_type === 'DEBIT';
                  const amountBdt = (entry.amount / 100).toFixed(2);
                  const balanceAfterBdt = (entry.balance_after / 100).toFixed(2);

                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-slate-300 font-semibold text-[11px]">
                        {entry.reference_id}
                      </td>
                      <td className="px-6 py-3.5 font-sans">
                        <div className="text-slate-200 font-semibold text-xs">{entry.user_name}</div>
                        <div className="text-slate-500 text-[10px] font-mono">{entry.user_phone}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit ${
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
                        className={`px-6 py-3.5 text-right font-bold text-xs ${
                          isDebit ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {isDebit ? '-' : '+'}৳{amountBdt}
                      </td>
                      <td className="px-6 py-3.5 text-right text-slate-300 text-xs">
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
          <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
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
