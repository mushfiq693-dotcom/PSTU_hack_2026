import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { TabType } from './types';
import { Navbar } from './components/layout/Navbar';
import { LandingPage } from './components/landing/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { SendMoneyView } from './components/transfer/SendMoneyView';
import { MoneyRequestsView } from './components/requests/MoneyRequestsView';
import { LedgerAuditView } from './components/ledger/LedgerAuditView';
import { ConcurrencyStudio } from './components/stress/ConcurrencyStudio';
import { FastPayLogo } from './components/common/FastPayLogo';
import { ShieldCheck } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('landing');

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 font-sans">
      
      {/* Top Navbar with Persona Switcher */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Animated Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {activeTab === 'landing' && <LandingPage setActiveTab={setActiveTab} />}
            {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
            {activeTab === 'send' && <SendMoneyView />}
            {activeTab === 'requests' && <MoneyRequestsView />}
            {activeTab === 'ledger' && <LedgerAuditView />}
            {activeTab === 'stress' && <ConcurrencyStudio />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <FastPayLogo size="sm" showText={false} />
            <span className="font-bold text-slate-200">FastPay Engine</span>
            <span>•</span>
            <span>PSTU National Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>PostgreSQL Row-Locking Concurrency Safety</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
