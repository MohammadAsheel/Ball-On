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
} from 'lucide-react';
import { api } from '@/lib/api';
import { TransfersResponse } from '@/lib/types';
import { formatEUR, formatDate } from '@/lib/format';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { FaviconSearch } from '@/components/ui/FaviconSearch';

export default function TransfersPage() {
  const [data, setData] = useState<TransfersResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [minFee, setMinFee] = useState<number>(5_000_000);
  const [clubSearch, setClubSearch] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [season, setSeason] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('fee_desc');
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    async function loadTransfers() {
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

    const timer = setTimeout(loadTransfers, 200);
    return () => clearTimeout(timer);
  }, [minFee, clubSearch, position, season, sortBy, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Transfer Market</h1>
          <p className="text-sm text-slate-400 mt-1">
            Search, filter, and analyze historical transfer deals.
          </p>
        </div>
        {data && (
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            {data.total.toLocaleString()} deals
          </span>
        )}
      </div>

      {/* Filter Controls */}
      <div className="glass-card p-5 border border-white/5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Club search */}
          <div>
            <label className="text-slate-400 font-semibold block mb-1">Club Filter</label>
            <FaviconSearch
              placeholder="Search club (e.g. Real Madrid, Arsenal)..."
              value={clubSearch}
              onChange={(val) => {
                setClubSearch(val);
                setPage(1);
              }}
              clearable={true}
              className="w-full"
              inputClassName="py-2 pl-[46px] text-xs rounded-lg bg-slate-950 border-slate-700"
            />
          </div>

          {/* Position */}
          <div>
            <label className="text-slate-400 font-semibold block mb-1">Position</label>
            <select
              value={position}
              onChange={(e) => {
                setPosition(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
            >
              <option value="">All Positions</option>
              <option value="Attack">Attack</option>
              <option value="Midfield">Midfield</option>
              <option value="Defender">Defender</option>
              <option value="Goalkeeper">Goalkeeper</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-slate-400 font-semibold block mb-1">Sort Order</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
            >
              <option value="fee_desc">Highest Fee First</option>
              <option value="fee_asc">Lowest Fee First</option>
              <option value="date_desc">Most Recent Date</option>
              <option value="date_asc">Oldest Date</option>
            </select>
          </div>

          {/* Minimum Fee Slider */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400 font-semibold">Min Fee</span>
              <span className="text-emerald-400 font-bold">{formatEUR(minFee)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={50_000_000}
              step={1_000_000}
              value={minFee}
              onChange={(e) => {
                setMinFee(Number(e.target.value));
                setPage(1);
              }}
              className="w-full accent-emerald-400 mt-1.5"
            />
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
                Page <strong className="text-white">{data.page}</strong> of <strong className="text-white">{data.total_pages}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="btn-secondary py-1.5 px-3 disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                  disabled={page >= data.total_pages || loading}
                  className="btn-secondary py-1.5 px-3 disabled:opacity-40 flex items-center gap-1"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
