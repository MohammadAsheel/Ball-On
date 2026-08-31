'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Command, Search, X, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

const links = [{ href: '/', label: 'Overview' }, { href: '/estimator', label: 'Valuation Engine' }, { href: '/players', label: 'Players Catalog' }, { href: '/live', label: 'Live League Feeds' }, { href: '/compare', label: 'Comparison Matrix' }];

export function Navbar() {
  const pathname = usePathname(); const router = useRouter();
  const [open, setOpen] = useState(false); const [query, setQuery] = useState(''); const [now, setNow] = useState('');
  useEffect(() => { const tick = () => setNow(new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())); tick(); const timer = window.setInterval(tick, 30000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(true); } if (event.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (query.trim()) { router.push(`/players?search=${encodeURIComponent(query.trim())}`); setOpen(false); setQuery(''); } };
  return <>
    <header className="sticky top-0 z-40 border-b border-[#292929] bg-[#080808]/95 backdrop-blur-sm"><div className="mx-auto flex h-[68px] max-w-[1560px] items-center gap-5 px-4 sm:px-6 lg:px-8">
      <Link href="/" className="flex shrink-0 items-center gap-3 group">
        <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-[#0b533e] shadow-md transition-transform group-hover:scale-105">
          <img src="/logo.png" alt="BALLON" className="h-full w-full object-cover" />
        </div>
        <div className="flex items-center gap-2">
          <span className="display-font text-[22px] tracking-[-.06em] text-[#f0f0f0] group-hover:text-white transition-colors">BALLON</span>
          <span className="mono-font border border-[#f59e0b]/50 px-1.5 py-0.5 text-[9px] tracking-[.18em] text-[#f59e0b]">PRO</span>
        </div>
      </Link>
      <div className="hidden items-center gap-2 border-l border-[#292929] pl-5 lg:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#10b981] shadow-[0_0_9px_#10b981]" /><span className="mono-font text-[10px] tracking-[.14em] text-[#888]">LIVE SESSION / {now || 'SYNCING'}</span></div>
      <nav className="ml-auto hidden h-full items-center xl:flex">{links.map((link) => <Link key={link.href} href={link.href} className={`flex h-full items-center border-b-2 px-3 text-[11px] font-semibold tracking-wide transition-colors ${pathname === link.href ? 'border-[#00f2fe] text-[#f0f0f0]' : 'border-transparent text-[#888] hover:text-[#f0f0f0]'}`}>{link.label}</Link>)}</nav>
      <button onClick={() => setOpen(true)} className="ml-auto flex items-center gap-3 border border-[#333] bg-[#111] px-3 py-2 text-xs text-[#888] transition hover:border-[#555] hover:text-white xl:ml-4" aria-label="Open command palette"><Search size={14} /><span className="hidden sm:inline">Search intelligence</span><kbd className="mono-font border border-[#3b3b3b] px-1 text-[9px] text-[#aaa]">⌘ K</kbd></button>
    </div></header>
    {open && <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 px-4 pt-[15vh]" onMouseDown={() => setOpen(false)}><div className="w-full max-w-xl border border-[#444] bg-[#111] shadow-2xl" onMouseDown={(e) => e.stopPropagation()}><form onSubmit={submit} className="flex items-center gap-3 border-b border-[#303030] px-4 py-4"><div className="h-6 w-6 overflow-hidden rounded border border-white/10 shrink-0"><img src="/logo.png" alt="BALLON" className="h-full w-full object-cover" /></div><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} className="w-full border-0 bg-transparent p-0 text-sm focus:shadow-none" placeholder="Search players, clubs, valuation records…"/><button type="button" onClick={() => setOpen(false)}><X size={17} className="text-[#888]"/></button></form><div className="p-3"><p className="editorial-kicker px-2 pb-2">Jump to module</p>{links.slice(1).map(link => <button key={link.href} onClick={() => { router.push(link.href); setOpen(false); }} className="flex w-full items-center justify-between px-3 py-3 text-left text-sm text-[#bbb] hover:bg-[#1c1c1c] hover:text-white"><span>{link.label}</span><Activity size={13} className="text-[#00f2fe]"/></button>)}</div></div></div>}
  </>;
}
