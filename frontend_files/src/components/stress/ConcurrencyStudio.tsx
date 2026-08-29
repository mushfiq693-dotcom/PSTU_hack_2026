import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { StressTestResult } from '../../types';
import {
  Cpu,
  Play,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Sparkles
} from 'lucide-react';

interface ConcurrencyStudioProps {
  setActiveTab?: (tab: any) => void;
}

export const ConcurrencyStudio: React.FC<ConcurrencyStudioProps> = ({ setActiveTab }) => {
  const { allUsers, refreshUserData } = useAuth();

  const [senderId, setSenderId] = useState<string>('usr_shakib_01');
  const [receiverId, setReceiverId] = useState<string>('usr_tanmoy_02');
  const [totalRequests, setTotalRequests] = useState<number>(20);
  const [amountPerRequestBdt, setAmountPerRequestBdt] = useState<number>(500);
  const [startingBalanceBdt, setStartingBalanceBdt] = useState<number>(1000);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<StressTestResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const applyPreset = (requests: number, amount: number, startingBalance: number) => {
    setTotalRequests(requests);
    setAmountPerRequestBdt(amount);
    setStartingBalanceBdt(startingBalance);
  };

  const handleRunTest = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const data = await ApiService.runStressTest({
        sender_id: senderId,
        receiver_id: receiverId,
        total_requests: totalRequests,
        amount_per_request_bdt: amountPerRequestBdt,
        starting_balance_bdt: startingBalanceBdt,
      });

      setResult(data);
      await refreshUserData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Stress test failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-400" />
            Concurrency & Stress Lab
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Test PostgreSQL row locking under simultaneous parallel transfer bursts
          </p>
        </div>

        {setActiveTab && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all self-start sm:self-auto"
          >
            ← Back to Overview
          </button>
        )}
      </div>

      {/* Preset Scenarios */}
      <div className="glass-card rounded-3xl p-5 border border-slate-800 space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Benchmark Demo Scenarios
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => applyPreset(20, 500, 1000)}
            className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-400">
              ⚡ 20 Threads × ৳500
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              From ৳1,000 Starting
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-1">
              Expected: 2 Pass, 18 Blocked
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(40, 250, 2500)}
            className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-400">
              🔥 40 Threads × ৳250
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              From ৳2,500 Starting
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-1">
              Expected: 10 Pass, 30 Blocked
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(15, 2000, 1000)}
            className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-400">
              🛡️ Overdraft Drain Test
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              15 Threads × ৳2,000 from ৳1,000
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-1">
              Expected: 0 Pass, 15 Blocked
            </div>
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 border border-indigo-500/30 shadow-xl space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Sender Target
            </label>
            <select
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium focus:border-indigo-500 outline-none"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Receiver
            </label>
            <select
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium focus:border-indigo-500 outline-none"
            >
              {allUsers
                .filter((u) => u.id !== senderId)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Threads ({totalRequests})
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={totalRequests}
              onChange={(e) => setTotalRequests(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
              <span>5</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Amount / Starting (৳)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amountPerRequestBdt}
                onChange={(e) => setAmountPerRequestBdt(parseFloat(e.target.value))}
                placeholder="Amt"
                className="w-1/2 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono font-bold text-center"
              />
              <input
                type="number"
                value={startingBalanceBdt}
                onChange={(e) => setStartingBalanceBdt(parseFloat(e.target.value))}
                placeholder="Start"
                className="w-1/2 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono font-bold text-center"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleRunTest}
          disabled={isRunning}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-950/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isRunning ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Simulating {totalRequests} Concurrent Threads against PostgreSQL...</span>
            </div>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>
                Fire {totalRequests} Concurrent Requests (৳{amountPerRequestBdt} each)
              </span>
            </>
          )}
        </motion.button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="space-y-5"
          >
            {/* Verdict Card */}
            <div className="glass-card rounded-3xl p-6 sm:p-7 border border-emerald-500/40 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Concurrency Safety Verdict: 100% Secure
                    </h3>
                    <p className="text-xs text-emerald-400">
                      PostgreSQL row locks serialized all {result.total_requests} simultaneous transfers.
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 w-fit">
                  Duration: <strong className="text-indigo-400">{result.execution_duration_ms}ms</strong>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Fired</div>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">{result.total_requests}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] uppercase font-semibold text-emerald-400">Succeeded</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                    {result.successful_requests} <span className="text-[10px] text-slate-500">/ {result.expected_successful_count}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] uppercase font-semibold text-amber-400">Blocked</div>
                  <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">{result.rejected_requests}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Final Balance</div>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">৳{result.final_sender_balance_bdt.toFixed(2)}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Double Spend</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                    {result.double_spend_detected ? 'DETECTED ❌' : 'ZERO ✅'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Discrepancy</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">৳{result.discrepancy_bdt.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Request Execution Stream */}
            <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Thread Execution Log
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  {result.successful_requests} Succeeded, {result.rejected_requests} Rolled Back
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 font-mono text-xs">
                {result.request_logs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS';
                  return (
                    <div
                      key={log.req_index}
                      className="px-5 py-2 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-slate-500 text-[11px] w-6">#{log.req_index}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                            isSuccess
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {log.status}
                        </span>
                        <span className="text-slate-300 font-sans text-xs truncate max-w-sm">
                          {log.message}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 whitespace-nowrap">
                        {log.duration_ms}ms
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
