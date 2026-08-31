'use client';

import React from 'react';
import { LayoutDashboard, ArrowLeftRight, UserSearch, Shield, Globe, Sparkles } from 'lucide-react';

export type TabType = 'overview' | 'transfers' | 'players' | 'clubs' | 'live' | 'estimator';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const navItems = [
    { id: 'overview' as TabType, label: 'Overview', icon: LayoutDashboard },
    { id: 'transfers' as TabType, label: 'Transfers', icon: ArrowLeftRight },
    { id: 'players' as TabType, label: 'Player Analytics', icon: UserSearch },
    { id: 'clubs' as TabType, label: 'Clubs & Stadiums', icon: Shield },
    { id: 'live' as TabType, label: 'Live APIs', icon: Globe },
    { id: 'estimator' as TabType, label: 'AI Estimator', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0e17]/85 border-b border-white/10 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/15 bg-[#0b533e] flex items-center justify-center shadow-lg shadow-emerald-950/40">
            <img src="/logo.png" alt="BallOn" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">BallOn</h1>
              <span className="badge badge-blue text-[10px] py-0.5 px-2">v1.1</span>
            </div>
            <p className="text-xs text-slate-400">Football Transfer Intelligence Platform</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-white/5 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Live Indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>FastAPI Connected</span>
        </div>
      </div>
    </header>
  );
}
