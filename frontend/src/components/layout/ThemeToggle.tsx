'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className={`h-9 w-9 rounded-full border border-white/10 bg-white/5 ${className}`} />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] transition-all hover:border-[var(--primary)] hover:bg-[var(--bg-card-hover)] active:scale-95 ${className}`}
    >
      {isDark ? (
        <Sun size={16} className="text-[#ffd600] transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon size={16} className="text-[#4F46E5] transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
