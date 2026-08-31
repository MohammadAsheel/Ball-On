'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, X, Activity, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';

const links = [
  { href: '/', label: 'Overview' },
  { href: '/estimator', label: 'Valuation Engine' },
  { href: '/players', label: 'Players Catalog' },
  { href: '/live', label: 'Live League Feeds' },
  { href: '/compare', label: 'Comparison Matrix' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [query, setQuery] = useState('');
  const [now, setNow] = useState('');

  useEffect(() => {
    const tick = () =>
      setNow(
        new Intl.DateTimeFormat('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(new Date())
      );
    tick();
    const timer = window.setInterval(tick, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === 'Escape') {
        setOpen(false);
        setMobileMenu(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/players?search=${encodeURIComponent(query.trim())}`);
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#07080c]/85 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-[72px] max-w-[1560px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex shrink-0 items-center gap-3 group">
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-emerald-600 to-teal-900 shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-transform group-hover:scale-105">
                <img src="/logo.png" alt="BALLON" className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center gap-2">
                <span className="display-font text-[22px] tracking-tight font-bold text-white group-hover:text-cyan-300 transition-colors">
                  BALLON
                </span>
                <span className="mono-font rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-amber-400">
                  PRO
                </span>
              </div>
            </Link>

            {/* Live session pill */}
            <div className="hidden items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 lg:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400 radar-dot" />
              <span className="mono-font text-[10px] font-semibold tracking-wider text-slate-400">
                LIVE / {now || 'SYNCING'}
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden h-full items-center gap-1 xl:flex">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex h-10 items-center rounded-lg px-3.5 text-xs font-semibold tracking-wide transition-all ${
                    active
                      ? 'bg-white/[0.08] text-white shadow-sm'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Search Bar & Mobile Menu Toggle */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-xs text-slate-400 transition hover:border-white/[0.2] hover:bg-white/[0.07] hover:text-white"
              aria-label="Open command palette"
            >
              <Search size={14} className="text-cyan-400" />
              <span className="hidden sm:inline">Search intelligence…</span>
              <kbd className="mono-font rounded border border-white/15 bg-black/40 px-1.5 py-0.5 text-[9px] text-slate-300">
                ⌘ K
              </kbd>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-slate-400 transition hover:text-white xl:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenu && (
          <div className="border-b border-white/[0.08] bg-[#07080c]/95 px-4 py-4 backdrop-blur-2xl xl:hidden">
            <div className="space-y-1">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenu(false)}
                    className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                      active
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    <span>{link.label}</span>
                    {active && <Activity size={14} className="text-cyan-400" />}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* ⌘K Command Palette Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-[12vh] backdrop-blur-md"
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/20 bg-[#0e121a]/95 shadow-[0_25px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={submit}
              className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4"
            >
              <Search size={18} className="text-cyan-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full border-0 bg-transparent p-0 text-sm font-medium text-white placeholder:text-slate-500 focus:shadow-none focus:outline-none"
                placeholder="Search players, clubs, or valuations (e.g. Haaland, Real Madrid)…"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </form>

            <div className="p-3">
              <p className="editorial-kicker px-3 py-2 text-slate-400 font-semibold">
                Quick Navigation
              </p>
              <div className="space-y-1">
                {links.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => {
                      router.push(link.href);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <span className="font-medium">{link.label}</span>
                    <Activity size={14} className="text-cyan-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
