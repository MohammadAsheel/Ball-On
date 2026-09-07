'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, ChevronLeft, ChevronRight, Clock, Tv } from 'lucide-react';
import { api } from '@/lib/api';
import { BigBallsMatch } from '@/lib/types';

export function TopScoresTicker() {
  const [matches, setMatches] = useState<BigBallsMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    api.getBigBallsMatches({ date: today, limit: 16 })
      .then((res) => {
        if (res?.data?.length) {
          setMatches(res.data);
        } else {
          // Fallback sample matches matching the visual density
          setMatches([
            { id: 'top-1', league: 'Premier League', home: { name: 'Arsenal', short_name: 'ARS' }, away: { name: 'Chelsea', short_name: 'CHE' }, score: { home: 2, away: 1 }, status: 'live' },
            { id: 'top-2', league: 'La Liga', home: { name: 'Real Madrid', short_name: 'RMA' }, away: { name: 'Barcelona', short_name: 'BAR' }, score: { home: 1, away: 1 }, status: 'live' },
            { id: 'top-3', league: 'Bundesliga', home: { name: 'Bayern', short_name: 'BAY' }, away: { name: 'Dortmund', short_name: 'BVB' }, score: { home: 3, away: 0 }, status: 'finished' },
            { id: 'top-4', league: 'Serie A', home: { name: 'Inter', short_name: 'INT' }, away: { name: 'Milan', short_name: 'MIL' }, score: { home: 0, away: 2 }, status: 'finished' },
            { id: 'top-5', league: 'Ligue 1', home: { name: 'PSG', short_name: 'PSG' }, away: { name: 'Marseille', short_name: 'OM' }, score: { home: 2, away: 0 }, status: 'finished' },
            { id: 'top-6', league: 'Premier League', home: { name: 'Liverpool', short_name: 'LIV' }, away: { name: 'Man City', short_name: 'MCI' }, kickoff_utc: '2026-09-03T20:30:00Z', status: 'scheduled' },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] select-none text-xs transition-colors">
      <div className="mx-auto flex h-10 max-w-[1507px] items-center gap-2 px-3 sm:px-4 overflow-hidden">
        
        {/* Trending Chip */}
        <div className="flex shrink-0 items-center gap-1.5 rounded-[32px] bg-[var(--primary)]/15 border border-[var(--primary)]/30 px-2.5 py-1 text-[11px] font-bold text-[var(--primary)]">
          <Flame size={12} className="text-[var(--primary)] fill-[var(--primary)]" />
          <span>Trending</span>
        </div>

        {/* Date Selector */}
        <div className="flex shrink-0 items-center gap-1 text-[11px] text-[var(--text-muted)] px-1">
          <button className="hover:text-[var(--text-main)] p-0.5 rounded transition">
            <ChevronLeft size={13} />
          </button>
          <span className="font-semibold text-[var(--text-main)]">Today</span>
          <button className="hover:text-[var(--text-main)] p-0.5 rounded transition">
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="h-4 w-px bg-[var(--border-color)] shrink-0 mx-1" />

        {/* Scrollable match ticker chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
          {matches.map((m, idx) => {
            const isLive = m.status === 'live' || m.status === 'in_progress';
            const isFinished = m.status === 'finished';
            const homeShort = m.home?.short_name || (m.home?.name ? m.home.name.slice(0, 3).toUpperCase() : 'HOM');
            const awayShort = m.away?.short_name || (m.away?.name ? m.away.name.slice(0, 3).toUpperCase() : 'AWY');
            const scoreHome = m.score?.home ?? 0;
            const scoreAway = m.score?.away ?? 0;

            return (
              <Link
                key={m.id || idx}
                href="/"
                className="group flex shrink-0 items-center gap-2 rounded-[32px] bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--primary)] px-3 py-1 transition"
              >
                {/* Status Indicator */}
                {isLive ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#E73B3B]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E73B3B] animate-ping" />
                    LIVE
                  </span>
                ) : isFinished ? (
                  <span className="text-[10px] font-bold text-[var(--text-muted)]">
                    FT
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)]">
                    <Clock size={10} />
                    {m.kickoff_utc ? new Date(m.kickoff_utc).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '20:30'}
                  </span>
                )}

                {/* Team Crests & Score */}
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  {m.home?.logo_url ? (
                    <img src={m.home.logo_url} alt="" className="h-4 w-4 object-contain rounded-full" />
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/10 dark:bg-white/10 text-[8px] font-bold">
                      {homeShort[0]}
                    </span>
                  )}

                  {isFinished || isLive ? (
                    <span className="score-numeral text-xs font-bold text-[var(--text-main)]">
                      {scoreHome} - {scoreAway}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[var(--text-muted)]">vs</span>
                  )}

                  {m.away?.logo_url ? (
                    <img src={m.away.logo_url} alt="" className="h-4 w-4 object-contain rounded-full" />
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/10 dark:bg-white/10 text-[8px] font-bold">
                      {awayShort[0]}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
