'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, X, Users, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { PlayerSearchItem } from '@/lib/types';
import { CardSkeleton } from '@/components/ui/Skeleton';
import PlayerCard from '@/components/ui/PlayerCard';
import { FaviconSearch } from '@/components/ui/FaviconSearch';
import { UiverseButton } from '@/components/ui/UiverseButton';

const positions = [
  { label: 'All Positions', value: '' },
  { label: 'Attackers', value: 'Attack' },
  { label: 'Midfielders', value: 'Midfield' },
  { label: 'Defenders', value: 'Defender' },
  { label: 'Goalkeepers', value: 'Goalkeeper' },
];

export default function PlayersDirectoryPage() {
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<PlayerSearchItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function loadDirectory() {
      setLoading(true);
      try {
        if (query.trim().length >= 2) {
          const res = await api.searchPlayers(query, 24);
          setPlayers(res.players);
          setTotalCount(res.count);
        } else {
          const res = await api.getPlayersDirectory({
            position: position || undefined,
            page,
            page_size: 24,
          });
          setPlayers(res.players);
          setTotalCount(res.total);
        }
      } catch (err) {
        console.error('Failed to load players directory:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDirectory();
  }, [position, page, query]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="editorial-kicker text-cyan-400">Database Directory</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="mono-font text-[10px] text-emerald-400">INDEXED & LIVE</span>
          </div>
          <h1 className="display-font text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Player Intelligence Catalog
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
            Explore and evaluate over 50,000 professional players with real-time valuation metrics, performance telemetry, and machine-learning transfer estimates.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2">
          <Users size={15} className="text-cyan-400" />
          <span className="mono-font text-xs text-slate-300 font-semibold tabular-nums">
            {totalCount.toLocaleString()} <span className="text-slate-500">records</span>
          </span>
        </div>
      </div>

      {/* Search & Position Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search input */}
        <FaviconSearch
          value={query}
          onChange={(val) => {
            setQuery(val);
            setPage(1);
          }}
          placeholder="Search player by name (e.g. Haaland, Yamal, Vinicius)…"
          loading={loading}
          clearable={true}
          className="flex-1 max-w-xl"
        />

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {positions.map((p) => {
            const active = position === p.value;
            return (
              <UiverseButton
                key={p.value}
                size="sm"
                active={active}
                onClick={() => {
                  setPosition(p.value);
                  setPage(1);
                }}
              >
                {p.label}
              </UiverseButton>
            );
          })}
        </div>
      </div>

      {/* Players Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : players.length === 0 ? (
        <div className="glass-card text-center py-20 text-slate-400 rounded-2xl border border-white/[0.08]">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05] text-slate-400">
            <Search size={22} />
          </div>
          <p className="text-base font-bold text-white">No players found</p>
          <p className="text-xs mt-1 text-slate-400">Try adjusting your search query or selecting a different position filter.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {players.map((p) => (
              <PlayerCard key={p.player_id} player={p} />
            ))}
          </div>

          {/* Pagination */}
          {!query && totalCount > 24 && (
            <div className="flex items-center justify-between border-t border-white/[0.08] pt-6">
              <span className="mono-font text-xs text-slate-500">
                Displaying {(page - 1) * 24 + 1}–{Math.min(page * 24, totalCount)} of {totalCount.toLocaleString()} records
              </span>

              <div className="flex items-center gap-2">
                <UiverseButton
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  size="sm"
                  variant="default"
                >
                  <ChevronLeft size={13} />
                  <span>Previous</span>
                </UiverseButton>
                <span className="mono-font rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 font-semibold">
                  {page} / {Math.ceil(totalCount / 24)}
                </span>
                <UiverseButton
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 24 >= totalCount}
                  size="sm"
                  variant="default"
                >
                  <span>Next</span>
                  <ChevronRight size={13} />
                </UiverseButton>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
