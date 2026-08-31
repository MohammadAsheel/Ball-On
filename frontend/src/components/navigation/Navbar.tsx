'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GitCompare,
  ArrowLeftRight,
  Calculator,
  Shield,
  Globe,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/players', label: 'Players', icon: Users },
    { href: '/compare', label: 'Compare', icon: GitCompare },
    { href: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
    { href: '/estimator', label: 'Transfer Estimator', icon: Calculator },
    { href: '/clubs', label: 'Clubs & Stadiums', icon: Shield },
    { href: '/live', label: 'Live Data', icon: Globe },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0e17]/90 border-b border-white/10 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/15 bg-[#0b533e] flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="BALLON" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">BALLON</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wide">Football Transfer Intelligence</p>
          </div>
        </Link>

        {/* Route Links */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/5 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Live Indicator */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>FastAPI Engine Live</span>
        </div>
      </div>
    </header>
  );
}
