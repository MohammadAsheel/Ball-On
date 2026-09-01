'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Activity,
  Calendar,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Clock,
  UserX,
  Stethoscope,
  HeartPulse,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ApiFootballInjury } from '@/lib/types';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { FaviconSearch } from '@/components/ui/FaviconSearch';

interface InjuriesTickerProps {
  initialLeague?: number;
  initialSeason?: number;
  compact?: boolean;
}

const LEAGUES = [
  { id: 39, name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England' },
  { id: 140, name: 'La Liga', flag: '🇪🇸', country: 'Spain' },
  { id: 135, name: 'Serie A', flag: '🇮🇹', country: 'Italy' },
  { id: 78, name: 'Bundesliga', flag: '🇩🇪', country: 'Germany' },
  { id: 61, name: 'Ligue 1', flag: '🇫🇷', country: 'France' },
  { id: 2, name: 'Champions League', flag: '🇪🇺', country: 'Europe' },
];

export function InjuriesTicker({
  initialLeague = 39,
  initialSeason = 2024,
  compact = false,
}: InjuriesTickerProps) {
  const [league, setLeague] = useState<number>(initialLeague);
  const [season, setSeason] = useState<number>(initialSeason);
  const [injuries, setInjuries] = useState<ApiFootballInjury[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchInjuries = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await api.getInjuries({
        league,
        season,
        limit: 100,
      });
      setInjuries(res.injuries || []);
    } catch (err: any) {
      console.error('Failed to fetch injuries:', err);
      setError(err.message || 'Unable to fetch injury bulletins');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInjuries();
  }, [league, season]);

  // Distinct injury types for filtering
  const injuryTypes = useMemo(() => {
    const set = new Set<string>();
    injuries.forEach((item) => {
      if (item.player.type) set.add(item.player.type);
    });
    return Array.from(set);
  }, [injuries]);

  // Filtered injuries
  const filteredInjuries = useMemo(() => {
    return injuries.filter((item) => {
      const matchesSearch =
        !search.trim() ||
        item.player.name.toLowerCase().includes(search.toLowerCase()) ||
        item.team.name.toLowerCase().includes(search.toLowerCase()) ||
        item.player.reason.toLowerCase().includes(search.toLowerCase());

      const matchesType =
        typeFilter === 'all' || item.player.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [injuries, search, typeFilter]);

  const activeLeagueObj = LEAGUES.find((l) => l.id === league) || LEAGUES[0];

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            <Stethoscope size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="editorial-kicker text-rose-400">
                Squad Availability & Injury Wire
              </span>
              <span className="mono-font rounded border border-rose-500/40 bg-rose-500/10 px-1.5 py-0.2 text-[9px] font-bold text-rose-400 uppercase tracking-widest">
                API-FOOTBALL v3
              </span>
            </div>
            <h3 className="display-font text-lg font-bold text-white">
              Official Medical Bulletins & Sidelined Status
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchInjuries(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/[0.2] hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin text-cyan-400' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Wire'}</span>
          </button>
        </div>
      </div>

      {/* League Selection Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {LEAGUES.map((l) => {
          const active = league === l.id;
          return (
            <button
              key={l.id}
              onClick={() => setLeague(l.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold tracking-wide transition-all ${
                active
                  ? 'border-rose-500/60 bg-rose-500/15 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                  : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.name}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
        {/* Search */}
        <div className="w-full sm:w-80">
          <FaviconSearch
            value={search}
            onChange={(val) => setSearch(val)}
            placeholder="Search player, club, or condition (e.g. Muscle, Knee)..."
            clearable={true}
            className="w-full"
            inputClassName="py-1.5 pl-[46px] text-xs rounded-lg border border-white/[0.1] bg-black/40 focus:border-rose-500"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setTypeFilter('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              typeFilter === 'all'
                ? 'bg-white/15 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            All Bulletins ({injuries.length})
          </button>
          {injuryTypes.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                typeFilter === t
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-3 py-4">
          <TableSkeleton rows={6} />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center text-rose-400 space-y-2">
          <AlertTriangle className="mx-auto text-rose-400" size={28} />
          <p className="font-semibold">{error}</p>
          <p className="text-xs text-slate-400">
            Ensure API_FOOTBALL_KEY is active in your project settings.
          </p>
        </div>
      ) : filteredInjuries.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.05] text-slate-400">
            <HeartPulse size={22} className="text-emerald-400" />
          </div>
          <h4 className="display-font text-base font-bold text-white">
            No Active Injury Reports Found
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No injury bulletins matched your filter for {activeLeagueObj.name}. All players appear fit or no recent medical data was recorded for this window.
          </p>
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredInjuries.map((item, idx) => {
            const isSuspended =
              item.player.type.toLowerCase().includes('suspen') ||
              item.player.reason.toLowerCase().includes('red card') ||
              item.player.reason.toLowerCase().includes('yellow cards');

            return (
              <div
                key={`${item.player.id}-${item.fixture.id}-${idx}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1018]/90 p-4 transition-all hover:border-rose-500/40 hover:bg-[#101522] hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              >
                {/* Accent Top Glow */}
                <div
                  className={`absolute -top-10 -right-10 h-24 w-24 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40 ${
                    isSuspended ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                />

                <div className="space-y-3">
                  {/* Top bar: Club Logo, Name & Type Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      {item.team.logo ? (
                        <img
                          src={item.team.logo}
                          alt={item.team.name}
                          className="h-6 w-6 object-contain shrink-0 drop-shadow"
                        />
                      ) : (
                        <Shield size={16} className="text-slate-400 shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-slate-300 truncate">
                        {item.team.name}
                      </span>
                    </div>

                    <span
                      className={`mono-font shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                        isSuspended
                          ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                          : 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      {item.player.type || 'Sidelined'}
                    </span>
                  </div>

                  {/* Player Info Row */}
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-800/80 shadow-inner">
                      {item.player.photo ? (
                        <img
                          src={item.player.photo}
                          alt={item.player.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // fallback avatar
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-500">
                          <UserX size={20} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="display-font text-sm font-bold text-white group-hover:text-rose-300 transition-colors truncate">
                        {item.player.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-rose-400/90 font-medium truncate">
                        <Activity size={12} className="shrink-0 text-rose-400" />
                        <span className="truncate">{item.player.reason}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Meta Bar */}
                <div className="mt-3.5 border-t border-white/[0.06] pt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={11} className="text-slate-500" />
                    <span>{new Date(item.fixture.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <span className="mono-font text-[10px] text-slate-500 font-medium">
                    {item.league.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
