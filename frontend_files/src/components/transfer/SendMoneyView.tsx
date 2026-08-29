import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import {
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  Sparkles,
  Key,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export const SendMoneyView: React.FC = () => {
  const { currentUser, allUsers, refreshUserData } = useAuth();

  const [receiverId, setReceiverId] = useState<string>('');
  const [receiverPhone, setReceiverPhone] = useState<string>('');
  const [amountBdt, setAmountBdt] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [category, setCategory] = useState<string>('General');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    `IDEM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  const presetAmounts = [500, 1000, 2500, 5000, 10000];
  const categories = ['General', 'Food', 'Events', 'Utility', 'Rent', 'Travel'];

  const recipientOptions = allUsers.filter((u) => u.id !== currentUser?.id);

  const handleSelectRecipient = (user: any) => {
    setReceiverId(user.id);
    setReceiverPhone(user.phone);
    setErrorMsg(null);
  };

  const handleRegenerateKey = () => {
    setIdempotencyKey(`IDEM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const amountNum = parseFloat(amountBdt);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    if (!currentUser) {
      setErrorMsg('No active user profile.');
      return;
    }

    if (amountNum > currentUser.balance_bdt) {
      setErrorMsg(`Insufficient balance. Available: ৳${currentUser.balance_bdt.toFixed(2)}`);
      return;
    }

    if (!receiverId && !receiverPhone) {
      setErrorMsg('Please select a recipient.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await ApiService.transferMoney({
        receiver_id: receiverId || undefined,
        receiver_phone: !receiverId ? receiverPhone : undefined,
        amount_bdt: amountNum,
        note: note.trim() || 'FastPay P2P Transfer',
        category,
        idempotency_key: idempotencyKey,
      });

      setSuccessReceipt({
        ...response.data,
        isReplayed: response.replayed,
        timestamp: new Date().toLocaleTimeString(),
      });

      await refreshUserData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Transfer failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSuccessReceipt(null);
    setAmountBdt('');
    setNote('');
    handleRegenerateKey();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-emerald-400" />
            Send Money
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Instant P2P fund transfer with PostgreSQL row locking
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Available</div>
          <div className="text-sm font-bold font-mono text-emerald-400">
            ৳{currentUser?.balance_bdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Success Receipt Modal */}
      <AnimatePresence mode="wait">
        {successReceipt ? (
          <motion.div
            key="receipt"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/40 shadow-2xl relative overflow-hidden space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-950/50">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Payment Confirmed!</h3>
              <p className="text-xs text-emerald-400 mt-1">
                {successReceipt.isReplayed
                  ? '⚡ Cached Idempotent Response (No duplicate debit)'
                  : 'Atomic Transaction Committed to PostgreSQL'}
              </p>
            </div>

            <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400 font-sans">Amount Sent:</span>
                <span className="text-emerald-400 font-bold text-lg">
                  ৳{successReceipt.transaction?.amount ? (successReceipt.transaction.amount / 100).toFixed(2) : amountBdt} BDT
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-sans">Transaction Reference:</span>
                <div className="flex items-center gap-1.5 text-slate-200">
                  <span>{successReceipt.transaction?.reference_id || 'TXN-CONFIRMED'}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(successReceipt.transaction?.reference_id || '');
                      setCopiedRef(true);
                      setTimeout(() => setCopiedRef(false), 2000);
                    }}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  >
                    {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-sans">Recipient:</span>
                <span className="text-slate-200">{successReceipt.transaction?.receiver_name || receiverPhone}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-sans">Updated Balance:</span>
                <span className="text-slate-200 font-bold">
                  ৳{successReceipt.sender_new_balance_bdt?.toFixed(2) || currentUser?.balance_bdt.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                <span className="text-slate-400 font-sans">Double-Entry Status:</span>
                <span className="text-emerald-400 flex items-center gap-1 font-sans font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Balanced Ledger
                </span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleResetForm}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 transition-all"
            >
              Make Another Transfer
            </motion.button>
          </motion.div>
        ) : (
          /* Transfer Form */
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-5"
          >
            {/* Error Alert */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Recipient Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Choose Recipient
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {recipientOptions.map((user) => {
                  const isSelected = receiverId === user.id;
                  return (
                    <button
                      type="button"
                      key={user.id}
                      onClick={() => handleSelectRecipient(user)}
                      className={`flex items-center gap-2.5 p-2 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/60 text-white ring-1 ring-emerald-500/50 shadow-sm'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{user.name.split(' ')[0]}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">{user.phone}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Amount Input & Quick Presets */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Transfer Amount (BDT)
                </label>
                <button
                  type="button"
                  onClick={() => setAmountBdt(currentUser ? currentUser.balance_bdt.toString() : '0')}
                  className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Use Max (৳{currentUser?.balance_bdt.toLocaleString()})
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 text-xl font-mono">
                  ৳
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={amountBdt}
                  onChange={(e) => setAmountBdt(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white font-mono text-2xl font-bold placeholder-slate-600 transition-all outline-none"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2 mt-2">
                {presetAmounts.map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setAmountBdt(amt.toString())}
                    className="px-3 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium font-mono transition-all"
                  >
                    +৳{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Category & Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-200 text-xs font-medium focus:border-emerald-500 outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Memo / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lunch split, Server bill"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-200 text-xs placeholder-slate-600 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* 4. Idempotency Key Ribbon */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-400 truncate">
                <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] text-slate-500">Idempotency:</span>
                <span className="text-slate-300 text-[11px] truncate">{idempotencyKey}</span>
              </div>
              <button
                type="button"
                onClick={handleRegenerateKey}
                title="Generate new idempotency key"
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400 flex items-center gap-1 text-[11px] font-sans font-medium shrink-0 ml-2"
              >
                <RotateCcw className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>

            {/* Primary Action CTA */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isSubmitting || !amountBdt || (!receiverId && !receiverPhone)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Processing Transfer...</span>
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send ৳{amountBdt ? parseFloat(amountBdt).toFixed(2) : '0.00'} BDT</span>
                </>
              )}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};
