'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Search,
  ChevronLeft,
  ChevronRight,
  Sliders,
  DollarSign,
  ArrowRight,
  Radio,
  Flame,
  TrendingUp,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { TransfersResponse, LiveFootballTransfer } from '@/lib/types';
import { formatEUR, formatDate } from '@/lib/format';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { FaviconSearch } from '@/components/ui/FaviconSearch';
import { UiverseButton } from '@/components/ui/UiverseButton';

export default function TransfersPage() {
  // Mode: 'live' (RapidAPI 2026 Real-Time) vs 'database' (Historical DB)
  const [marketMode, setMarketMode] = useState<'live' | 'database'>('live');

  // Historical Database State
  const [data, setData] = useState<TransfersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [minFee, setMinFee] = useState<number>(5_000_000);
  const [clubSearch, setClubSearch] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [season, setSeason] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('fee_desc');
  const [page, setPage] = useState<number>(1);

  // Live RapidAPI 2026 State
  const [liveTransfers, setLiveTransfers] = useState<LiveFootballTransfer[]>([]);
  const [liveType, setLiveType] = useState<'top' | 'market_value' | 'all'>('top');
  const [livePage, setLivePage] = useState<number>(1);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveHits, setLiveHits] = useState<number>(0);

  // Load Historical DB
  useEffect(() => {
    if (marketMode !== 'database') return;

    async function loadHistorical() {
      setLoading(true);
      try {
        const res = await api.getTransfers({
          min_fee: minFee,
          club: clubSearch || undefined,
          position: position || undefined,
          season: season || undefined,
          sort_by: sortBy,
          page,
          page_size: 25,
        });
        setData(res);
      } catch (err) {
        console.error('Failed to load transfers:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(loadHistorical, 200);
    return () => clearTimeout(timer);
  }, [marketMode, minFee, clubSearch, position, season, sortBy, page]);

  // Load Live 2026 RapidAPI Transfers
  useEffect(() => {
    if (marketMode !== 'live') return;

    async function loadLive() {
      setLiveLoading(true);
      try {
        const res = await api.football.getTransfers({
          type: liveType,
          page: livePage,
        });
        setLiveTransfers(res.transfers || []);
        setLiveHits(res.hits || res.transfers?.length || 0);
      } catch (err) {
        console.error('Failed to load live transfers:', err);
      } finally {
        setLiveLoading(false);
      }
    }

    loadLive();
  }, [marketMode, liveType, livePage]);

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292929] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="mono-font border border-[#10b981]/40 bg-[#10b981]/10 px-2 py-0.5 text-[10px] tracking-wider text-[#10b981]">
              LIVE RAPIDAPI INTELLIGENCE
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="mono-font text-[10px] text-sky-400">2026 ACTIVE MARKET</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Football Transfer Market Wire
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time verified transfers feed from Free Football Data RapidAPI, paired with historical database analytics.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center bg-[#151515] p-1 border border-[#2a2a2a] rounded-lg">
          <button
            onClick={() => setMarketMode('live')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              marketMode === 'live'
                ? 'bg-[#10b981] text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio size={14} className={marketMode === 'live' ? 'animate-pulse' : ''} />
            <span>Live 2026 Feed</span>
          </button>
          <button
            onClick={() => setMarketMode('database')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              marketMode === 'database'
                ? 'bg-sky-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders size={14} />
            <span>Historical Database</span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────── */}
      {/* 1. LIVE 2026 FEED SECTION                     */}
      {/* ────────────────────────────────────────────── */}
      {marketMode === 'live' && (
        <div className="space-y-6">
          {/* Subtabs for Live Feed */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111] p-3 border border-white/5 rounded-xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setLiveType('top');
                  setLivePage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  liveType === 'top'
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame size={13} className="text-amber-400" />
                <span>Top Transfers</span>
              </button>
              <button
                onClick={() => {
                  setLiveType('market_value');
                  setLivePage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  liveType === 'market_value'
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp size={13} className="text-emerald-400" />
                <span>By Market Value</span>
              </button>
              <button
                onClick={() => {
                  setLiveType('all');
                  setLivePage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  liveType === 'all'
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock size={13} className="text-sky-400" />
                <span>All Live Moves</span>
              </button>
            </div>

            <span className="text-xs text-slate-500 font-mono">
              {liveHits > 0 ? `${liveHits.toLocaleString()} verified entries` : 'Live RapidAPI Sync'}
            </span>
          </div>

          {/* Live Deals Table */}
          <div className="glass-card p-6 border border-white/5 space-y-4">
            {liveLoading ? (
              <TableSkeleton rows={10} />
            ) : liveTransfers.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <p className="font-semibold text-white">No live transfers currently found</p>
                <p className="text-xs mt-1">Please try refreshing or switching categories.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Position</th>
                        <th>From Club</th>
                        <th>To Club</th>
                        <th>Transfer Type</th>
                        <th>Fee / Terms</th>
                        <th>Estimated Value</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveTransfers.map((t, idx) => (
                        <tr key={`${t.playerId}-${t.transferDate}-${idx}`}>
                          <td className="font-bold text-white">
                            <div className="flex items-center gap-2">
                              {t.playerId && (
                                <img
                                  src={`https://images.fotmob.com/image_resources/playerimages/${t.playerId}.png`}
                                  alt={t.name}
                                  className="w-7 h-7 rounded-full bg-white/5 object-cover border border-white/10"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <span>{t.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-blue">
                              {t.position?.label || t.position?.key || 'Player'}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2 text-slate-300">
                              {t.fromClubId && (
                                <img
                                  src={`https://images.fotmob.com/image_resources/logo/teamlogo/${t.fromClubId}.png`}
                                  alt=""
                                  className="w-5 h-5 object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <span>{t.fromClub || t.fromClubFullName || 'Free Agent'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2 text-slate-200 font-semibold">
                              {t.toClubId && (
                                <img
                                  src={`https://images.fotmob.com/image_resources/logo/teamlogo/${t.toClubId}.png`}
                                  alt=""
                                  className="w-5 h-5 object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <span>{t.toClub || t.toClubFullName || 'Unattached'}</span>
                            </div>
                          </td>
                          <td>
                            {t.contractExtension ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Contract Extension
                              </span>
                            ) : t.onLoan ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Loan Deal
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                {t.transferType?.text || 'Transfer'}
                              </span>
                            )}
                          </td>
                          <td className="font-extrabold text-emerald-400">
                            {t.amountEuroEstimated
                              ? formatEUR(t.amountEuroEstimated)
                              : t.fee?.feeText || t.fee?.localizedFeeText || 'Free Transfer'}
                          </td>
                          <td className="text-slate-400 text-xs">
                            {t.marketValue ? formatEUR(t.marketValue) : '—'}
                          </td>
                          <td className="text-slate-400 text-xs whitespace-nowrap">
                            {t.transferDate ? formatDate(t.transferDate) : 'Recent'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs">
                  <span className="text-slate-400 font-mono">
                    Page <strong className="text-white">{livePage}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <UiverseButton
                      onClick={() => setLivePage((p) => Math.max(1, p - 1))}
                      disabled={livePage === 1 || liveLoading}
                      size="sm"
                      variant="default"
                    >
                      <ChevronLeft size={13} />
                      <span>Previous</span>
                    </UiverseButton>
                    <UiverseButton
                      onClick={() => setLivePage((p) => p + 1)}
                      disabled={liveTransfers.length < 20 || liveLoading}
                      size="sm"
                      variant="default"
                    >
                      <span>Next</span>
                      <ChevronRight size={13} />
                    </UiverseButton>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────── */}
      {/* 2. HISTORICAL DATABASE EXPLORER               */}
      {/* ────────────────────────────────────────────── */}
      {marketMode === 'database' && (
        <div className="space-y-6">
          {/* Filter Controls */}
          <div className="glass-card p-5 border border-white/5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Club search */}
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Club Filter</label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    size={14}
                  />
                  <input
                    type="text"
                    value={clubSearch}
                    onChange={(e) => {
                      setClubSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="e.g. Chelsea, Real Madrid"
                    className="input-base pl-8 text-xs w-full"
                  />
                </div>
              </div>

              {/* Position Filter */}
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Position</label>
                <select
                  value={position}
                  onChange={(e) => {
                    setPosition(e.target.value);
                    setPage(1);
                  }}
                  className="input-base text-xs w-full"
                >
                  <option value="">All Positions</option>
                  <option value="Attack">Attack</option>
                  <option value="Midfield">Midfield</option>
                  <option value="Defender">Defender</option>
                  <option value="Goalkeeper">Goalkeeper</option>
                </select>
              </div>

              {/* Min Fee Slider */}
              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Min Fee: {formatEUR(minFee)}
                </label>
                <input
                  type="range"
                  min={0}
                  max={100_000_000}
                  step={5_000_000}
                  value={minFee}
                  onChange={(e) => {
                    setMinFee(Number(e.target.value));
                    setPage(1);
                  }}
                  className="w-full accent-sky-400"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Sort Order</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-base text-xs w-full"
                >
                  <option value="fee_desc">Highest Fee First</option>
                  <option value="fee_asc">Lowest Fee First</option>
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Deals Table */}
          <div className="glass-card p-6 border border-white/5 space-y-4">
            {loading ? (
              <TableSkeleton rows={10} />
            ) : !data || data.transfers.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <p className="font-semibold text-white">No transfers match your criteria</p>
                <p className="text-xs mt-1">Try lowering the minimum fee or clearing the club filter.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Position</th>
                        <th>Nationality</th>
                        <th>From Club</th>
                        <th>To Club</th>
                        <th>Date</th>
                        <th>Season</th>
                        <th>Transfer Fee</th>
                        <th>Prior Market Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.transfers.map((t, idx) => (
                        <tr key={`${t.player_id}-${t.transfer_date || t.transfer_season}-${idx}`}>
                          <td className="font-bold text-white">
                            <Link
                              href={`/players/${t.player_id}`}
                              className="hover:text-sky-400 transition-colors"
                            >
                              {t.player_name}
                            </Link>
                          </td>
                          <td>
                            <span className="badge badge-blue">{t.position || 'N/A'}</span>
                          </td>
                          <td className="text-slate-300 text-xs">{t.nationality || 'N/A'}</td>
                          <td className="text-slate-300">{t.from_club_name}</td>
                          <td className="text-slate-200 font-semibold">{t.to_club_name}</td>
                          <td className="text-slate-400 text-xs">{formatDate(t.transfer_date)}</td>
                          <td className="text-slate-400 text-xs">{t.transfer_season}</td>
                          <td className="font-extrabold text-emerald-400">{formatEUR(t.transfer_fee)}</td>
                          <td className="text-slate-400 text-xs">
                            {t.market_value_before ? formatEUR(t.market_value_before) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs">
                  <span className="text-slate-400">
                    Page <strong className="text-white">{data.page}</strong> of{' '}
                    <strong className="text-white">{data.total_pages}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <UiverseButton
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                      size="sm"
                      variant="default"
                    >
                      <ChevronLeft size={13} />
                      <span>Previous</span>
                    </UiverseButton>
                    <UiverseButton
                      onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                      disabled={page >= data.total_pages || loading}
                      size="sm"
                      variant="default"
                    >
                      <span>Next</span>
                      <ChevronRight size={13} />
                    </UiverseButton>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
