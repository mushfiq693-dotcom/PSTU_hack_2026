import React, { useState } from 'react';
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

  // Other users available as recipients (excluding self)
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
      setErrorMsg(`Insufficient balance. You only have ৳${currentUser.balance_bdt.toFixed(2)} available.`);
      return;
    }

    if (!receiverId && !receiverPhone) {
      setErrorMsg('Please select or specify a recipient.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await ApiService.transferMoney({
        receiver_id: receiverId || undefined,
        receiver_phone: !receiverId ? receiverPhone : undefined,
        amount_bdt: amountNum,
        note: note.trim() || 'Direct Transfer',
        category,
        idempotency_key: idempotencyKey,
      });

      setSuccessReceipt({
        ...response.data,
        isReplayed: response.replayed,
        timestamp: new Date().toLocaleTimeString(),
      });

      // Refresh balance in background
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
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-emerald-400" />
            Send Money Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Atomic P2P transfer with row-level locking & duplicate request suppression
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 font-medium">Available Balance</div>
          <div className="text-sm font-bold font-mono text-emerald-400">
            ৳{currentUser?.balance_bdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Success Receipt Modal / Card */}
      {successReceipt ? (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/40 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-950/50">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Transfer Succeeded!</h3>
            <p className="text-xs text-emerald-400 mt-0.5">
              {successReceipt.isReplayed
                ? '⚡ Cached Idempotent Response Replayed (No duplicate debit)'
                : 'Atomic Transaction Committed with Row-Level Lock'}
            </p>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400 font-sans">Amount Transferred:</span>
              <span className="text-emerald-400 font-bold text-base">
                ৳{successReceipt.transaction?.amount ? (successReceipt.transaction.amount / 100).toFixed(2) : amountBdt} BDT
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">Transaction Reference:</span>
              <div className="flex items-center gap-1 text-slate-200">
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
              <span className="text-slate-400 font-sans">Updated Sender Balance:</span>
              <span className="text-slate-200 font-bold">
                ৳{successReceipt.sender_new_balance_bdt?.toFixed(2) || currentUser?.balance_bdt.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">Double-Entry Status:</span>
              <span className="text-emerald-400 flex items-center gap-1 font-sans">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Balanced Ledger
              </span>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleResetForm}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 transition-all"
            >
              Make Another Transfer
            </button>
          </div>
        </div>
      ) : (
        /* Transfer Form */
        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-700/60 shadow-xl space-y-6">
          
          {/* Error Alert */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3 animate-in fade-in duration-150">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Quick Recipient Picker Tray */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Demo Recipient
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {recipientOptions.map((user) => {
                const isSelected = receiverId === user.id;
                return (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => handleSelectRecipient(user)}
                    className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-950/40 text-white ring-1 ring-emerald-500/50'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{user.name.split(' ')[0]}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">{user.phone}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Amount Input & Quick Presets */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Amount (BDT)
              </label>
              <button
                type="button"
                onClick={() => setAmountBdt(currentUser ? currentUser.balance_bdt.toString() : '0')}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Max Balance (৳{currentUser?.balance_bdt.toLocaleString()})
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 text-lg font-mono">
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
                className="w-full pl-9 pr-4 py-3.5 rounded-2xl bg-slate-950/80 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white font-mono text-xl font-bold placeholder-slate-600 transition-all outline-none"
              />
            </div>

            {/* Quick Amount Presets */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {presetAmounts.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmountBdt(amt.toString())}
                  className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium font-mono transition-all"
                >
                  +৳{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Category & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-200 text-xs font-medium focus:border-emerald-500 outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Note / Remark
              </label>
              <input
                type="text"
                placeholder="e.g. Dinner bill, Project share"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-200 text-xs placeholder-slate-600 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* 4. Idempotency Key Section */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Idempotency-Key:</span>
              <span className="text-slate-300 truncate max-w-[200px]">{idempotencyKey}</span>
            </div>
            <button
              type="button"
              onClick={handleRegenerateKey}
              title="Generate new idempotency key"
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400 flex items-center gap-1 text-[11px] font-sans font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>New Key</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !amountBdt || (!receiverId && !receiverPhone)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Executing Atomic Transfer...</span>
              </div>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Authorize & Send ৳{amountBdt ? parseFloat(amountBdt).toFixed(2) : '0.00'}</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
