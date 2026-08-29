import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { PRESET_AVATARS } from './AuthModal';
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  Wallet,
  Copy,
  Check,
  Edit3,
  Camera,
  LogOut,
  X,
  Sparkles,
  Users2,
  Save,
  RotateCcw
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onLogout,
}) => {
  const {
    currentUser,
    allUsers,
    switchUser,
    refreshUserData,
    resetDemoData,
    logout,
    isLoading: isAuthLoading,
  } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || PRESET_AVATARS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state whenever currentUser changes or modal opens
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email || '');
      setAvatar(currentUser.avatar || PRESET_AVATARS[0]);
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleCopyWallet = () => {
    if (currentUser.wallet_id) {
      navigator.clipboard.writeText(currentUser.wallet_id);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedbackMsg(null);

    try {
      const chosenAvatar = (customAvatarUrl.trim() || avatar).trim();
      await ApiService.updateProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        avatar: chosenAvatar,
      });

      await refreshUserData();
      setIsEditing(false);
      setShowAvatarPicker(false);
      setFeedbackMsg({ type: 'success', text: 'প্রোফাইল সফলভাবে আপডেট হয়েছে! (Profile Updated)' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    logout();
    onClose();
    if (onLogout) onLogout();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header Gradient */}
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-emerald-950/40 via-slate-900/60 to-slate-900 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>My Profile</span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    FastPay Verified
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Personal Account & Security Settings</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback message */}
          {feedbackMsg && (
            <div
              className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
            
            {/* Avatar & Main Card */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group">
                <img
                  src={avatar || currentUser.avatar}
                  alt={currentUser.name}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-emerald-500/30 shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PRESET_AVATARS[0];
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  title="Change Profile Picture"
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-transform active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h4 className="text-base font-bold text-white">{currentUser.name}</h4>
                  <span title="Phone Verified">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">{currentUser.phone}</p>
                {currentUser.email && (
                  <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>{currentUser.email}</span>
                  </p>
                )}
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-500">Live Balance</div>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  ৳{currentUser.balance_bdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Avatar Picker Accordion */}
            <AnimatePresence>
              {showAvatarPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-950/90 p-4 rounded-2xl border border-emerald-500/30 space-y-3 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Select Avatar or Enter Image URL</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker(false)}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {PRESET_AVATARS.map((avUrl, index) => {
                      const isSelected = avatar === avUrl && !customAvatarUrl;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setAvatar(avUrl);
                            setCustomAvatarUrl('');
                          }}
                          className={`relative rounded-xl overflow-hidden transition-all ${
                            isSelected
                              ? 'ring-2 ring-emerald-400 scale-105 shadow-md'
                              : 'opacity-60 hover:opacity-100 hover:scale-105'
                          }`}
                        >
                          <img src={avUrl} alt={`Avatar ${index + 1}`} className="w-10 h-10 object-cover" />
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <input
                      type="url"
                      placeholder="Or paste custom image link (https://...)"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:border-emerald-500/70 outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Profile Information & Edit Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Account Details
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500 outline-none"
                    />
                  ) : (
                    <div className="text-xs font-semibold text-white">{currentUser.name}</div>
                  )}
                </div>

                {/* Phone */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Mobile Number
                  </label>
                  <div className="text-xs font-mono font-semibold text-white flex items-center gap-1.5">
                    <span>{currentUser.phone}</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      Verified
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500 outline-none"
                    />
                  ) : (
                    <div className="text-xs text-slate-300">
                      {currentUser.email || <span className="text-slate-500 italic">Not set</span>}
                    </div>
                  )}
                </div>

                {/* Wallet ID */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Wallet Identifier
                  </label>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span>{currentUser.wallet_id || 'N/A'}</span>
                    <button
                      type="button"
                      onClick={handleCopyWallet}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Copy Wallet ID"
                    >
                      {copiedWallet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Save Button (when editing) */}
              {(isEditing || showAvatarPicker) && (
                <motion.button
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <span className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes (সংরক্ষণ করুন)</span>
                    </>
                  )}
                </motion.button>
              )}
            </form>

            {/* Quick Demo Persona Switcher */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Switch Demo Persona</span>
                </span>
                <span className="text-[10px] text-slate-500">Instant multi-user testing</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {allUsers.slice(0, 4).map((user) => {
                  const isSelected = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => switchUser(user.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl transition-all text-left ${
                        isSelected
                          ? 'bg-emerald-500/15 border border-emerald-500/40 text-white'
                          : 'bg-slate-950/60 border border-slate-800 text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-lg object-cover" />
                      <div className="truncate">
                        <div className="text-[11px] font-semibold truncate">{user.name}</div>
                        <div className="text-[10px] font-mono text-emerald-400">৳{user.balance_bdt.toLocaleString()}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer with Sign Out Button */}
          <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all demo balances to ৳100,000?')) {
                  resetDemoData();
                  onClose();
                }
              }}
              className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1.5 font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Balances (৳100k)</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-bold text-xs transition-all flex items-center gap-2 shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out (লগ আউট)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
