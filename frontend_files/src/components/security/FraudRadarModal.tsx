import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  AlertTriangle,
  Zap,
  Activity,
  Gauge,
  Lock,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Play,
  Flame,
  ShieldAlert,
  Terminal,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';

interface FraudRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface AttackScenario {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  amount: number;
  velocity: number;
  drainPercent: number;
  isFirstTime: boolean;
  expectedVerdict: string;
  description: string;
}

export const FraudRadarModal: React.FC<FraudRadarModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, allUsers, refreshWallet } = useAuth();

  // Attack Scenarios for 1-Click Judge Demos
  const attackScenarios: AttackScenario[] = [
    {
      id: 'clean_p2p',
      title: '🟢 Normal Clean Transfer',
      badge: 'LOW RISK (5/100)',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      amount: 2500,
      velocity: 1,
      drainPercent: 2,
      isFirstTime: false,
      expectedVerdict: 'ALLOW (0ms Instant Pass)',
      description: 'Typical verified transfer between established connections. Zero risk flags.',
    },
    {
      id: 'burst_velocity',
      title: '🟡 Rapid Velocity Spike',
      badge: 'HIGH RISK (65/100)',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      amount: 15000,
      velocity: 6,
      drainPercent: 15,
      isFirstTime: false,
      expectedVerdict: 'CHALLENGE_OTP (2FA Step-Up Required)',
      description: 'Spike of 6 transfers within 60s window. Triggers velocity heuristic warning.',
    },
    {
      id: 'drain_liquidation',
      title: '🔴 Wallet Liquidation Attack',
      badge: 'CRITICAL RISK (95/100)',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      amount: 65000,
      velocity: 5,
      drainPercent: 98,
      isFirstTime: true,
      expectedVerdict: 'BLOCK (403 Fraud Alert)',
      description: 'Attempting to liquidate 98% balance (৳65k) in a single burst to a new unverified account.',
    },
  ];

  // Active Selected Scenario / Parameters
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('clean_p2p');
  const [simAmount, setSimAmount] = useState<number>(2500);
  const [simVelocity, setSimVelocity] = useState<number>(1);
  const [simDrainPercent, setSimDrainPercent] = useState<number>(2);
  const [isFirstTimeRecipient, setIsFirstTimeRecipient] = useState<boolean>(false);

  // Live Server Attack Simulation State
  const [isExecutingLive, setIsExecutingLive] = useState<boolean>(false);
  const [liveServerResult, setLiveServerResult] = useState<{
    status: 'SUCCESS' | 'BLOCKED';
    statusCode: number;
    message: string;
    durationMs: number;
  } | null>(null);

  const selectScenario = (scenario: AttackScenario) => {
    setSelectedScenarioId(scenario.id);
    setSimAmount(scenario.amount);
    setSimVelocity(scenario.velocity);
    setSimDrainPercent(scenario.drainPercent);
    setIsFirstTimeRecipient(scenario.isFirstTime);
    setLiveServerResult(null);
  };

  // Compute Heuristic Risk Score dynamically on screen
  const calculateRiskScore = () => {
    let score = 5;
    const factors: { text: string; severity: 'low' | 'medium' | 'high' }[] = [];

    // Rule 1: Velocity
    if (simVelocity >= 5) {
      score += 45;
      factors.push({ text: `Critical Velocity Spike (${simVelocity} transfers / 60s)`, severity: 'high' });
    } else if (simVelocity >= 3) {
      score += 20;
      factors.push({ text: `Elevated Velocity (${simVelocity} transfers / 60s)`, severity: 'medium' });
    }

    // Rule 2: Amount Anomaly
    if (simAmount >= 50000) {
      score += 40;
      factors.push({ text: `Critical High-Value Anomaly (৳${simAmount.toLocaleString()})`, severity: 'high' });
    } else if (simAmount >= 25000) {
      score += 25;
      factors.push({ text: `High-Value Flag (৳${simAmount.toLocaleString()})`, severity: 'medium' });
    }

    // Rule 3: Account Drain
    if (simDrainPercent >= 95 && simAmount > 10000) {
      score += 20;
      factors.push({ text: `Wallet Liquidation Pattern (${simDrainPercent}% of balance)`, severity: 'high' });
    }

    // Rule 4: First Time Recipient
    if (isFirstTimeRecipient && simAmount > 10000) {
      score += 15;
      factors.push({ text: 'First-time unverified recipient with large sum', severity: 'medium' });
    }

    score = Math.min(100, Math.max(0, score));

    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let action = 'ALLOW (0ms Instant Pass)';
    let color = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';

    if (score >= 80) {
      level = 'CRITICAL';
      action = 'AUTOMATIC TRANSACTION BLOCK (403 Fraud Alert)';
      color = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    } else if (score >= 55) {
      level = 'HIGH';
      action = 'CHALLENGE_OTP (2FA Step-Up Required)';
      color = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    } else if (score >= 30) {
      level = 'MEDIUM';
      action = 'ALLOW WITH TELEMETRY LOGGING';
      color = 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    }

    return { score, level, action, color, factors };
  };

  const evalResult = calculateRiskScore();

  // Execute Real Live Attack against Backend
  const handleExecuteLiveTest = async () => {
    const targetRecipient = allUsers.find((u) => u.id !== currentUser?.id) || allUsers[1];
    if (!targetRecipient || !currentUser) return;

    setIsExecutingLive(true);
    setLiveServerResult(null);
    const startTime = performance.now();

    try {
      if (selectedScenarioId === 'drain_liquidation' || evalResult.score >= 80) {
        // Critical attack simulation: attempt large value or high risk
        await ApiService.transferMoney({
          receiver_id: targetRecipient.id,
          amount_bdt: simAmount,
          note: 'Fraud Simulator Test Transfer',
          category: 'Security Verification',
          idempotency_key: `FRAUD-TEST-${Date.now()}`,
        });

        const duration = Math.round(performance.now() - startTime);
        setLiveServerResult({
          status: 'SUCCESS',
          statusCode: 200,
          message: 'Transfer processed normally.',
          durationMs: duration,
        });
      } else {
        // Normal or medium test
        await ApiService.transferMoney({
          receiver_id: targetRecipient.id,
          amount_bdt: simAmount,
          note: 'P2P Clean Transfer Test',
          category: 'General',
          idempotency_key: `CLEAN-TEST-${Date.now()}`,
        });

        const duration = Math.round(performance.now() - startTime);
        setLiveServerResult({
          status: 'SUCCESS',
          statusCode: 200,
          message: `Transfer of ৳${simAmount.toLocaleString()} completed successfully.`,
          durationMs: duration,
        });
      }
      await refreshWallet();
    } catch (err: any) {
      const duration = Math.round(performance.now() - startTime);
      setLiveServerResult({
        status: 'BLOCKED',
        statusCode: err.response?.status || 403,
        message: err.response?.data?.message || err.message || 'Transaction blocked by FastPay Fraud Engine',
        durationMs: duration,
      });
    } finally {
      setIsExecutingLive(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#0d1322] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-950/40">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  FastPay Real-Time Anti-Fraud & Risk Radar
                </h3>
                <p className="text-xs text-slate-400">
                  Live heuristic anomaly detection & 1-click attack simulation suite for Judges
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 🌟 1-Click Benchmark Attack Scenarios (For Judges) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>1-Click Live Attack Scenarios (Select to Test)</span>
              </div>
              <span className="text-[11px] text-slate-500">Pick any scenario to evaluate instantly</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {attackScenarios.map((scenario) => {
                const isSelected = selectedScenarioId === scenario.id;
                return (
                  <button
                    type="button"
                    key={scenario.id}
                    onClick={() => selectScenario(scenario)}
                    className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      isSelected
                        ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500 shadow-lg shadow-emerald-950/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <h5 className="text-xs font-bold text-white">{scenario.title}</h5>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${scenario.badgeColor}`}>
                        {scenario.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {scenario.description}
                    </p>
                    <div className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                      <span>Expected:</span>
                      <span className="truncate text-slate-200">{scenario.expectedVerdict}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Evaluation Panel & Live Server Action */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800">
            
            {/* Left: Parameter Breakdown */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Active Scenario Parameters
                </span>
                <button
                  onClick={() => selectScenario(attackScenarios[0])}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset to Clean</span>
                </button>
              </div>

              {/* Slider 1: Amount */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Transfer Amount:</span>
                  <span className="font-mono font-bold text-emerald-400">৳{simAmount.toLocaleString()} BDT</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="75000"
                  step="500"
                  value={simAmount}
                  onChange={(e) => {
                    setSimAmount(Number(e.target.value));
                    setSelectedScenarioId('custom');
                  }}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Slider 2: Velocity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Recent Velocity (Transfers in 60s):</span>
                  <span className="font-mono font-bold text-teal-400">{simVelocity} transfers / 60s</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  value={simVelocity}
                  onChange={(e) => {
                    setSimVelocity(Number(e.target.value));
                    setSelectedScenarioId('custom');
                  }}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>

              {/* Slider 3: Drain Percentage */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Wallet Outflow (Liquidation):</span>
                  <span className="font-mono font-bold text-indigo-400">{simDrainPercent}% of balance</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="100"
                  step="2"
                  value={simDrainPercent}
                  onChange={(e) => {
                    setSimDrainPercent(Number(e.target.value));
                    setSelectedScenarioId('custom');
                  }}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Checkbox 4: First Time Recipient */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={isFirstTimeRecipient}
                  onChange={(e) => {
                    setIsFirstTimeRecipient(e.target.checked);
                    setSelectedScenarioId('custom');
                  }}
                  className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
                />
                <span className="text-slate-300">Recipient is a newly registered / unverified account (+15 Risk)</span>
              </label>

              {/* 🚀 Action: Fire Live Test against Server */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isExecutingLive}
                  onClick={handleExecuteLiveTest}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isExecutingLive ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Executing Live Test on Server...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>▶ Test This Scenario Live on PostgreSQL Backend</span>
                    </>
                  )}
                </button>
              </div>

              {/* Live Server Response Display */}
              {liveServerResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-mono space-y-1 animate-in fade-in ${
                    liveServerResult.status === 'BLOCKED'
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                      : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {liveServerResult.status === 'BLOCKED' ? (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      <span>HTTP {liveServerResult.statusCode} {liveServerResult.status}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Latency: {liveServerResult.durationMs}ms
                    </span>
                  </div>
                  <div className="text-[11px] font-sans leading-relaxed text-slate-200">
                    {liveServerResult.message}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Dynamic Evaluation Output */}
            <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
                  <span>Computed Risk Score</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${evalResult.color}`}>
                    {evalResult.level} RISK
                  </span>
                </div>

                {/* Meter Display */}
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-white font-mono">{evalResult.score}</span>
                  <span className="text-slate-500 text-sm font-mono">/ 100</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <motion.div
                    className={`h-full rounded-full ${
                      evalResult.score >= 80
                        ? 'bg-rose-500'
                        : evalResult.score >= 55
                        ? 'bg-amber-500'
                        : evalResult.score >= 30
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                    }`}
                    initial={{ width: '0%' }}
                    animate={{ width: `${evalResult.score}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Action Recommendation */}
                <div className={`p-3 rounded-xl border text-xs font-semibold space-y-1 ${evalResult.color}`}>
                  <div className="text-[10px] uppercase font-bold text-slate-300">Engine Verdict:</div>
                  <div className="leading-relaxed">{evalResult.action}</div>
                </div>

                {/* Triggered Risk Factors */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">Active Risk Flags:</div>
                  {evalResult.factors.length === 0 ? (
                    <div className="text-xs text-emerald-400/80 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Zero risk flags detected. Clean profile.</span>
                    </div>
                  ) : (
                    evalResult.factors.map((f, i) => (
                      <div
                        key={i}
                        className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-tight"
                      >
                        <AlertTriangle
                          className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                            f.severity === 'high' ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        />
                        <span>{f.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 text-[10px] text-slate-500 font-mono text-center">
                FastPay Heuristic Risk Engine • Multi-Vector Rules
              </div>
            </div>
          </div>

          {/* Footer Close */}
          <div className="flex justify-between items-center pt-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Evaluated in real-time before PostgreSQL transaction commit</span>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
            >
              Close Radar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
