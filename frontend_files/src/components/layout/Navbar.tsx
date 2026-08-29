import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TabType } from '../../types';
import {
  Zap,
  ArrowRightLeft,
  FileSpreadsheet,
  Cpu,
  Layers,
  RotateCcw,
  ChevronDown,
  ShieldCheck,
  UserCheck
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
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: Layers },
    { id: 'send' as TabType, label: 'Send Money', icon: ArrowRightLeft },
    { id: 'requests' as TabType, label: 'Money Requests', icon: UserCheck },
    { id: 'ledger' as TabType, label: 'Audit Ledger', icon: FileSpreadsheet },
    { id: 'stress' as TabType, label: 'Concurrency Lab', icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 p-[2px] shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-sans">
                  Nexus<span className="text-emerald-400">Pay</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  PostgreSQL ACID
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                PSTU National Hackathon 2026 Engine
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 ml-4 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Persona Switcher & Reset */}
        <div className="flex items-center gap-3">
          
          {/* Quick Reset Demo Button */}
          <button
            onClick={() => {
              if (window.confirm('Reset all demo account balances to ৳100,000 baseline?')) {
                resetDemoData();
              }
            }}
            title="Reset demo data to ৳100k per user"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 transition-all flex items-center gap-1.5 text-xs font-medium"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden lg:inline">Reset ৳100k</span>
          </button>

          {/* Active Persona Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 p-1.5 pl-3 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-700/80 transition-all group"
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
                className="w-9 h-9 rounded-lg object-cover ring-2 ring-emerald-500/40"
              />
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Persona Switcher Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Switch Demo Persona
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Click to instantly simulate another user
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
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-white'
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
                            <div className="text-xs font-semibold">{user.name}</div>
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="flex md:hidden border-t border-slate-800 bg-slate-950/90 px-2 py-1.5 justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-semibold transition-all ${
                isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
