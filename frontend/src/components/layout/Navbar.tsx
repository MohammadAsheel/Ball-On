'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  X,
  Activity,
  Menu,
  TrendingDown,
  Star,
  Tv,
  Bell,
  User,
  ChevronDown,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { FaviconSearch } from '@/components/ui/FaviconSearch';
import { FavoritesDrawer } from '@/components/favorites/FavoritesDrawer';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const mainPills = [
  { href: '/', label: 'SCORES' },
  { href: '/live?tab=news', label: 'NEWS' },
  { href: '/transfers', label: 'MARKET' },
  { href: '/estimator', label: 'VALUATION' },
];

const sportsCategories = [
  { href: '/', label: 'Football' },
  { href: '/transfers', label: 'Transfers' },
  { href: '/estimator', label: 'Estimator' },
  { href: '/live', label: 'Live Feeds' },
  { href: '/compare', label: 'Compare' },
  { href: '/clubs', label: 'Clubs' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [query, setQuery] = useState('');

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
      <header className="sticky top-0 z-40 border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] transition-colors select-none">
        
        {/* Tier 1: Main Header Bar */}
        <div className="mx-auto flex h-14 max-w-[1507px] items-center justify-between gap-4 px-3 sm:px-6">
          
          {/* Left: Logo with Custom Ball-On Wordmark */}
          <div className="flex items-center shrink-0 w-44 sm:w-56">
            <Link href="/" className="flex shrink-0 items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-[8px] border border-[var(--border-color)] bg-[var(--bg-card)] transition-transform group-hover:scale-105 shrink-0">
                <img src="/logo.png" alt="Ball-On" className="h-full w-full object-cover" />
              </div>
              <img
                src="/ball-on-text.png"
                alt="Ball-On"
                className="theme-logo-text h-5 sm:h-6 w-auto object-contain transition-transform group-hover:scale-105 shrink-0"
              />
            </Link>
          </div>

          {/* Middle: Centered Primary Nav Pills */}
          <nav className="hidden md:flex items-center justify-center gap-2 flex-1">
            {mainPills.map((pill) => {
              const active = pathname === pill.href || (pill.href !== '/' && pathname.startsWith(pill.href));
              return (
                <Link
                  key={pill.href}
                  href={pill.href}
                  className={`rounded-[32px] px-4 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? 'bg-[var(--text-main)] text-[var(--bg-main)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {pill.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Search Input, Theme Toggle & Actions */}
          <div className="flex items-center justify-end gap-2 shrink-0 w-44 sm:w-56">
            {/* Search Bar matching Sofa design */}
            <button
              onClick={() => setOpen(true)}
              className="flex h-9 items-center gap-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 text-xs text-[var(--text-muted)] hover:border-[var(--border-color-hover)] hover:text-[var(--text-main)] transition w-full max-w-[180px]"
            >
              <Search size={14} className="text-[var(--text-muted)]" />
              <span className="truncate">Search...</span>
              <kbd className="mono-font ml-auto rounded border border-[var(--border-color)] bg-black/5 dark:bg-white/5 px-1 py-0.2 text-[9px] text-[var(--text-muted)]">
                Ctrl K
              </kbd>
            </button>

            {/* Light / Dark Mode Toggle */}
            <ThemeToggle />

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenu(!mobileMenu)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)]"
              >
                {mobileMenu ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: Category & Quick Links Strip */}
        <div className="hidden sm:block border-t border-[var(--border-color)] bg-[var(--bg-surface)] px-3 sm:px-6">
          <div className="mx-auto flex h-10 max-w-[1507px] items-center justify-between text-xs">
            
            {/* Left Spacer for perfect center balance on desktop */}
            <div className="hidden lg:block w-48 shrink-0" />

            {/* Middle: Centered Category Pills */}
            <div className="flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar py-1 flex-1">
              {sportsCategories.map((cat) => {
                const active = pathname === cat.href;
                return (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className={`flex items-center rounded-[32px] px-3.5 py-1 font-medium transition ${
                      active
                        ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-bold'
                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Quick Shortcuts */}
            <div className="flex items-center justify-end gap-4 text-[11px] font-medium text-[var(--text-muted)] shrink-0 w-auto lg:w-48">
              <Link href="/estimator" className="hidden xl:flex items-center gap-1 hover:text-[var(--text-main)] transition">
                <TrendingDown size={12} className="text-[var(--primary)]" />
                <span>Dropping odds</span>
              </Link>

              <button
                onClick={() => setFavoritesOpen(true)}
                className="flex items-center gap-1 hover:text-[var(--text-main)] transition"
              >
                <Star size={12} className="text-[#ffd600]" />
                <span>Favourites</span>
              </button>

              <Link href="/streams" className="flex items-center gap-1 hover:text-[var(--text-main)] transition">
                <Tv size={12} className="text-[#E73B3B]" />
                <span>TV schedule</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenu && (
          <div className="border-t border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-4 md:hidden">
            <div className="space-y-1">
              {mainPills.map((pill) => (
                <Link
                  key={pill.href}
                  href={pill.href}
                  onClick={() => setMobileMenu(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]"
                >
                  <span>{pill.label}</span>
                </Link>
              ))}
              <div className="pt-2 mt-2 border-t border-[var(--border-color)] flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">Favorites</span>
                <button
                  onClick={() => {
                    setMobileMenu(false);
                    setFavoritesOpen(true);
                  }}
                  className="flex items-center gap-1 text-xs text-[#ffd600] font-bold"
                >
                  <Star size={14} className="fill-[#ffd600]" />
                  <span>Open</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Favorites Drawer Component */}
      <FavoritesDrawer
        isOpen={favoritesOpen}
        onClose={() => setFavoritesOpen(false)}
      />

      {/* ⌘K Command Palette Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-md"
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] shadow-2xl backdrop-blur-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[var(--border-color)] p-3">
              <form onSubmit={submit}>
                <FaviconSearch
                  autoFocus
                  value={query}
                  onChange={(val) => setQuery(val)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      submit(e);
                    }
                  }}
                  placeholder="Search players, clubs, or valuations (e.g. Haaland, Real Madrid)…"
                  clearable={true}
                  className="w-full"
                  inputClassName="py-3 pl-[48px] text-sm rounded-xl bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-main)] focus:border-[var(--primary)]"
                />
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
