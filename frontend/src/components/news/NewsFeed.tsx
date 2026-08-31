'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Newspaper,
  RefreshCw,
  Search,
  ExternalLink,
  Clock,
  Flame,
  ArrowRightLeft,
  Stethoscope,
  Trophy,
  Filter,
  Globe,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { FootballNewsArticle } from '@/lib/types';
import { TableSkeleton } from '@/components/ui/Skeleton';

interface NewsFeedProps {
  initialCategory?: string;
  limit?: number;
  showTitle?: boolean;
}

const CATEGORIES = [
  { id: 'all', label: 'All News', icon: Newspaper, color: 'text-slate-300' },
  { id: 'transfers', label: 'Transfer Wire', icon: ArrowRightLeft, color: 'text-cyan-400' },
  { id: 'injuries', label: 'Medical & Injuries', icon: Stethoscope, color: 'text-rose-400' },
  { id: 'matches', label: 'Match Action', icon: Trophy, color: 'text-amber-400' },
  { id: 'general', label: 'General News', icon: Globe, color: 'text-slate-400' },
];

const SOURCES = [
  { id: 'all', label: 'All Sources' },
  { id: 'bbc sport', label: 'BBC Sport', badge: 'BBC' },
  { id: 'sky sports', label: 'Sky Sports', badge: 'SKY' },
  { id: 'the guardian', label: 'The Guardian', badge: 'GUARDIAN' },
  { id: 'espn fc', label: 'ESPN FC', badge: 'ESPN' },
];

export function NewsFeed({
  initialCategory = 'all',
  limit = 40,
  showTitle = true,
}: NewsFeedProps) {
  const [category, setCategory] = useState<string>(initialCategory);
  const [source, setSource] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [articles, setArticles] = useState<FootballNewsArticle[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchNews = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.getNews({
        category: category === 'all' ? undefined : category,
        source: source === 'all' ? undefined : source,
        query: search.trim() || undefined,
        limit,
        refresh: isManual,
      });

      setArticles(res.articles || []);
      if (res.categories) setCounts(res.categories);
      if (res.last_updated) setLastUpdated(res.last_updated);
    } catch (err) {
      console.error('Failed to fetch news feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [category, source]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNews();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      {showTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.15)]">
              <Newspaper size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="editorial-kicker text-cyan-400">
                  Global Football News Stream
                </span>
                <span className="mono-font rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                  LIVE RSS AGGREGATOR
                </span>
              </div>
              <h3 className="display-font text-lg font-bold text-white">
                Breaking Transfers, Match Action & Medical Updates
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchNews(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-xs text-slate-300 transition hover:border-white/[0.2] hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin text-cyan-400' : ''} />
              <span>{refreshing ? 'Syncing Feeds...' : 'Sync Wire'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Category Pills & Sources */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = category === cat.id;
            const count = counts[cat.id];

            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold tracking-wide transition-all ${
                  active
                    ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <Icon size={14} className={cat.color} />
                <span>{cat.label}</span>
                {count !== undefined && (
                  <span className="mono-font ml-1 rounded bg-white/10 px-1.5 py-0.2 text-[10px] text-white">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Source Dropdown & Search Input */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Source Filter */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {SOURCES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSource(s.id)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-mono transition ${
                  source === s.id
                    ? 'bg-white/15 text-white font-bold border border-white/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search news or players..."
              className="w-full rounded-lg border border-white/[0.1] bg-black/40 py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* News Grid */}
      {loading ? (
        <div className="space-y-3 py-4">
          <TableSkeleton rows={6} />
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.05] text-slate-400">
            <Newspaper size={20} />
          </div>
          <h4 className="display-font text-base font-bold text-white">No Articles Found</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No news articles matched your active filters or search terms. Try clearing your search or switching categories.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {articles.map((item) => {
            const isTransfer = item.category === 'transfers';
            const isInjury = item.category === 'injuries';
            const isMatch = item.category === 'matches';

            const badgeBg = isTransfer
              ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
              : isInjury
              ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
              : isMatch
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
              : 'border-slate-700 bg-slate-800/60 text-slate-400';

            return (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1018]/90 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-500/40 hover:bg-[#101522] hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
              >
                {/* Image Thumbnail if available */}
                {item.image_url && (
                  <div className="relative mb-3 h-36 w-full overflow-hidden rounded-xl bg-slate-900/60">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c1018] via-transparent to-transparent opacity-60" />
                  </div>
                )}

                <div className="space-y-2.5">
                  {/* Outlet & Category Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="mono-font rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold tracking-wider text-slate-300 uppercase">
                      {item.source}
                    </span>

                    <span className={`mono-font rounded-full border px-2 py-0.5 text-[9px] font-semibold ${badgeBg}`}>
                      {item.category_label}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="display-font text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-3 leading-snug">
                    {item.title}
                  </h4>

                  {/* Description */}
                  {item.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="mt-4 border-t border-white/[0.06] pt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-slate-500" />
                    <span>
                      {new Date(item.published_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-cyan-400 font-medium group-hover:translate-x-0.5 transition-transform">
                    <span>Read</span>
                    <ExternalLink size={11} />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
