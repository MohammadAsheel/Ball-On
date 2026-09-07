'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Activity,
  Flame,
  Tv,
  Search,
  RefreshCw,
  Trophy,
  ChevronRight,
  Coins,
  Sparkles,
  Radio,
  Play,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  CalendarDays,
  Globe,
} from 'lucide-react';
import { api } from '@/lib/api';
import { BigBallsMatch } from '@/lib/types';
import { UiverseButton } from '@/components/ui/UiverseButton';
import { FaviconSearch } from '@/components/ui/FaviconSearch';

const LEAGUES = [
  { code: 'all', name: 'All Leagues', flag: '🌐', matchStr: 'all' },
  { code: 'epl', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', matchStr: 'premier league' },
  { code: 'laliga', name: 'La Liga', flag: '🇪🇸', matchStr: 'la liga' },
  { code: 'seriea', name: 'Serie A', flag: '🇮🇹', matchStr: 'serie a' },
  { code: 'bundesliga', name: 'Bundesliga', flag: '🇩🇪', matchStr: 'bundesliga' },
  { code: 'ligue1', name: 'Ligue 1', flag: '🇫🇷', matchStr: 'ligue 1' },
  { code: 'ucl', name: 'Champions League', flag: '🇪🇺', matchStr: 'champions league' },
];

type DayTab = 'yesterday' | 'today' | 'tomorrow' | 'all';

interface OverviewMatchesProps {
  onOpenStream?: (info: { home?: string; away?: string; score?: string; title?: string }) => void;
}

export function OverviewMatches({ onOpenStream }: OverviewMatchesProps) {
  const [activeTab, setActiveTab] = useState<DayTab>('today');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Match datasets
  const [yesterdayMatches, setYesterdayMatches] = useState<BigBallsMatch[]>([]);
  const [todayMatches, setTodayMatches] = useState<BigBallsMatch[]>([]);
  const [tomorrowMatches, setTomorrowMatches] = useState<BigBallsMatch[]>([]);
  const [recentFinishedMatches, setRecentFinishedMatches] = useState<BigBallsMatch[]>([]);

  // Compute reference dates dynamically
  const dates = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const toDateStr = (d: Date) => d.toISOString().split('T')[0];
    const formatDisplay = (d: Date) =>
      d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return {
      yesterdayStr: toDateStr(yesterday),
      yesterdayDisplay: formatDisplay(yesterday),
      todayStr: toDateStr(today),
      todayDisplay: formatDisplay(today),
      tomorrowStr: toDateStr(tomorrow),
      tomorrowDisplay: formatDisplay(tomorrow),
    };
  }, []);

  const loadAllMatches = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [yRes, tRes, tmRes, finRes] = await Promise.all([
        api.getBigBallsMatches({ date: dates.yesterdayStr, limit: 30 }).catch(() => ({ data: [] })),
        api.getBigBallsMatches({ date: dates.todayStr, limit: 30 }).catch(() => ({ data: [] })),
        api.getBigBallsMatches({ date: dates.tomorrowStr, limit: 30 }).catch(() => ({ data: [] })),
        api.getBigBallsMatches({ status: 'finished', limit: 12 }).catch(() => ({ data: [] })),
      ]);

      setYesterdayMatches(yRes.data || []);
      setTodayMatches(tRes.data || []);
      setTomorrowMatches(tmRes.data || []);
      setRecentFinishedMatches(finRes.data || []);
    } catch (err) {
      console.error('Failed to load overview matches:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllMatches();
  }, [dates]);

  // Actual matches to consider for yesterday: if empty, fall back to recent finished matches
  const resolvedYesterdayMatches = useMemo(() => {
    if (yesterdayMatches.length > 0) return yesterdayMatches;
    return recentFinishedMatches;
  }, [yesterdayMatches, recentFinishedMatches]);

  const isYesterdayFallback = yesterdayMatches.length === 0 && recentFinishedMatches.length > 0;

  // Active matches based on active tab
  const currentTabMatches = useMemo(() => {
    switch (activeTab) {
      case 'yesterday':
        return resolvedYesterdayMatches;
      case 'today':
        return todayMatches;
      case 'tomorrow':
        return tomorrowMatches;
      case 'all': {
        const merged = [
          ...resolvedYesterdayMatches.map((m) => ({ ...m, _dayGroup: 'yesterday' })),
          ...todayMatches.map((m) => ({ ...m, _dayGroup: 'today' })),
          ...tomorrowMatches.map((m) => ({ ...m, _dayGroup: 'tomorrow' })),
        ];
        return merged;
      }
      default:
        return todayMatches;
    }
  }, [activeTab, resolvedYesterdayMatches, todayMatches, tomorrowMatches]);

  // Filter current matches by league, status, and search query
  const filteredMatches = useMemo(() => {
    return currentTabMatches.filter((match) => {
      // League filter
      if (selectedLeague !== 'all') {
        const leagueObj = LEAGUES.find((l) => l.code === selectedLeague);
        const matchLeague = (match.league || '').toLowerCase();
        if (leagueObj && !matchLeague.includes(leagueObj.matchStr)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        const status = (match.status || '').toLowerCase();
        if (statusFilter === 'live' && status !== 'live' && status !== 'in_progress') {
          return false;
        }
        if (statusFilter === 'finished' && status !== 'finished') {
          return false;
        }
        if (statusFilter === 'scheduled' && status !== 'scheduled') {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const homeName = (match.home?.name || '').toLowerCase();
        const awayName = (match.away?.name || '').toLowerCase();
        const leagueName = (match.league || '').toLowerCase();
        const broadcast = (match.broadcast || '').toLowerCase();
        if (
          !homeName.includes(q) &&
          !awayName.includes(q) &&
          !leagueName.includes(q) &&
          !broadcast.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [currentTabMatches, selectedLeague, statusFilter, searchQuery]);

  // Quick stats summary
  const stats = useMemo(() => {
    const liveCount = todayMatches.filter(
      (m) => m.status === 'live' || m.status === 'in_progress'
    ).length;
    return {
      yesterdayTotal: resolvedYesterdayMatches.length,
      todayTotal: todayMatches.length,
      tomorrowTotal: tomorrowMatches.length,
      liveCount,
    };
  }, [resolvedYesterdayMatches, todayMatches, tomorrowMatches]);

  return (
    <section className="terminal-card overflow-hidden border-white/[0.09] bg-gradient-to-b from-[#0e121a]/95 via-[#0b0e14]/95 to-[#080a0f]/95 shadow-[0_16px_50px_rgba(0,0,0,0.5)]">
      {/* Top Header & Telemetry Rule */}
      <div className="border-b border-white/[0.08] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="mono-font text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5">
                <Flame size={12} className="animate-pulse text-cyan-400" />
                Match Telemetry / Multi-Day Horizon
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span className="mono-font text-[11px] text-slate-400 font-semibold">
                TOP 6 EUROPEAN LEAGUES
              </span>
            </div>

            <h2 className="display-font text-2xl sm:text-3xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2.5">
              <span>Match Radar:</span>
              <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
                Yesterday, Today & Tomorrow
              </span>
            </h2>

            <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-2xl">
              Live broadcast feeds, final scores from yesterday, and upcoming kickoff schedules across the Premier League, La Liga, Serie A, Bundesliga, Ligue 1, and UEFA Champions League.
            </p>
          </div>

          {/* Quick Actions & Live Link */}
          <div className="flex items-center gap-3 shrink-0">
            <UiverseButton
              size="sm"
              variant="default"
              onClick={() => loadAllMatches(true)}
              disabled={refreshing || loading}
              title="Refresh match feeds"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-cyan-400' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Sync Radar'}</span>
            </UiverseButton>

            <UiverseButton
              href="/live"
              variant="cyan"
              size="sm"
            >
              <span>Full Match Center</span>
              <ArrowUpRight size={14} />
            </UiverseButton>
          </div>
        </div>

        {/* Telemetry Micro Metrics Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/[0.06] pt-5">
          <div
            onClick={() => setActiveTab('yesterday')}
            className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
              activeTab === 'yesterday'
                ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                : 'border-white/[0.05] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="editorial-kicker text-slate-400 text-[9px]">Yesterday's Action</span>
              <span className="mono-font rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400">
                FT RESULTS
              </span>
            </div>
            <p className="mono-font mt-1.5 text-xl font-bold text-white">
              {stats.yesterdayTotal}
              <span className="text-xs font-normal text-slate-400 ml-1.5">matches</span>
            </p>
            <p className="mono-font text-[10px] text-slate-500 mt-0.5">{dates.yesterdayDisplay}</p>
          </div>

          <div
            onClick={() => setActiveTab('today')}
            className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
              activeTab === 'today'
                ? 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(0,242,254,0.15)]'
                : 'border-white/[0.05] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="editorial-kicker text-cyan-400 text-[9px]">Today's Matches</span>
              <span className="mono-font rounded border border-cyan-500/40 bg-cyan-500/20 px-1.5 py-0.2 text-[9px] font-bold text-cyan-300 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                TODAY
              </span>
            </div>
            <p className="mono-font mt-1.5 text-xl font-bold text-white">
              {stats.todayTotal}
              <span className="text-xs font-normal text-slate-400 ml-1.5">fixtures</span>
            </p>
            <p className="mono-font text-[10px] text-cyan-400/80 mt-0.5">{dates.todayDisplay}</p>
          </div>

          <div
            onClick={() => setActiveTab('tomorrow')}
            className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
              activeTab === 'tomorrow'
                ? 'border-amber-500/40 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                : 'border-white/[0.05] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="editorial-kicker text-slate-400 text-[9px]">Tomorrow's Slate</span>
              <span className="mono-font rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-400">
                UPCOMING
              </span>
            </div>
            <p className="mono-font mt-1.5 text-xl font-bold text-white">
              {stats.tomorrowTotal}
              <span className="text-xs font-normal text-slate-400 ml-1.5">fixtures</span>
            </p>
            <p className="mono-font text-[10px] text-slate-500 mt-0.5">{dates.tomorrowDisplay}</p>
          </div>

          <div
            onClick={() => setActiveTab('all')}
            className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
              activeTab === 'all'
                ? 'border-purple-500/40 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                : 'border-white/[0.05] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="editorial-kicker text-slate-400 text-[9px]">3-Day Timeline</span>
              <span className="mono-font rounded bg-purple-500/20 px-1.5 py-0.2 text-[9px] font-bold text-purple-300">
                COMBINED
              </span>
            </div>
            <p className="mono-font mt-1.5 text-xl font-bold text-white">
              {stats.yesterdayTotal + stats.todayTotal + stats.tomorrowTotal}
              <span className="text-xs font-normal text-slate-400 ml-1.5">total</span>
            </p>
            <p className="mono-font text-[10px] text-slate-500 mt-0.5">3-Day Window</p>
          </div>
        </div>
      </div>

      {/* Main Day Tabs Navigation */}
      <div className="border-b border-white/[0.08] bg-[#0c1018]/90 p-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Day Segmented Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              id="tab-yesterday-matches"
              onClick={() => setActiveTab('yesterday')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 ${
                activeTab === 'yesterday'
                  ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'border border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-white'
              }`}
            >
              <CheckCircle2 size={13} className={activeTab === 'yesterday' ? 'text-emerald-400' : 'text-slate-500'} />
              <span>Yesterday's Matches</span>
              <span className="mono-font rounded-md border border-white/10 bg-black/40 px-1.5 py-0.2 text-[10px] text-slate-300">
                {dates.yesterdayDisplay}
              </span>
              <span className="mono-font rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-300">
                {stats.yesterdayTotal}
              </span>
            </button>

            <button
              id="tab-today-matches"
              onClick={() => setActiveTab('today')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 ${
                activeTab === 'today'
                  ? 'border border-cyan-400/60 bg-gradient-to-r from-cyan-500/20 to-emerald-500/15 text-cyan-200 shadow-[0_0_20px_rgba(0,242,254,0.25)]'
                  : 'border border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-white'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Today's Matches</span>
              <span className="mono-font rounded-md border border-cyan-500/30 bg-cyan-950/60 px-1.5 py-0.2 text-[10px] text-cyan-300">
                {dates.todayDisplay}
              </span>
              <span className="mono-font rounded-full bg-cyan-400/25 px-1.5 py-0.2 text-[10px] font-bold text-cyan-200">
                {stats.todayTotal}
              </span>
            </button>

            <button
              id="tab-tomorrow-matches"
              onClick={() => setActiveTab('tomorrow')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 ${
                activeTab === 'tomorrow'
                  ? 'border border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'border border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-white'
              }`}
            >
              <Clock size={13} className={activeTab === 'tomorrow' ? 'text-amber-400' : 'text-slate-500'} />
              <span>Tomorrow's Matches</span>
              <span className="mono-font rounded-md border border-white/10 bg-black/40 px-1.5 py-0.2 text-[10px] text-slate-300">
                {dates.tomorrowDisplay}
              </span>
              <span className="mono-font rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-300">
                {stats.tomorrowTotal}
              </span>
            </button>

            <button
              id="tab-all-matches"
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 ${
                activeTab === 'all'
                  ? 'border border-purple-500/50 bg-purple-500/15 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'border border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-white'
              }`}
            >
              <CalendarDays size={13} className={activeTab === 'all' ? 'text-purple-400' : 'text-slate-500'} />
              <span>All 3 Days</span>
              <span className="mono-font rounded-full bg-purple-500/20 px-1.5 py-0.2 text-[10px] font-bold text-purple-300">
                {stats.yesterdayTotal + stats.todayTotal + stats.tomorrowTotal}
              </span>
            </button>
          </div>

          {/* Search Filter */}
          <div className="w-full md:w-64 shrink-0">
            <FaviconSearch
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              placeholder="Search team, league, or TV..."
              clearable={true}
              className="w-full"
              inputClassName="py-2 pl-[42px] text-xs rounded-xl border-white/[0.1] bg-[#080b11]"
            />
          </div>
        </div>

        {/* Secondary Filter Bar: League selector & status filter */}
        <div className="mt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-t border-white/[0.06] pt-3.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {LEAGUES.map((league) => (
              <UiverseButton
                key={league.code}
                size="xs"
                active={selectedLeague === league.code}
                onClick={() => setSelectedLeague(league.code)}
              >
                <span>{league.flag}</span>
                <span>{league.name}</span>
              </UiverseButton>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">
              Status:
            </span>
            {[
              { id: 'all', label: 'All' },
              { id: 'live', label: 'Live' },
              { id: 'scheduled', label: 'Upcoming' },
              { id: 'finished', label: 'FT' },
            ].map((st) => (
              <UiverseButton
                key={st.id}
                size="xs"
                active={statusFilter === st.id}
                onClick={() => setStatusFilter(st.id)}
              >
                {st.label}
              </UiverseButton>
            ))}
          </div>
        </div>
      </div>

      {/* Fallback Notice for Yesterday if 0 scheduled on that day */}
      {activeTab === 'yesterday' && isYesterdayFallback && (
        <div className="flex items-center justify-between gap-3 bg-amber-500/10 border-b border-amber-500/20 px-6 sm:px-8 py-2.5 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400 shrink-0" />
            <span>
              <strong>Rest Day Note:</strong> No official fixtures were scheduled directly on {dates.yesterdayDisplay}. Displaying verified results from the recent matchday.
            </span>
          </div>
          <span className="mono-font text-[10px] text-amber-400 font-bold uppercase tracking-wider shrink-0 hidden sm:inline">
            Latest Matchday Results
          </span>
        </div>
      )}

      {/* Match Cards Display Grid */}
      <div className="p-6 sm:p-8">
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-cyan-400 border-t-transparent" />
            <p className="mono-font mt-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Loading Match Telemetry Feeds...
            </p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
              <Calendar size={22} />
            </div>
            <h3 className="display-font mt-4 text-base font-bold text-white">
              No Matches Found
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
              No matches matched your search "{searchQuery}" or selected league filter for this day.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <UiverseButton
                size="xs"
                variant="default"
                onClick={() => {
                  setSelectedLeague('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </UiverseButton>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredMatches.map((match, idx) => (
              <OverviewMatchCard
                key={`overview-match-${match.id || idx}`}
                match={match}
                onOpenStream={onOpenStream}
              />
            ))}
          </div>
        )}
      </div>

      {/* Catalog Bottom Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/[0.08] px-6 sm:px-8 py-4 bg-[#090c12]">
        <div className="flex items-center gap-2">
          <span className="mono-font text-[11px] text-slate-400">
            SHOWING <strong className="text-white">{filteredMatches.length}</strong> MATCHES IN CURRENT RADAR
          </span>
          <span className="text-slate-600">·</span>
          <span className="mono-font text-[10px] text-cyan-400 font-semibold uppercase">
            PROVIDER: @bigballsdata/sdk
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/streams"
            className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition"
          >
            <Tv size={13} />
            <span>Live TV Broadcast Hub</span>
          </Link>
          <span className="text-slate-600">·</span>
          <Link
            href="/live"
            className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
          >
            <span>Advanced Live Intelligence</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function OverviewMatchCard({
  match,
  onOpenStream,
}: {
  match: BigBallsMatch & { _dayGroup?: string };
  onOpenStream?: (info: { home?: string; away?: string; score?: string; title?: string }) => void;
}) {
  const isLive = match.status === 'live' || match.status === 'in_progress';
  const isFinished = match.status === 'finished';
  const isScheduled = match.status === 'scheduled';

  const homeName = match.home?.name || 'Home Team';
  const awayName = match.away?.name || 'Away Team';
  const homeShort =
    match.home?.short_name || (match.home?.name ? match.home.name.slice(0, 3).toUpperCase() : 'HOM');
  const awayShort =
    match.away?.short_name || (match.away?.name ? match.away.name.slice(0, 3).toUpperCase() : 'AWY');

  const leagueLabel = (match.league || 'EUROPEAN FOOTBALL').toUpperCase();
  const isLaLiga =
    leagueLabel.includes('LA LIGA') ||
    leagueLabel.includes('PD') ||
    leagueLabel.includes('SPAIN');

  const kickoffDate = match.kickoff_utc ? new Date(match.kickoff_utc) : null;
  const formattedKickoff = kickoffDate
    ? kickoffDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : 'TBD';
  const formattedDate = kickoffDate
    ? kickoffDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : '';

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border p-4.5 transition-all duration-300 hover:scale-[1.01] ${
        isLive
          ? 'border-rose-500/50 bg-gradient-to-b from-[#190d14] to-[#0c0f17] shadow-[0_4px_25px_rgba(244,63,94,0.15)] hover:border-rose-400'
          : isLaLiga
          ? 'border-rose-950/60 bg-gradient-to-b from-[#121520] to-[#0a0d14] hover:border-rose-500/40 hover:shadow-[0_4px_20px_rgba(244,63,94,0.1)]'
          : 'border-white/[0.08] bg-[#0c1018]/90 hover:border-cyan-500/40 hover:bg-[#101522] hover:shadow-[0_8px_30px_rgba(0,242,254,0.08)]'
      }`}
    >
      <div>
        {/* Card Header: League & Status */}
        <div className="flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2 truncate">
            <span
              className={`mono-font border px-2 py-0.5 text-[9px] font-bold tracking-wider rounded ${
                isLaLiga
                  ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                  : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
              }`}
            >
              {leagueLabel}
            </span>

            {match.broadcast && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 rounded truncate max-w-[120px]">
                <Tv size={10} className="text-cyan-400 shrink-0" />
                <span className="truncate">{match.broadcast}</span>
              </span>
            )}
          </div>

          <div className="shrink-0">
            {isLive ? (
              <span className="badge-neon-red">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff3366] animate-ping" />
                LIVE
              </span>
            ) : isFinished ? (
              <span className="badge-neon-green">
                FT
              </span>
            ) : (
              <span className="badge-neon-yellow timer-display">
                {formattedKickoff}
              </span>
            )}
          </div>
        </div>

        {/* Teams & Scoreline Section */}
        <div className="mt-4 space-y-3">
          {/* Home Team Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {match.home?.logo_url ? (
                <img
                  src={match.home.logo_url}
                  alt={homeName}
                  className="w-7 h-7 object-contain shrink-0"
                  onError={(e) => {
                    // Fallback to text initials if image fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-7 h-7 rounded-lg border border-white/10 bg-white/[0.05] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {homeShort}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                  {homeName}
                </p>
                <p className="mono-font text-[10px] text-slate-400">{homeShort}</p>
              </div>
            </div>

            <span className="score-numeral text-2xl font-black text-white shrink-0 ml-2">
              {match.score?.home !== null && match.score?.home !== undefined ? match.score.home : isScheduled ? '—' : 0}
            </span>
          </div>

          {/* Away Team Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {match.away?.logo_url ? (
                <img
                  src={match.away.logo_url}
                  alt={awayName}
                  className="w-7 h-7 object-contain shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-7 h-7 rounded-lg border border-white/10 bg-white/[0.05] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {awayShort}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                  {awayName}
                </p>
                <p className="mono-font text-[10px] text-slate-400">{awayShort}</p>
              </div>
            </div>

            <span className="score-numeral text-2xl font-black text-white shrink-0 ml-2">
              {match.score?.away !== null && match.score?.away !== undefined ? match.score.away : isScheduled ? '—' : 0}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Date, Odds & Stream button */}
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <Calendar size={11} className="text-slate-500 shrink-0" />
          <span className="timer-display truncate text-slate-300">{formattedDate} · {formattedKickoff}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {match.has_odds && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.2 rounded">
              <Coins size={10} /> Odds Active
            </span>
          )}

          {isLaLiga ? (
            <button
              onClick={() => {
                if (onOpenStream) {
                  onOpenStream({
                    home: homeName,
                    away: awayName,
                    score:
                      match.score?.home !== null && match.score?.home !== undefined
                        ? `${match.score.home} - ${match.score.away}`
                        : undefined,
                    title: `${homeName} vs ${awayName} (La Liga)`,
                  });
                }
              }}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/60 bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition shadow-[0_0_10px_rgba(244,63,94,0.25)]"
            >
              <Tv size={11} className="text-rose-400 animate-pulse" />
              <span>Watch Live</span>
            </button>
          ) : (
            <Link
              href="/live"
              className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-cyan-400 transition"
            >
              <span>Details</span>
              <ChevronRight size={10} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
