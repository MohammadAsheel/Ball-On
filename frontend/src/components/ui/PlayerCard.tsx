'use client';

import React from 'react';
import Link from 'next/link';
import { User, ArrowRight } from 'lucide-react';
import { PlayerSearchItem } from '@/lib/types';
import { formatEUR } from '@/lib/format';

interface PlayerCardProps {
  player: PlayerSearchItem;
}

const getPositionBadge = (pos?: string | null) => {
  switch (pos?.toLowerCase()) {
    case 'attack':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'midfield':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    case 'defender':
      return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    case 'goalkeeper':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  }
};

export default function PlayerCard({ player }: PlayerCardProps) {
  const badgeClass = getPositionBadge(player.position);

  return (
    <div className="cyber-container">
      {/* 25-cell 3D Tilt interactive canvas link */}
      <Link
        href={`/players/${player.player_id}`}
        className="cyber-canvas"
        aria-label={`View ${player.name}`}
      >
        {Array.from({ length: 25 }, (_, i) => (
          <div key={i} className={`cyber-tracker tr-${i + 1}`} />
        ))}
      </Link>

      {/* 3D Transformable Card Body */}
      <div className="cyber-card">
        {/* Cyber Glare & Scan Line */}
        <div className="card-glare" />
        <div className="scan-line" />

        {/* Ambient Glowing Blobs */}
        <div className="cyber-glowing-elements">
          <div className="cyber-glow-1" />
          <div className="cyber-glow-2" />
          <div className="cyber-glow-3" />
        </div>

        {/* 4 Glowing Corner Brackets */}
        <div className="corner-elements">
          <span />
          <span />
          <span />
          <span />
        </div>

        {/* Animated Cyber Grid Lines */}
        <div className="cyber-lines">
          <span />
          <span />
          <span />
          <span />
        </div>

        {/* Floating Neon Particles */}
        <div className="cyber-particles">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        {/* Card Header & Avatar */}
        <div className="relative z-10 space-y-3.5 pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-slate-900 to-black p-0.5 shadow-lg">
              {player.image_url ? (
                <img
                  src={player.image_url}
                  alt={player.name}
                  className="h-full w-full object-cover rounded-lg"
                  loading="lazy"
                />
              ) : (
                <User size={22} className="text-slate-400" />
              )}
            </div>

            {player.position && (
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border tracking-wide ${badgeClass}`}>
                {player.position}
              </span>
            )}
          </div>

          <div>
            <h3 className="display-font text-lg font-bold text-white tracking-tight line-clamp-1 bg-gradient-to-r from-emerald-300 via-cyan-300 to-white bg-clip-text text-transparent">
              {player.name}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
              {player.current_club_name || 'Free Agent'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {player.country_of_citizenship || 'Unknown'} {player.age ? `• ${player.age} yrs` : ''}
            </p>
          </div>
        </div>

        {/* Card Footer & Market Valuation */}
        <div className="relative z-10 border-t border-white/[0.08] pt-4 flex items-center justify-between mt-4 pointer-events-none">
          <div>
            <p className="editorial-kicker text-[9px] text-slate-400 uppercase font-semibold">
              Market Valuation
            </p>
            <p className="mono-font text-sm font-bold text-emerald-400 mt-0.5">
              {player.market_value_in_eur ? formatEUR(player.market_value_in_eur) : 'Not available'}
            </p>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 text-cyan-400 shadow-sm">
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
