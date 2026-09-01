'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, ArrowRight, User } from 'lucide-react';
import { api } from '@/lib/api';
import { PlayerSearchItem } from '@/lib/types';
import { formatEUR } from '@/lib/format';
import { FaviconSearch } from '@/components/ui/FaviconSearch';

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const samplePlayers = ['Bellingham', 'Mbappé', 'Saka', 'Vinícius Jr.', 'Haaland', 'Pedri'];

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchPlayers(query, 6);
        setResults(data.players || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Player search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPlayer = (playerId: number) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/players/${playerId}`);
  };

  return (
    <div className="relative py-10 sm:py-12 text-center space-y-5">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-semibold tracking-wide">
        <Sparkles size={12} />
        <span>BALLON TRANSFER VALUATION ENGINE</span>
      </div>

      {/* Headline */}
      <div className="space-y-2 max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
          Football data.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
            Transfer intelligence.
          </span>
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Explore player performance, historical transfers and model-estimated transfer values.
        </p>
      </div>

      {/* Search */}
      <div ref={searchRef} className="max-w-xl mx-auto relative text-left">
        <FaviconSearch
          value={query}
          onChange={(val) => setQuery(val)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search a player (e.g. Haaland, Bellingham, Mbappé)..."
          loading={loading}
          clearable={true}
          className="max-w-none shadow-2xl shadow-black/40"
          inputClassName="py-3.5 pl-[52px] text-sm sm:text-base rounded-2xl bg-[#0c1220]/95 border-white/[0.12] focus:border-cyan-400 focus:ring-cyan-500/25"
        />

        {/* Dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-[#0e1628]/98 border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
            {results.map((p) => (
              <button
                key={p.player_id}
                onClick={() => handleSelectPlayer(p.player_id)}
                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-sky-500/8 text-left transition-colors group border-b border-white/[0.03] last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/[0.06] flex items-center justify-center shrink-0">
                    <User size={14} className="text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors truncate">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {p.current_club_name || 'Free Agent'} · {p.position || 'Unknown'}{p.age ? ` · ${p.age}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {p.market_value_in_eur ? (
                    <span className="text-[11px] font-bold text-emerald-400">
                      {formatEUR(p.market_value_in_eur)}
                    </span>
                  ) : null}
                  <ArrowRight size={12} className="text-slate-600 group-hover:text-sky-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Search Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-slate-500 font-medium">Try:</span>
        {samplePlayers.map((name) => (
          <button
            key={name}
            onClick={() => setQuery(name)}
            className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-white transition-colors"
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
