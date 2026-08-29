import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { BillSplit, BillCategory, Connection } from '../../types';
import {
  Receipt,
  Utensils,
  Plane,
  Compass,
  Users,
  Plus,
  Check,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Filter
} from 'lucide-react';

const CATEGORIES: Array<{ id: BillCategory; label: string; icon: React.FC<any>; color: string; desc: string }> = [
  { id: 'RESTAURANT', label: 'Restaurant & Dining', icon: Utensils, color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400', desc: 'Meals, coffee, team lunches & buffet' },
  { id: 'TRAVEL', label: 'Travel & Transport', icon: Plane, color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400', desc: 'Bus, microbus rent, CNG, Uber, train' },
  { id: 'TOUR', label: 'Tour & Hangout', icon: Compass, color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400', desc: 'Resorts, beach trips, campus outings' },
  { id: 'TEAM_REGISTRATION', label: 'Team Registration', icon: Users, color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-400', desc: 'Hackathon team entry, contest fees, badges' },
];

export const BillSplitView: React.FC = () => {
  const { currentUser, allUsers, refreshWallet } = useAuth();
  const [splits, setSplits] = useState<BillSplit[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<BillCategory | 'ALL'>('ALL');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formCategory, setFormCategory] = useState<BillCategory>('RESTAURANT');
  const [formTitle, setFormTitle] = useState('');
  const [formTotalAmount, setFormTotalAmount] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const fetchSplitsAndConnections = async () => {
    try {
      setIsLoading(true);
      const [splitsData, connData] = await Promise.all([
        ApiService.getSplits(selectedFilterCategory === 'ALL' ? undefined : selectedFilterCategory),
        ApiService.getConnections()
      ]);
      setSplits(splitsData);
      setConnections(connData);
    } catch (err) {
      console.error('Failed to load bill splits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSplitsAndConnections();
  }, [currentUser, selectedFilterCategory]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateSplit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formTotalAmount);

    if (!formTitle.trim()) {
      alert('Please enter a bill title.');
      return;
    }
    if (!amountNum || amountNum <= 0) {
      alert('Please enter a valid total amount.');
      return;
    }
    if (selectedUserIds.length === 0) {
      alert('Please select at least 1 friend/family member to split with.');
      return;
    }

    try {
      setIsSubmitting(true);
      // Total people = Creator + selected friends
      const totalPeople = selectedUserIds.length + 1;
      const shareAmountBdt = Math.round((amountNum / totalPeople) * 100) / 100;

      const participants = selectedUserIds.map((uid) => ({
        user_id: uid,
        share_amount_bdt: shareAmountBdt
      }));

      await ApiService.createSplit({
        title: formTitle.trim(),
        total_amount_bdt: amountNum,
        category: formCategory,
        participants
      });

      showToast('Bill split created! In-app notifications sent to participants.');
      setIsCreating(false);
      setFormTitle('');
      setFormTotalAmount('');
      setSelectedUserIds([]);
      fetchSplitsAndConnections();
    } catch (err: any) {
      alert(err.message || 'Failed to create bill split.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayMyShare = async (splitId: string) => {
    try {
      setIsSubmitting(true);
      const res = await ApiService.paySplitShare(splitId);
      showToast('Successfully paid your share through atomic double-entry transfer!');
      await refreshWallet();
      fetchSplitsAndConnections();
    } catch (err: any) {
      alert(err.message || 'Failed to pay share');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-6 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>Universal Bill Splitting</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Single Core Engine
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Split Dining, Travel, Tours, or Registration fees with real-time settlement tracking.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-teal-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Cancel Split' : 'Split a New Bill'}</span>
        </button>
      </div>

      {/* Create Bill Split Modal / Section */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-900/95 border border-teal-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden"
          >
            <form onSubmit={handleCreateSplit} className="max-w-2xl mx-auto space-y-6">
              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-100">Step 1: Choose Expense Category</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Category serves as metadata for icons, labels, and structured audit logs.
                </p>
              </div>

              {/* 4 Category Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = formCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormCategory(cat.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? `bg-gradient-to-b ${cat.color} ring-2 ring-teal-500 shadow-lg`
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-teal-300' : 'text-slate-500'}`} />
                      <div>
                        <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {cat.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Step 2: Bill Title & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Bill Title / Purpose
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PSTU Cafeteria Dinner, Microbus fare"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Total Amount (BDT ৳)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="e.g. 3500"
                    value={formTotalAmount}
                    onChange={(e) => setFormTotalAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Step 3: Select Participants from Connections / Users */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Step 3: Select Friends to Split With ({selectedUserIds.length} chosen)
                  </label>
                  {formTotalAmount && selectedUserIds.length > 0 && (
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      ৳{(parseFloat(formTotalAmount) / (selectedUserIds.length + 1)).toFixed(2)} per person
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {allUsers
                    .filter((u) => u.id !== currentUser?.id)
                    .map((user) => {
                      const isSelected = selectedUserIds.includes(user.id);
                      return (
                        <div
                          key={user.id}
                          onClick={() => handleToggleUser(user.id)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                            isSelected
                              ? 'bg-teal-500/20 border-teal-500/50 text-white shadow-sm'
                              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-400'
                          }`}
                        >
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-bold truncate">{user.name}</div>
                            <div className="text-[9px] text-slate-500 font-mono">{user.phone}</div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-teal-950/50"
                >
                  <span>Create & Request Shares</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4 overflow-x-auto">
        <button
          onClick={() => setSelectedFilterCategory('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedFilterCategory === 'ALL'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Bills
        </button>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedFilterCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedFilterCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-teal-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Split Bills List */}
      {splits.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
          <Receipt className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-400">No bill splits in this category.</p>
          <p className="text-xs text-slate-500 mt-1">
            Click "Split a New Bill" to create a shared expense.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {splits.map((split) => {
            const isCreator = split.creator_id === currentUser?.id;
            const myItem = split.participants.find((p) => p.user_id === currentUser?.id);
            const paidCount = split.participants.filter((p) => p.is_paid).length;
            const totalParticipants = split.participants.length;
            const percentPaid = Math.round((paidCount / totalParticipants) * 100);
            const totalBdt = (Number(split.total_amount) / 100).toLocaleString();

            const catInfo = CATEGORIES.find((c) => c.id === split.category) || CATEGORIES[0];
            const CatIcon = catInfo.icon;

            return (
              <motion.div
                key={split.id}
                whileHover={{ y: -2 }}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${catInfo.color}`}>
                        <CatIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{split.title}</h4>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>Created by {isCreator ? 'You' : split.creator_name}</span>
                          <span>•</span>
                          <span className="font-mono">{new Date(split.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold font-mono text-emerald-400">৳{totalBdt}</div>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          split.status === 'SETTLED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {split.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4 bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
                      <span>Settlement Progress</span>
                      <span>
                        {paidCount} of {totalParticipants} Settled ({percentPaid}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentPaid}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Participant Share List */}
                  <div className="space-y-1.5 mb-4">
                    {split.participants.map((p) => {
                      const shareBdt = (Number(p.share_amount) / 100).toLocaleString();
                      const isMe = p.user_id === currentUser?.id;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={p.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={p.user_name}
                              className="w-6 h-6 rounded-lg object-cover ring-1 ring-slate-800"
                            />
                            <span className="font-medium text-slate-200">
                              {p.user_name} {isMe && '(You)'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-300">৳{shareBdt}</span>
                            {p.is_paid ? (
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                <Check className="w-3 h-3" /> Paid
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3" /> Unpaid
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Action: If current user owes money and has not paid yet */}
                {myItem && !myItem.is_paid && (
                  <div className="pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handlePayMyShare(split.id)}
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition-all"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Pay My Share (৳{(Number(myItem.share_amount) / 100).toLocaleString()})</span>
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
