import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  Clock,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  UserCheck,
  CheckCircle2,
  XCircle,
  Receipt,
  Sparkles,
  Wallet
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { InAppNotification, TabType } from '../../types';

interface NotificationBellProps {
  setActiveTab: (tab: TabType) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ setActiveTab }) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Polling every 5s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = async (notif: InAppNotification) => {
    if (!notif.is_read) {
      try {
        await ApiService.markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      } catch (err) {
        console.error(err);
      }
    }
    setIsOpen(false);

    if (notif.type === 'MONEY_NEED' || notif.type === 'REQUEST_RECEIVED' || notif.type === 'REQUEST_ACCEPTED' || notif.type === 'REQUEST_REJECTED' || notif.type === 'DEBT_REMINDER') {
      setActiveTab('requests');
    } else if (notif.type === 'TRANSFER_RECEIVED' || notif.type === 'TRANSFER_SENT') {
      setActiveTab('dashboard');
    } else if (notif.type === 'BILL_SPLIT') {
      setActiveTab('splits');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await ApiService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationVisuals = (type: string) => {
    switch (type) {
      case 'TRANSFER_RECEIVED':
        return {
          icon: ArrowDownLeft,
          color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          badge: 'Money In',
        };
      case 'TRANSFER_SENT':
        return {
          icon: ArrowUpRight,
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          badge: 'Money Out',
        };
      case 'MONEY_NEED':
      case 'REQUEST_RECEIVED':
        return {
          icon: UserCheck,
          color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          badge: 'Invoice',
        };
      case 'REQUEST_ACCEPTED':
        return {
          icon: CheckCircle2,
          color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          badge: 'Accepted',
        };
      case 'REQUEST_REJECTED':
        return {
          icon: XCircle,
          color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          badge: 'Declined',
        };
      case 'DEBT_REMINDER':
        return {
          icon: AlertTriangle,
          color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          badge: 'Due Reminder',
        };
      case 'BILL_SPLIT':
        return {
          icon: Receipt,
          color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
          badge: 'Split Bill',
        };
      default:
        return {
          icon: Wallet,
          color: 'bg-slate-800 text-slate-300 border-slate-700',
          badge: 'Notification',
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all shadow-sm"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Notifications & Alerts</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 space-y-1">
                  <div className="text-slate-400 font-semibold">সব ক্লিয়ার! No notifications yet</div>
                  <div>When someone sends money or requests funds, you will see it here.</div>
                </div>
              ) : (
                notifications.map((notif) => {
                  const visuals = getNotificationVisuals(notif.type);
                  const Icon = visuals.icon;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 hover:bg-slate-800/70 cursor-pointer transition-colors flex items-start gap-3 ${
                        !notif.is_read ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${visuals.color}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <h5 className="text-xs font-semibold text-slate-200 truncate">
                              {notif.title}
                            </h5>
                          </div>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(notif.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className={`px-1 rounded font-semibold text-[9px] border ${visuals.color}`}>
                            {visuals.badge}
                          </span>
                        </div>
                      </div>

                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 self-center shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
