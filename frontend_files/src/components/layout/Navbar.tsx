import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { TabType } from '../../types';
import { FastPayLogo } from '../common/FastPayLogo';
import {
  Layers,
  ArrowRightLeft,
  UserCheck,
  FileSpreadsheet,
  Cpu,
  ChevronDown,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, allUsers, switchUser, resetDemoData, isLoading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'landing' as TabType, label: 'Home', icon: Sparkles },
    { id: 'dashboard' as TabType, label: 'Overview', icon: Layers },
    { id: 'send' as TabType, label: 'Send Money', icon: ArrowRightLeft },
    { id: 'requests' as TabType, label: 'Requests', icon: UserCheck },
    { id: 'ledger' as TabType, label: 'Audit Ledger', icon: FileSpreadsheet },
    { id: 'stress' as TabType, label: 'Concurrency Lab', icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/85 backdrop-blur-2xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('landing')} 
          className="cursor-pointer flex items-center"
        >
          <FastPayLogo size="md" />
        </div>

        {/* Central Clean Nav Tabs with Framer Motion Pill */}
        <nav className="hidden md:flex items-center bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 z-10 ${
                  isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl -z-10 shadow-md shadow-emerald-950/50"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Persona Switcher */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 p-1.5 pl-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 shadow-md transition-all group"
            >
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                  {currentUser?.name || 'Loading...'}
                </div>
                <div className="text-[11px] font-mono text-emerald-400 font-semibold">
                  ৳{currentUser ? currentUser.balance_bdt.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                </div>
              </div>
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser?.name}
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-emerald-500/40 shadow-sm"
              />
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            {/* Persona Switcher Dropdown Menu */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Switch Demo Persona
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Instantly test as another user
                    </p>
                  </div>
                  <div className="space-y-1">
                    {allUsers.map((user) => {
                      const isSelected = user.id === currentUser?.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            switchUser(user.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${
                            isSelected
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-white shadow-sm'
                              : 'hover:bg-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 text-left">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
                            />
                            <div>
                              <div className="text-xs font-semibold flex items-center gap-1">
                                <span>{user.name}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 inline" />}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">{user.phone}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold font-mono text-emerald-400">
                              ৳{user.balance_bdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Clean bottom option to reset balances */}
                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        if (window.confirm('Reset all demo balances to ৳100,000?')) {
                          resetDemoData();
                          setDropdownOpen(false);
                        }
                      }}
                      className="w-full py-1.5 px-2 rounded-lg text-[11px] text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 transition-colors flex items-center justify-center gap-1.5 font-medium"
                    >
                      <RotateCcw className={`w-3 h-3 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
                      <span>Reset all balances to ৳100k</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="flex md:hidden border-t border-slate-800 bg-slate-950/95 px-2 py-1.5 justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-semibold transition-all ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
