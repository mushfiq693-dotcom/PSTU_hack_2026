import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { MoneyRequest, Connection } from '../../types';
import {
  UserCheck,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertCircle,
  Sparkles,
  Calendar,
  AlertTriangle,
  Users2
} from 'lucide-react';

export const MoneyRequestsView: React.FC = () => {
  const { currentUser, allUsers, refreshWallet } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [requests, setRequests] = useState<MoneyRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Request Form State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [payerId, setPayerId] = useState<string>('');
  const [amountBdt, setAmountBdt] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const fetchRequestsAndConnections = useCallback(async () => {
    setIsLoading(true);
    try {
      const [requestsData, connectionsData] = await Promise.all([
        ApiService.getMoneyRequests(activeSubTab),
        ApiService.getConnections()
      ]);
      setRequests(requestsData);
      setConnections(connectionsData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch requests');
    } finally {
      setIsLoading(false);
    }
  }, [activeSubTab]);

  useEffect(() => {
    fetchRequestsAndConnections();
  }, [fetchRequestsAndConnections]);

  const handleAccept = async (requestId: string) => {
    setActionLoadingId(requestId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await ApiService.acceptMoneyRequest(requestId);
      setSuccessMsg('Request accepted & settled via atomic Transfer Engine.');
      await fetchRequestsAndConnections();
      await refreshWallet();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to settle request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoadingId(requestId);
    setErrorMsg(null);

    try {
      await ApiService.rejectMoneyRequest(requestId);
      setSuccessMsg('Request declined.');
      await fetchRequestsAndConnections();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to decline request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (requestId: string) => {
    setActionLoadingId(requestId);
    setErrorMsg(null);

    try {
      await ApiService.cancelMoneyRequest(requestId);
      setSuccessMsg('Request cancelled.');
      await fetchRequestsAndConnections();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const amountNum = parseFloat(amountBdt);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Please enter a valid request amount.');
      return;
    }

    if (!payerId) {
      setErrorMsg('Please select a payer.');
      return;
    }

    setIsCreating(true);

    try {
      await ApiService.createMoneyRequest({
        payer_id: payerId,
        amount_bdt: amountNum,
        note: note.trim() || 'FastPay Request',
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined
      });

      setShowCreateModal(false);
      setPayerId('');
      setAmountBdt('');
      setNote('');
      setDueDate('');
      setSuccessMsg('Money request sent with borrow time limit & notifications!');
      setActiveSubTab('outgoing');
      await fetchRequestsAndConnections();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create request');
    } finally {
      setIsCreating(false);
    }
  };

  const availablePayers = allUsers.filter((u) => u.id !== currentUser?.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>Money Requests & Borrow Limits</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                P2P Invoicing
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Request funds, set repayment deadlines, and track overdue debt reminders.
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Request</span>
        </motion.button>
      </div>

      {/* Alert Messages */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-3"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveSubTab('incoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'incoming'
              ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Incoming to Pay</span>
        </button>

        <button
          onClick={() => setActiveSubTab('outgoing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'outgoing'
              ? 'bg-slate-800 text-teal-400 shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Outgoing Sent</span>
        </button>
      </div>

      {/* Request Cards Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-500 text-xs flex flex-col items-center gap-3">
          <span className="w-6 h-6 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <span>Loading requests...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400 space-y-2">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300">No {activeSubTab} requests found</h4>
          <p className="text-xs text-slate-500">
            {activeSubTab === 'incoming'
              ? 'You do not have any pending incoming requests.'
              : 'You have not sent any money requests yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => {
            const isIncoming = req.payer_id === currentUser?.id;
            const amountBdtFormatted = (req.amount / 100).toFixed(2);
            const otherPartyName = isIncoming ? req.requester_name : req.payer_name;
            const otherPartyPhone = isIncoming ? req.requester_phone : req.payer_phone;
            const otherPartyAvatar = isIncoming ? req.requester_avatar : req.payer_avatar;

            const effectiveStatus = req.computed_status || req.status;
            const isOverdue = effectiveStatus === 'OVERDUE';
            const isDueSoon = effectiveStatus === 'DUE_SOON';
            const isPending = effectiveStatus === 'PENDING';
            const isAccepted = effectiveStatus === 'ACCEPTED';
            const isRejected = effectiveStatus === 'REJECTED';

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-slate-900/80 rounded-3xl p-5 border transition-all space-y-3.5 shadow-lg ${
                  isOverdue
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : isDueSoon
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={otherPartyAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={otherPartyName}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        {isIncoming ? `From ${otherPartyName}` : `Sent to ${otherPartyName}`}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{otherPartyPhone}</div>
                    </div>
                  </div>

                  <div>
                    {isOverdue && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> OVERDUE
                      </span>
                    )}
                    {isDueSoon && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> DUE SOON
                      </span>
                    )}
                    {isPending && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                    {isAccepted && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Settled
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Declined
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="text-xs text-slate-300 font-medium truncate">
                      "{req.note || 'No note'}"
                    </div>
                    {req.due_date && (
                      <div className="text-[10px] flex items-center gap-1 text-slate-500 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Settle by: {new Date(req.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-base font-bold font-mono text-white shrink-0">
                    ৳{amountBdtFormatted}
                  </div>
                </div>

                {(isPending || isOverdue || isDueSoon) && (
                  <div className="flex gap-2 pt-1">
                    {isIncoming ? (
                      <>
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAccept(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {actionLoadingId === req.id ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Pay ৳{amountBdtFormatted}</span>
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
                        >
                          Decline
                        </motion.button>
                      </>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCancel(req.id)}
                        disabled={actionLoadingId === req.id}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                      >
                        Cancel Request
                      </motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Request Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-700 max-w-md w-full shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  New Money Request / Loan
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Select Recipient to Charge
                  </label>
                  <select
                    value={payerId}
                    onChange={(e) => setPayerId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium focus:border-emerald-500 outline-none"
                  >
                    <option value="">-- Choose User / Friend --</option>
                    {availablePayers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Amount (BDT)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-base font-mono">
                      ৳
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="0.00"
                      value={amountBdt}
                      onChange={(e) => setAmountBdt(e.target.value)}
                      required
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-lg font-bold focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Borrow Time Limit / Repayment Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Memo / Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PSTU Hackathon registration reimbursement"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="w-1/2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isCreating}
                    className="w-1/2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5"
                  >
                    {isCreating ? (
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send Request</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
