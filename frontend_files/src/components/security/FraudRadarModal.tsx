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
  Play,
  RefreshCw
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
  summary: string;
}

export const FraudRadarModal: React.FC<FraudRadarModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, allUsers, refreshWallet } = useAuth();

  // 3 Focused Attack Scenarios
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
      expectedVerdict: '✅ ALLOW (0ms Instant Pass)',
      summary: 'Verified transfer between contacts with zero risk flags.',
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
      expectedVerdict: '⚠️ CHALLENGE (2FA OTP Step-Up)',
      summary: 'Burst of 6 transfers within 60s window exceeding limit.',
    },
    {
      id: 'drain_liquidation',
      title: '🔴 Liquidation & Drain Attack',
      badge: 'CRITICAL (95/100)',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      amount: 65000,
      velocity: 5,
      drainPercent: 98,
      isFirstTime: true,
      expectedVerdict: '🚫 403 BLOCKED (Fraud Intercepted)',
      summary: 'Attempting to liquidate 98% balance (৳65,000) in a single burst.',
    },
  ];

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
    const factors: string[] = [];

    if (simVelocity >= 5) {
      score += 60;
      factors.push(`Critical Velocity Spike (${simVelocity} tx / 60s)`);
    } else if (simVelocity >= 3) {
      score += 30;
      factors.push(`Elevated Velocity (${simVelocity} tx / 60s)`);
    }

    if (simAmount >= 50000) {
      score += 75;
      factors.push(`Critical High-Value Transfer Anomaly (৳${simAmount.toLocaleString()})`);
    } else if (simAmount >= 25000) {
      score += 35;
      factors.push(`High-Value Transfer Flag (৳${simAmount.toLocaleString()})`);
    }

    if (simDrainPercent >= 90 && simAmount > 10000) {
      score += 30;
      factors.push(`Wallet Liquidation (>90% balance drain)`);
    }

    if (isFirstTimeRecipient && simAmount > 10000) {
      score += 20;
      factors.push('First-Time High-Value Recipient');
    }

    score = Math.min(100, Math.max(0, score));

    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let action = 'ALLOW (0ms Instant Pass)';
    let color = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';

    if (score >= 70) {
      level = 'CRITICAL';
      action = 'AUTOMATIC TRANSACTION BLOCK (403 Fraud Alert)';
      color = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    } else if (score >= 45) {
      level = 'HIGH';
      action = 'CHALLENGE_OTP (2FA Step-Up Required)';
      color = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    } else if (score >= 25) {
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
      await ApiService.transferMoney({
        receiver_id: targetRecipient.id,
        amount_bdt: simAmount,
        note: selectedScenarioId === 'drain_liquidation' || evalResult.score >= 70 ? 'Liquidation Drain Attack' : 'P2P Transfer',
        category: selectedScenarioId === 'drain_liquidation' || evalResult.score >= 70 ? 'Fraud Simulation' : 'General',
        idempotency_key: `FRAUD-EVAL-${Date.now()}`,
      });

      const duration = Math.round(performance.now() - startTime);
      setLiveServerResult({
        status: 'SUCCESS',
        statusCode: 200,
        message: `Transfer of ৳${simAmount.toLocaleString()} settled atomically with zero discrepancy.`,
        durationMs: duration,
      });
      await refreshWallet();
    } catch (err: any) {
      const duration = Math.round(performance.now() - startTime);
      setLiveServerResult({
        status: 'BLOCKED',
        statusCode: err.response?.status || 403,
        message: err.response?.data?.message || err.message || 'Transaction blocked by FastPay Fraud Engine.',
        durationMs: duration,
      });
    } finally {
      setIsExecutingLive(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="relative w-full max-w-3xl bg-[#0b101d] border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  FastPay Anti-Fraud & Risk Radar
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time heuristic anomaly detection & live judge simulation
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 🌟 3 Clean 1-Click Attack Scenarios */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Select 1-Click Attack Scenario</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {attackScenarios.map((scenario) => {
                const isSelected = selectedScenarioId === scenario.id;
                return (
                  <button
                    type="button"
                    key={scenario.id}
                    onClick={() => selectScenario(scenario)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{scenario.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                      {scenario.summary}
                    </p>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${scenario.badgeColor}`}>
                      {scenario.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clean Dashboard & Live Attack Execution */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900/70 p-4 sm:p-5 rounded-2xl border border-slate-800">
            
            {/* Left: Key Parameters */}
            <div className="md:col-span-7 space-y-3.5">
              <div className="space-y-1">
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
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Velocity (60s Burst):</span>
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
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Wallet Drain (Outflow):</span>
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
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isExecutingLive}
                onClick={handleExecuteLiveTest}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
              >
                {isExecutingLive ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Evaluating on PostgreSQL Backend...</span>
                  </span>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>▶ Test This Attack Live on Backend</span>
                  </>
                )}
              </button>

              {/* Live Server Response Output */}
              {liveServerResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono space-y-1 animate-in fade-in ${
                    liveServerResult.status === 'BLOCKED'
                      ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                      : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
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
                      {liveServerResult.durationMs}ms
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-200">
                    {liveServerResult.message}
                  </p>
                </div>
              )}
            </div>

            {/* Right: Risk Score & Action */}
            <div className="md:col-span-5 p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Risk Score</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${evalResult.color}`}>
                    {evalResult.level}
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-white font-mono">{evalResult.score}</span>
                  <span className="text-slate-500 text-xs font-mono">/ 100</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      evalResult.score >= 70
                        ? 'bg-rose-500'
                        : evalResult.score >= 45
                        ? 'bg-amber-500'
                        : evalResult.score >= 25
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                    }`}
                    animate={{ width: `${evalResult.score}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>

                {/* Verdict Box */}
                <div className={`p-2.5 rounded-xl border text-[11px] font-semibold ${evalResult.color}`}>
                  <div className="text-[9px] uppercase font-bold text-slate-300 mb-0.5">Engine Verdict:</div>
                  <div>{evalResult.action}</div>
                </div>

                {/* Risk Flags */}
                <div className="space-y-1 pt-1">
                  {evalResult.factors.length === 0 ? (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Zero risk flags detected.</span>
                    </div>
                  ) : (
                    evalResult.factors.map((f, i) => (
                      <div key={i} className="text-[10px] text-slate-300 flex items-start gap-1 leading-tight">
                        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="text-[9px] text-slate-500 font-mono text-center border-t border-slate-800/80 pt-2">
                FastPay Real-Time Multi-Vector Rules
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-1">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
            >
              Close Radar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
