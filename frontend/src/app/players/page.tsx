'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, User, ArrowRight, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { PlayerSearchItem } from '@/lib/types';
import { formatEUR } from '@/lib/format';
import { CardSkeleton } from '@/components/ui/Skeleton';

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
    const timer = setTimeout(loadDirectory, 200);
    return () => clearTimeout(timer);
  }, [query, position, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Players</h1>
          <p className="text-sm text-slate-400 mt-1">
            Search and explore over 50,000 players across top European leagues.
          </p>
        </div>
        <span className="text-xs text-slate-500 font-medium tabular-nums">{totalCount.toLocaleString()} players</span>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search player name..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-sm"
          />
          <Search className="absolute left-3.5 top-3 text-slate-500" size={16} />
        </div>
        <select
          value={position}
          onChange={(e) => {
            setPosition(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-44 px-3 py-2.5 text-sm"
        >
          <option value="">All Positions</option>
          <option value="Attack">Attackers</option>
          <option value="Midfield">Midfielders</option>
          <option value="Defender">Defenders</option>
          <option value="Goalkeeper">Goalkeepers</option>
        </select>
      </div>

      {/* Players Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : players.length === 0 ? (
        <div className="glass-card text-center py-16 text-slate-400">
          <p className="font-semibold text-white">No players found</p>
          <p className="text-xs mt-1">Try adjusting your search keywords or filter criteria.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {players.map((p) => (
              <Link
                key={p.player_id}
                href={`/players/${p.player_id}`}
                className="glass-card p-5 border border-white/5 hover:border-sky-500/30 hover:bg-slate-900/90 transition-all group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    {p.position && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {p.position}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {p.current_club_name || 'Free Agent'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {p.country_of_citizenship || 'Unknown'} {p.age ? `• ${p.age} yrs` : ''}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Market Valuation</p>
                    <p className="text-xs font-bold text-emerald-400">
                      {p.market_value_in_eur ? formatEUR(p.market_value_in_eur) : 'Not available'}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {!query && totalCount > 24 && (
            <div className="flex items-center justify-center gap-3 pt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="text-xs text-slate-400 font-semibold">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 24 >= totalCount}
                className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40 flex items-center gap-1"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
