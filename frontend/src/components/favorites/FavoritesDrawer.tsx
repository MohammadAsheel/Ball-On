'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star,
  X,
  Shield,
  User,
  Activity,
  Trash2,
  Plus,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { UiverseButton } from '@/components/ui/UiverseButton';

export interface FavoriteItem {
  id: string;
  name: string;
  type: 'club' | 'player' | 'league';
  league?: string;
  badge?: string;
  url?: string;
  addedAt: number;
}

const DEFAULT_PRESETS: FavoriteItem[] = [
  { id: 'real-madrid', name: 'Real Madrid', type: 'club', league: 'La Liga', badge: '👑', url: '/clubs?search=Real+Madrid', addedAt: Date.now() - 500000 },
  { id: 'arsenal', name: 'Arsenal', type: 'club', league: 'Premier League', badge: '🔴', url: '/clubs?search=Arsenal', addedAt: Date.now() - 400000 },
  { id: 'haaland', name: 'Erling Haaland', type: 'player', league: 'Man City', badge: '⚽', url: '/players?search=Haaland', addedAt: Date.now() - 300000 },
  { id: 'bellingham', name: 'Jude Bellingham', type: 'player', league: 'Real Madrid', badge: '⭐', url: '/players?search=Bellingham', addedAt: Date.now() - 200000 },
];

const STORAGE_KEY = 'ballon-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      } else {
        // Initialize with default suggestions
        setFavorites(DEFAULT_PRESETS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRESETS));
      }
    } catch {
      setFavorites(DEFAULT_PRESETS);
    }
    setMounted(true);
  }, []);

  const addFavorite = (item: Omit<FavoriteItem, 'addedAt'>) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === item.id)) return prev;
      const updated = [{ ...item, addedAt: Date.now() }, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('ballon-favorites-updated'));
      return updated;
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('ballon-favorites-updated'));
      return updated;
    });
  };

  const isFavorite = (id: string) => favorites.some((f) => f.id === id);

  return { favorites, addFavorite, removeFavorite, isFavorite, mounted };
}

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FavoritesDrawer({ isOpen, onClose }: FavoritesDrawerProps) {
  const { favorites, addFavorite, removeFavorite, mounted } = useFavorites();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'club' | 'player'>('all');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const filtered = favorites.filter((item) => {
    const matchType = filterType === 'all' || item.type === filterType;
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.league && item.league.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full max-w-md flex-col border-l border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] shadow-2xl transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-surface)] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-500">
              <Star size={16} className="fill-amber-500" />
            </div>
            <div>
              <h2 className="display-font text-base font-bold text-[var(--text-main)]">Your Favorites</h2>
              <p className="mono-font text-[10px] text-[var(--text-muted)]">
                {favorites.length} PINNED {favorites.length === 1 ? 'ITEM' : 'ITEMS'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)] transition"
            aria-label="Close favorites"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search & Type Filters */}
        <div className="space-y-3 p-4 border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your favorites..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(['all', 'club', 'player'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  filterType === type
                    ? 'border border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]'
                    : 'border border-[var(--border-color)] bg-black/5 dark:bg-white/[0.02] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {type === 'all' ? 'All' : `${type}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Favorites List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <Star size={32} className="text-[var(--text-muted)] mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[var(--text-main)]">No favorites found</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Pin clubs or players to access their scores and market stats at a glance.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-3 hover:border-[var(--primary)] hover:bg-[var(--bg-card-hover)] transition-all"
              >
                <Link
                  href={item.url || `/players?search=${encodeURIComponent(item.name)}`}
                  onClick={onClose}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-color)] bg-black/5 dark:bg-black/40 text-base shrink-0">
                    {item.badge || (item.type === 'club' ? '🛡️' : '👤')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors truncate">
                        {item.name}
                      </p>
                      <span className="mono-font text-[9px] uppercase px-1.5 py-0.2 rounded border border-[var(--border-color)] bg-black/5 dark:bg-white/[0.04] text-[var(--text-muted)] shrink-0">
                        {item.type}
                      </span>
                    </div>
                    {item.league && (
                      <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{item.league}</p>
                    )}
                  </div>
                </Link>

                <button
                  onClick={() => removeFavorite(item.id)}
                  title="Remove from favorites"
                  className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-rose-500/15 hover:text-rose-500 transition shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Quick Suggestion Presets */}
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles size={12} className="text-amber-500" />
            <span className="editorial-kicker text-[var(--text-muted)] font-bold">Quick Suggestions</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'man-city', name: 'Man City', type: 'club' as const, league: 'Premier League', badge: '🩵', url: '/clubs?search=Man+City' },
              { id: 'barcelona', name: 'FC Barcelona', type: 'club' as const, league: 'La Liga', badge: '🔵', url: '/clubs?search=Barcelona' },
              { id: 'yamal', name: 'Lamine Yamal', type: 'player' as const, league: 'FC Barcelona', badge: '⚡', url: '/players?search=Yamal' },
              { id: 'mbappe', name: 'Kylian Mbappé', type: 'player' as const, league: 'Real Madrid', badge: '🔥', url: '/players?search=Mbappe' },
            ].map((preset) => {
              const alreadyFav = favorites.some((f) => f.id === preset.id);
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    if (alreadyFav) removeFavorite(preset.id);
                    else addFavorite(preset);
                  }}
                  className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition ${
                    alreadyFav
                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-500'
                      : 'border-[var(--border-color)] bg-black/5 dark:bg-white/[0.02] text-[var(--text-muted)] hover:border-[var(--border-color-hover)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <span>{preset.badge}</span>
                  <span>{preset.name}</span>
                  {alreadyFav ? <Star size={10} className="fill-amber-500 text-amber-500" /> : <Plus size={10} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
