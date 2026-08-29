import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { Connection, RelationType, UserWithWallet, TabType } from '../../types';
import {
  Users2,
  Heart,
  UserPlus,
  Search,
  Check,
  X,
  ArrowRightLeft,
  DollarSign,
  Receipt,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface ConnectionsViewProps {
  setActiveTab?: (tab: TabType) => void;
}

export const ConnectionsView: React.FC<ConnectionsViewProps> = ({ setActiveTab }) => {
  const { currentUser, allUsers } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeSegment, setActiveSegment] = useState<'ALL' | 'FRIEND' | 'FAMILY'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRelation, setSelectedRelation] = useState<RelationType>('FRIEND');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchConnections = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getConnections();
      setConnections(data);
    } catch (err) {
      console.error('Failed to fetch connections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddConnection = async (targetUserId: string) => {
    try {
      setIsSubmitting(true);
      await ApiService.sendConnectionRequest(targetUserId, selectedRelation);
      showToast(`Added to your ${selectedRelation.toLowerCase()} list!`);
      setIsAdding(false);
      fetchConnections();
    } catch (err: any) {
      alert(err.message || 'Failed to add connection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await ApiService.acceptConnection(id);
      showToast('Connection accepted!');
      fetchConnections();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await ApiService.declineConnection(id);
      showToast('Connection declined.');
      fetchConnections();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredConnections = connections.filter((c) => {
    if (activeSegment === 'ALL') return true;
    return c.relation_type === activeSegment;
  });

  const friendsList = connections.filter((c) => c.relation_type === 'FRIEND' && c.status === 'ACCEPTED');
  const familyList = connections.filter((c) => c.relation_type === 'FAMILY' && c.status === 'ACCEPTED');
  const pendingRequests = connections.filter((c) => c.status === 'PENDING' && c.direction === 'INCOMING');

  // Candidate users to add (exclude self and already connected)
  const connectedUserIds = new Set(
    connections.map((c) => (c.user_id === currentUser?.id ? c.connected_user_id : c.user_id))
  );

  const candidateUsers = allUsers.filter(
    (u) =>
      u.id !== currentUser?.id &&
      !connectedUserIds.has(u.id) &&
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.phone.includes(searchQuery))
  );

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Users2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>Friends & Family Network</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {connections.length} Connected
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Organize your trusted financial circle for 1-tap transfers, borrowing, and bill splitting.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isAdding ? 'Close Search' : 'Add Connection'}</span>
        </button>
      </div>

      {/* Add Connection Drawer / Panel */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 shadow-xl overflow-hidden"
          >
            <div className="max-w-xl mx-auto space-y-4">
              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-200">Connect with a User</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pick relation type and select a demo persona
                </p>
              </div>

              {/* Relation Toggle */}
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRelation('FRIEND')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    selectedRelation === 'FRIEND'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-950/40'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users2 className="w-3.5 h-3.5" />
                  <span>Friend</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRelation('FAMILY')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    selectedRelation === 'FAMILY'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Family</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by name or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Candidate Users List */}
              <div className="max-h-48 overflow-y-auto space-y-2">
                {candidateUsers.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-4">
                    No new users available to connect.
                  </p>
                ) : (
                  candidateUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{user.name}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">{user.phone}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddConnection(user.id)}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-all"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Add as {selectedRelation}</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incoming Pending Requests (if any) */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>Pending Connection Requests</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
              {pendingRequests.length}
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-amber-500/20"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={req.connected_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={req.connected_name}
                    className="w-9 h-9 rounded-xl object-cover ring-1 ring-amber-500/30"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">{req.connected_name}</h5>
                    <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                      {req.relation_type} Request
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAccept(req.id)}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                    title="Accept"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDecline(req.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white text-xs font-bold transition-colors"
                    title="Decline"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Segment Selector: ALL vs FRIENDS vs FAMILY */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveSegment('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSegment === 'ALL'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({connections.length})
        </button>
        <button
          onClick={() => setActiveSegment('FRIEND')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSegment === 'FRIEND'
              ? 'bg-teal-900/60 text-teal-300 border border-teal-700/50 shadow-sm'
              : 'text-slate-400 hover:text-teal-300'
          }`}
        >
          <Users2 className="w-3.5 h-3.5" />
          <span>Friends ({friendsList.length})</span>
        </button>
        <button
          onClick={() => setActiveSegment('FAMILY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSegment === 'FAMILY'
              ? 'bg-rose-900/60 text-rose-300 border border-rose-700/50 shadow-sm'
              : 'text-slate-400 hover:text-rose-300'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Family ({familyList.length})</span>
        </button>
      </div>

      {/* Connections Grid */}
      {filteredConnections.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
          <Users2 className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-400">No connections in this category yet.</p>
          <p className="text-xs text-slate-500 mt-1">Click "Add Connection" to link with your team personas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConnections.map((conn) => {
            const isFamily = conn.relation_type === 'FAMILY';
            return (
              <motion.div
                key={conn.id}
                whileHover={{ y: -3 }}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={conn.connected_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={conn.connected_name}
                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-800"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{conn.connected_name}</h4>
                        <span className="text-xs text-slate-400 font-mono">{conn.connected_phone}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        isFamily
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                      }`}
                    >
                      {conn.relation_type}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-4">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Instant Money Movement Enabled</span>
                  </div>
                </div>

                {/* Quick 1-Tap Actions */}
                <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => setActiveTab?.('send')}
                    className="p-2 rounded-xl bg-slate-800/70 hover:bg-emerald-600 hover:text-white text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all"
                    title="Send Money"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Send</span>
                  </button>

                  <button
                    onClick={() => setActiveTab?.('requests')}
                    className="p-2 rounded-xl bg-slate-800/70 hover:bg-teal-600 hover:text-white text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all"
                    title="Request Money"
                  >
                    <DollarSign className="w-3 h-3" />
                    <span>Request</span>
                  </button>

                  <button
                    onClick={() => setActiveTab?.('splits')}
                    className="p-2 rounded-xl bg-slate-800/70 hover:bg-indigo-600 hover:text-white text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all"
                    title="Split Bill"
                  >
                    <Receipt className="w-3 h-3" />
                    <span>Split</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
