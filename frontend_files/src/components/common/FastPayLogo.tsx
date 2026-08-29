import React from 'react';
import { motion } from 'framer-motion';

interface FastPayLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const FastPayLogo: React.FC<FastPayLogoProps> = ({ size = 'md', showText = true }) => {
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Animated Icon Badge */}
      <motion.div
        whileHover={{ scale: 1.08, rotate: 3 }}
        whileTap={{ scale: 0.95 }}
        className={`relative ${iconSize} rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-[2px] shadow-lg shadow-emerald-500/20`}
      >
        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-emerald-500/10" />

          {/* SVG Custom FastPay Lightning & Arrow Glyph */}
          <svg
            className="w-3/5 h-3/5 text-emerald-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#fastPayGrad)" stroke="none" />
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" />
            <defs>
              <linearGradient id="fastPayGrad" x1="3" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#10b981" />
                <stop offset="0.5" stopColor="#14b8a6" />
                <stop offset="1" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </motion.div>

      {/* Brand Wordmark */}
      {showText && (
        <div>
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`${textSize} font-extrabold tracking-tight text-white font-sans`}>
              Fast<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Pay</span>
            </span>
          </div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">
            Engine
          </p>
        </div>
      )}
    </div>
  );
};
