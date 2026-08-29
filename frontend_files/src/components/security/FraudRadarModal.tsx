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
  Scale
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FraudRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FraudRadarModal: React.FC<FraudRadarModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();

  // Interactive Live Simulation State
  const [simAmount, setSimAmount] = useState<number>(5000);
  const [simVelocity, setSimVelocity] = useState<number>(1);
  const [simDrainPercent, setSimDrainPercent] = useState<number>(10);
  const [isFirstTimeRecipient, setIsFirstTimeRecipient] = useState<boolean>(false);

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0d1322] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100"
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
                  Live heuristic anomaly detection & multi-vector risk evaluation engine
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

          {/* Active Protection Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Velocity Shield</div>
              <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>60s Rolling Window</span>
              </div>
              <p className="text-[11px] text-slate-500">Max 5 tx/min threshold</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Anomaly Ceiling</div>
              <div className="text-base font-bold text-teal-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                <span>৳25k / ৳50k</span>
              </div>
              <p className="text-[11px] text-slate-500">Step-Up 2FA challenge</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Drain Guard</div>
              <div className="text-base font-bold text-indigo-400 flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>&gt;95% Balance Drain</span>
              </div>
              <p className="text-[11px] text-slate-500">Account liquidation shield</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Engine</div>
              <div className="text-base font-bold text-purple-400 flex items-center gap-1.5">
                <Gauge className="w-4 h-4" />
                <span>Live Pre-Commit</span>
              </div>
              <p className="text-[11px] text-slate-500">Zero database race delay</p>
            </div>
          </div>

          {/* Live Simulator & Score Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800">
            
            {/* Left Controls (Simulate parameters) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Live Risk Assessment Simulator (For Judges)</span>
                </h4>
                <button
                  onClick={() => {
                    setSimAmount(5000);
                    setSimVelocity(1);
                    setSimDrainPercent(10);
                    setIsFirstTimeRecipient(false);
                  }}
                  className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Test</span>
                </button>
              </div>

              {/* Slider 1: Amount */}
              <div className="space-y-2">
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
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>৳500 (Normal)</span>
                  <span>৳25,000 (Elevated)</span>
                  <span>৳50,000+ (Critical)</span>
                </div>
              </div>

              {/* Slider 2: Velocity */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Recent Velocity (Transfers in 60s):</span>
                  <span className="font-mono font-bold text-teal-400">{simVelocity} transfers</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  value={simVelocity}
                  onChange={(e) => setSimVelocity(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>1 (Normal)</span>
                  <span>3 (Elevated)</span>
                  <span>5+ (Burst Spike)</span>
                </div>
              </div>

              {/* Slider 3: Drain Percentage */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Wallet Outflow Percentage:</span>
                  <span className="font-mono font-bold text-indigo-400">{simDrainPercent}% of balance</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={simDrainPercent}
                  onChange={(e) => setSimDrainPercent(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Checkbox 4: First Time Recipient */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={isFirstTimeRecipient}
                  onChange={(e) => setIsFirstTimeRecipient(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
                />
                <span className="text-slate-300">Recipient is a newly registered / unverified account (+15 Risk)</span>
              </label>
            </div>

            {/* Right Side: Dynamic Evaluation Output */}
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
                  <div>{evalResult.action}</div>
                </div>

                {/* Triggered Risk Factors */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">Active Risk Factors:</div>
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
                FastPay Heuristic Risk Engine • Integrated with PostgreSQL Ledger
              </div>
            </div>
          </div>

          {/* Footer Close */}
          <div className="flex justify-end pt-2">
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
