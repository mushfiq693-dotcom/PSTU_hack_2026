import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { MoneyRequest } from '../../types';
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
  ShieldCheck
} from 'lucide-react';

export const MoneyRequestsView: React.FC = () => {
  const { currentUser, allUsers, refreshUserData } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [requests, setRequests] = useState<MoneyRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Request Form State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [payerId, setPayerId] = useState<string>('');
  const [amountBdt, setAmountBdt] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ApiService.getMoneyRequests(activeSubTab);
      setRequests(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch money requests');
    } finally {
      setIsLoading(false);
    }
  }, [activeSubTab]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (requestId: string) => {
    setActionLoadingId(requestId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await ApiService.acceptMoneyRequest(requestId);
      setSuccessMsg('Money request accepted & settled via TransferService.');
      await fetchRequests();
      await refreshUserData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to accept request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoadingId(requestId);
    setErrorMsg(null);

    try {
      await ApiService.rejectMoneyRequest(requestId);
      setSuccessMsg('Money request declined.');
      await fetchRequests();
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
      setSuccessMsg('Money request cancelled.');
      await fetchRequests();
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
        note: note.trim() || 'Payment Request',
      });

      setShowCreateModal(false);
      setPayerId('');
      setAmountBdt('');
      setNote('');
      setSuccessMsg('Money request sent successfully.');
      setActiveSubTab('outgoing');
      await fetchRequests();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-teal-400" />
            Money Requests Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Peer-to-peer invoice requests with atomic settlement through TransferService
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>New Money Request</span>
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Sub-tab switcher */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveSubTab('incoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'incoming'
              ? 'bg-slate-800 text-emerald-400 shadow-md border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Incoming Requests</span>
        </button>

        <button
          onClick={() => setActiveSubTab('outgoing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'outgoing'
              ? 'bg-slate-800 text-teal-400 shadow-md border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Outgoing Sent Requests</span>
        </button>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-500 text-xs flex flex-col items-center gap-3">
          <span className="w-6 h-6 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <span>Loading money requests...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-3xl border border-slate-800 text-slate-400 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-300">No {activeSubTab} requests found</h4>
          <p className="text-xs text-slate-500">
            {activeSubTab === 'incoming'
              ? 'You do not have any pending incoming payment requests.'
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

            const isPending = req.status === 'PENDING';
            const isAccepted = req.status === 'ACCEPTED';
            const isRejected = req.status === 'REJECTED';
            const isCancelled = req.status === 'CANCELLED';

            return (
              <div
                key={req.id}
                className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700/80 transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={otherPartyAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={otherPartyName}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        {isIncoming ? `From ${otherPartyName}` : `Sent to ${otherPartyName}`}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{otherPartyPhone}</div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                    {isAccepted && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Settled
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Declined
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                        Cancelled
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount & Note */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-baseline justify-between">
                  <div className="text-xs text-slate-400 italic truncate max-w-[200px]">
                    "{req.note || 'No note attached'}"
                  </div>
                  <div className="text-base font-bold font-mono text-white">
                    ৳{amountBdtFormatted}
                  </div>
                </div>

                {/* Actions */}
                {isPending && (
                  <div className="flex gap-2 pt-1">
                    {isIncoming ? (
                      <>
                        <button
                          onClick={() => handleAccept(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {actionLoadingId === req.id ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Pay Now ৳{amountBdtFormatted}</span>
                        </button>

                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleCancel(req.id)}
                        disabled={actionLoadingId === req.id}
                        className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-700 max-w-md w-full shadow-2xl relative">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Request Money Invoice
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              {/* Select Payer */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Select Payer
                </label>
                <select
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                  required
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium focus:border-emerald-500 outline-none"
                >
                  <option value="">-- Choose Demo User to Request From --</option>
                  {availablePayers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Amount (BDT)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-mono">
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
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-base font-bold focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Reason / Memo
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hackathon travel share"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-emerald-500 outline-none"
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
                <button
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
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
