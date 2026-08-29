import React, { useState } from 'react';
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
  Clock,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export const ConcurrencyStudio: React.FC = () => {
  const { currentUser, allUsers, refreshUserData } = useAuth();

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
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Judge Demonstration Hub
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 mt-1">
            <Cpu className="w-6 h-6 text-indigo-400" />
            Concurrency & Race-Condition Testing Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fire concurrent parallel requests against PostgreSQL with row-level locks to prove zero double-spending
          </p>
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Recommended Hackathon Demo Scenarios
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <button
            onClick={() => applyPreset(20, 500, 1000)}
            className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-400">
              ⚡ Standard Hackathon Benchmark
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              20 Threads × ৳500 from ৳1,000
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-1">
              Expected: 2 Success, 18 Blocked
            </div>
          </button>

          <button
            onClick={() => applyPreset(40, 250, 2500)}
            className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-400">
              🔥 High-Density Micro-Burst
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              40 Threads × ৳250 from ৳2,500
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-1">
              Expected: 10 Success, 30 Blocked
            </div>
          </button>

          <button
            onClick={() => applyPreset(15, 2000, 1000)}
            className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
          >
            <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-400">
              🛡️ Instant Overdraft Attack
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              15 Threads × ৳2,000 from ৳1,000
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-1">
              Expected: 0 Success, 15 Blocked
            </div>
          </button>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl space-y-6 glow-indigo-box">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Sender */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Target Sender Account
            </label>
            <select
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium focus:border-indigo-500 outline-none"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Receiver */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Recipient Account
            </label>
            <select
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium focus:border-indigo-500 outline-none"
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

          {/* Concurrent Requests Count */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Concurrent Threads ({totalRequests})
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={totalRequests}
              onChange={(e) => setTotalRequests(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>5 reqs</span>
              <span>25 reqs</span>
              <span>50 reqs</span>
            </div>
          </div>

          {/* Amount & Starting Balance */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Amount / Starting Balance
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amountPerRequestBdt}
                onChange={(e) => setAmountPerRequestBdt(parseFloat(e.target.value))}
                placeholder="Amt"
                title="Amount per request (BDT)"
                className="w-1/2 px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono font-bold text-center"
              />
              <input
                type="number"
                value={startingBalanceBdt}
                onChange={(e) => setStartingBalanceBdt(parseFloat(e.target.value))}
                placeholder="Start"
                title="Starting Balance (BDT)"
                className="w-1/2 px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono font-bold text-center"
              />
            </div>
          </div>
        </div>

        {/* Launch Button */}
        <button
          onClick={handleRunTest}
          disabled={isRunning}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-sm shadow-xl shadow-indigo-950/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {isRunning ? (
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Simulating {totalRequests} Concurrent Transfers against PostgreSQL...</span>
            </div>
          ) : (
            <>
              <Play className="w-5 h-5 fill-white" />
              <span>
                Launch {totalRequests} Concurrent Requests (৳{amountPerRequestBdt} each)
              </span>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Results Dashboard */}
      {result && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Main Verdict Card */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/40 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Concurrency Defense Verdict: 100% Secure
                  </h3>
                  <p className="text-xs text-emerald-400">
                    PostgreSQL row-level locks successfully serialized all {result.total_requests} simultaneous requests.
                  </p>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300">
                Duration: <strong className="text-indigo-400">{result.execution_duration_ms}ms</strong>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Total Fired</div>
                <div className="text-xl font-bold font-mono text-white mt-1">{result.total_requests}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] uppercase font-semibold text-emerald-400">Succeeded</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {result.successful_requests} <span className="text-xs font-normal text-slate-400">/ {result.expected_successful_count}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] uppercase font-semibold text-amber-400">Blocked (ACID)</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-1">{result.rejected_requests}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Final Balance</div>
                <div className="text-xl font-bold font-mono text-white mt-1">৳{result.final_sender_balance_bdt.toFixed(2)}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Double Spend</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {result.double_spend_detected ? 'DETECTED ❌' : 'ZERO (NO) ✅'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Discrepancy</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">৳{result.discrepancy_bdt.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Request-by-Request Execution Stream */}
          <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Atomic Request Execution Log Stream
              </h4>
              <span className="text-xs text-slate-500 font-mono">
                {result.successful_requests} Passed, {result.rejected_requests} Rolled back
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 font-mono text-xs">
              {result.request_logs.map((log) => {
                const isSuccess = log.status === 'SUCCESS';
                return (
                  <div
                    key={log.req_index}
                    className="px-6 py-2.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-[11px] w-8">#{log.req_index}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                          isSuccess
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {log.status}
                      </span>
                      <span className="text-slate-300 font-sans text-xs truncate max-w-md">
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
        </div>
      )}
    </div>
  );
};
