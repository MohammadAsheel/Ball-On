'use client';

import React, { useState } from 'react';
import { Tv, X, Maximize2, Radio, ExternalLink, ShieldCheck, Sparkles, Volume2 } from 'lucide-react';

export const LALIGA_STREAM_URL =
  'https://ntv.cx/embed?t=Z0hobzNYTEYyVE4xRHNDRDNBSlFzbEdRM29PSXN3Vkw0UXROczFlMkh5OFZ0bzQrcGVPbVhGaEIrMjZDM0VMR1REMkFOU3FMYzJrbTBPMU5CZzZNY3RuZG8vRWNObERDSFZoR1pYbTdHZkc3Y1d3TE1mNWdWZVlJRk02ZHVHY29ZcEdOeWphdmtrMXpFdld0WGhFZy93PT0~';

interface LaLigaStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchTitle?: string;
  homeTeam?: string;
  awayTeam?: string;
  scoreDisplay?: string;
}

export function LaLigaStreamModal({
  isOpen,
  onClose,
  matchTitle = 'La Liga Santander Live Broadcast',
  homeTeam,
  awayTeam,
  scoreDisplay,
}: LaLigaStreamModalProps) {
  const [cinemaMode, setCinemaMode] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 backdrop-blur-md transition-all"
      onClick={onClose}
    >
      <div
        className={`w-full ${
          cinemaMode ? 'max-w-6xl' : 'max-w-4xl'
        } overflow-hidden rounded-2xl border border-rose-500/40 bg-[#0c1018] shadow-[0_0_50px_rgba(244,63,94,0.2)] transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-black/60 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/40 bg-rose-500/15 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
              <Radio size={16} className="animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="mono-font rounded border border-rose-500/40 bg-rose-500/20 px-1.5 py-0.2 text-[9px] font-bold text-rose-300 uppercase tracking-widest flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                  LA LIGA LIVE STREAM
                </span>
                <span className="text-[10px] text-slate-400 font-mono">1080p HD Ultra</span>
              </div>
              <h3 className="display-font text-sm sm:text-base font-bold text-white truncate max-w-md">
                {homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : matchTitle}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Cinema Size */}
            <button
              onClick={() => setCinemaMode(!cinemaMode)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white transition"
              title="Toggle Cinema Mode"
            >
              <Maximize2 size={13} />
              <span className="hidden sm:inline">{cinemaMode ? 'Compact' : 'Cinema'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Video Player Frame Container */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={LALIGA_STREAM_URL}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>

        {/* Stream Controls & Live Status Footer */}
        <div className="border-t border-white/[0.08] bg-black/60 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
              <ShieldCheck size={14} />
              <span>Official Embedded Stream Link</span>
            </span>

            {scoreDisplay && (
              <span className="mono-font rounded bg-white/10 px-2 py-0.5 font-bold text-white text-[11px]">
                {scoreDisplay}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Broadcast Feed: Spanish Commentary & International Feed</span>
            <a
              href={LALIGA_STREAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
            >
              <span>Popout Link</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
