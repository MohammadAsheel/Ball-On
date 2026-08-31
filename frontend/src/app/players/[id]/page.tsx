'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  User,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowRight,
  Shield,
  Calendar,
  Sparkles,
  Calculator,
  Trophy,
  Award,
  ExternalLink,
  RefreshCw,
  Globe,
  Briefcase,
  Shirt,
  CheckCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/api';
import {
  PlayerProfile,
  PlayerEstimatorResult,
  TransfermarktProfile,
} from '@/lib/types';
import { formatEUR, formatDate, formatNumber } from '@/lib/format';
import { CardSkeleton, TableSkeleton } from '@/components/ui/Skeleton';

export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [estimate, setEstimate] = useState<PlayerEstimatorResult | null>(null);
  const [tmData, setTmData] = useState<TransfermarktProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tmLoading, setTmLoading] = useState(false);
  const [tmSyncing, setTmSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTmProfile = async (refresh = false) => {
    if (refresh) setTmSyncing(true);
    else setTmLoading(true);
    try {
      const res = await api.getPlayerTransfermarktLive(id, refresh);
      if (res?.data) {
        setTmData(res.data);
      }
    } catch (e) {
      console.error('Failed to load Transfermarkt intelligence:', e);
    } finally {
      setTmLoading(false);
      setTmSyncing(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [profData, estData] = await Promise.all([
          api.getPlayerProfile(id),
          api.estimatePlayer(id).catch(() => null),
        ]);
        setProfile(profData);
        setEstimate(estData);

        // Load Transfermarkt Live data
        loadTmProfile(false);
      } catch (err: any) {
        setError(err.message || 'Player not found');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="glass-card text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-white">Player Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'No records available for this ID.'}</p>
        <Link href="/players" className="btn-secondary py-2 px-4 inline-flex items-center gap-1.5 text-xs">
          <ArrowLeft size={14} /> Back to Players Directory
        </Link>
      </div>
    );
  }

  const { player, latest_transfer, season_stats, valuations, transfers, career_stats } = profile;

  // Valuation Area Chart data
  const valChartData = valuations.map((v) => ({
    date: v.date,
    valueMillions: Math.round(v.market_value_in_eur / 1_000_000),
    club: v.current_club_name || 'Club',
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* Back button */}
      <Link href="/players" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={14} /> Back to Players
      </Link>

      {/* 1. PLAYER HEADER */}
      <div className="glass-card p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 overflow-hidden shrink-0 shadow-xl">
            {player.image_url ? (
              <img src={player.image_url} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <User size={36} />
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{player.name}</h1>
              {player.position && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {player.position}
                </span>
              )}
              {tmData?.jersey_number && (
                <span className="mono-font text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  #{tmData.jersey_number}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-300">
              {tmData?.current_club || player.current_club_name || 'Free Agent'}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
              <span>Age: <strong className="text-slate-200">{tmData?.age || player.age || 'N/A'}</strong></span>
              <span>•</span>
              <span>Nationality: <strong className="text-slate-200">{tmData?.citizenship || player.country_of_citizenship || 'N/A'}</strong></span>
              <span>•</span>
              <span>Height: <strong className="text-slate-200">{tmData?.height || (player.height_in_cm ? `${player.height_in_cm} cm` : 'N/A')}</strong></span>
              <span>•</span>
              <span>Foot: <strong className="text-slate-200">{tmData?.foot || player.foot || 'N/A'}</strong></span>
            </div>
          </div>
        </div>

        {/* Quick Estimator CTA */}
        <Link
          href={`/estimator?player_id=${player.player_id}`}
          className="btn-primary py-2 px-4 text-xs flex items-center gap-2 shrink-0"
        >
          <Calculator size={16} /> Run Valuation Engine
        </Link>
      </div>

      {/* 2. TRANSFERMARKT LIVE INTELLIGENCE CABINET */}
      <div className="glass-card p-6 border border-white/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Trophy size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Transfermarkt Verified Intelligence</h2>
                <span className="mono-font text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                  <CheckCircle size={10} /> VERIFIED API
                </span>
              </div>
              <p className="text-xs text-slate-400">Live trophy cabinet, contract terms, outfitter sponsorships, and representation.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {tmData?.profile_url && (
              <a
                href={tmData.profile_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition"
              >
                <span>View on Transfermarkt</span>
                <ExternalLink size={12} />
              </a>
            )}

            <button
              onClick={() => loadTmProfile(true)}
              disabled={tmSyncing}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw size={12} className={tmSyncing ? 'animate-spin text-sky-400' : ''} />
              <span>{tmSyncing ? 'Scraping Live...' : 'Sync Live'}</span>
            </button>
          </div>
        </div>

        {tmLoading && !tmData ? (
          <div className="py-6 text-center text-xs text-slate-400">
            <RefreshCw size={18} className="animate-spin text-sky-400 mx-auto mb-2" />
            Connecting to Transfermarkt API...
          </div>
        ) : tmData ? (
          <div className="space-y-6">
            {/* Trophies & Honors Section */}
            {tmData.trophies && tmData.trophies.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={14} /> Career Trophies & Major Honors ({tmData.trophies.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {tmData.trophies.map((t, idx) => (
                    <div
                      key={`${t.trophy}-${idx}`}
                      className="p-3 rounded-xl bg-slate-900/70 border border-amber-500/20 flex items-center gap-2.5 hover:border-amber-500/40 transition"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 shrink-0 font-bold text-xs mono-font">
                        {t.count}x
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{t.trophy}</p>
                        <p className="text-[10px] text-slate-400">{t.count} Career Title{t.count > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contract, Agent, & Outfitter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Agent */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <Briefcase size={13} className="text-sky-400" />
                  <span>Agent / Representation</span>
                </div>
                <p className="text-sm font-bold text-white pt-0.5">
                  {tmData.agent || player.agent_name || 'Relatives / None'}
                </p>
                <p className="text-[10px] text-slate-500">Official player management</p>
              </div>

              {/* Outfitter */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <Shirt size={13} className="text-amber-400" />
                  <span>Outfitter / Sponsor</span>
                </div>
                <p className="text-sm font-bold text-white pt-0.5">
                  {tmData.outfitter || 'Not specified'}
                </p>
                <p className="text-[10px] text-slate-500">Primary boot & kit sponsor</p>
              </div>

              {/* Contract Expiry */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <Calendar size={13} className="text-emerald-400" />
                  <span>Contract Expiry</span>
                </div>
                <p className="text-sm font-bold text-emerald-400 pt-0.5">
                  {tmData.contract_end || 'N/A'}
                </p>
                <p className="text-[10px] text-slate-500">
                  Joined: {tmData.arrival_date || 'N/A'}
                </p>
              </div>

              {/* Social Channels */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <Globe size={13} className="text-indigo-400" />
                  <span>Verified Channels</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {tmData.social_media && tmData.social_media.length > 0 ? (
                    tmData.social_media.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-sky-400 border border-white/10 transition"
                      >
                        {s.type || 'Web'}
                      </a>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">None linked</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">Official verified presence</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900/40 border border-dashed border-white/10 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Transfermarkt live honors and contract details are ready to be fetched for this player.
            </p>
            <button
              onClick={() => loadTmProfile(true)}
              disabled={tmSyncing}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw size={12} className={tmSyncing ? 'animate-spin text-sky-400' : ''} />
              <span>Fetch Live from Transfermarkt</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. TRANSFER VALUATION COMPARISON GRID */}
      <div className="glass-card p-6 border border-white/5 space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="text-emerald-400" size={18} />
          <h2 className="text-base font-bold text-white tracking-tight">Transfer Valuation Intelligence</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Model Estimated Value */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-sky-500/20 space-y-1">
            <p className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Model Estimated Value</p>
            <p className="text-2xl font-black text-sky-300">
              {estimate ? formatEUR(estimate.valuation.estimated_transfer_value) : 'Calculating...'}
            </p>
            <p className="text-[10px] text-slate-400">BALLON Log-Target Ridge Regression</p>
          </div>

          {/* Actual Transfer Fee */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actual Transfer Fee</p>
            <p className="text-2xl font-black text-emerald-400">
              {latest_transfer ? formatEUR(latest_transfer.transfer_fee) : 'Not available'}
            </p>
            <p className="text-[10px] text-slate-400">
              {latest_transfer ? `Paid by ${latest_transfer.to_club_name}` : 'No paid deal recorded'}
            </p>
          </div>

          {/* Market Value */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Market Value</p>
            <p className="text-2xl font-black text-white">
              {tmData?.market_value || (player.market_value_in_eur ? formatEUR(player.market_value_in_eur) : 'Not available')}
            </p>
            <p className="text-[10px] text-slate-400">
              Peak: {player.highest_market_value_in_eur ? formatEUR(player.highest_market_value_in_eur) : 'N/A'}
            </p>
          </div>

          {/* Difference */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Valuation Delta</p>
            {estimate?.valuation.diff_vs_actual !== null && estimate?.valuation.diff_vs_actual !== undefined ? (
              <>
                <p className={`text-2xl font-black ${estimate.valuation.diff_vs_actual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {estimate.valuation.diff_vs_actual >= 0 ? '+' : ''}{formatEUR(estimate.valuation.diff_vs_actual)}
                </p>
                <p className="text-[10px] text-slate-400">
                  {estimate.valuation.diff_vs_actual_pct}% vs actual fee
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black text-slate-400">Not available</p>
                <p className="text-[10px] text-slate-500">Requires paid transfer record</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4. PERFORMANCE BREAKDOWN */}
      <div className="glass-card p-6 border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-sky-400" size={18} />
            <h2 className="text-base font-bold text-white tracking-tight">Season-by-Season Performance</h2>
          </div>
          <div className="text-xs text-slate-400 font-semibold">
            Career: {career_stats.total_matches} Apps • {career_stats.total_goals} Goals • {career_stats.total_assists} Assists
          </div>
        </div>

        {season_stats.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table>
              <thead>
                <tr>
                  <th>Season</th>
                  <th>Appearances</th>
                  <th>Minutes</th>
                  <th>Goals</th>
                  <th>Assists</th>
                  <th>Goals / 90</th>
                  <th>Assists / 90</th>
                  <th>Yellow / Red</th>
                </tr>
              </thead>
              <tbody>
                {season_stats.map((s, idx) => (
                  <tr key={`${s.season}-${idx}`}>
                    <td className="font-bold text-sky-400">{s.season}/{Number(s.season) + 1}</td>
                    <td className="font-semibold text-white">{s.appearances}</td>
                    <td className="text-slate-300">{formatNumber(s.minutes)}'</td>
                    <td className="font-bold text-emerald-400">{s.goals}</td>
                    <td className="font-bold text-indigo-400">{s.assists}</td>
                    <td className="text-slate-300">{s.goals_per_90}</td>
                    <td className="text-slate-300">{s.assists_per_90}</td>
                    <td className="text-slate-400 text-xs">{s.yellow_cards} 🟨 / {s.red_cards} 🟥</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-6 text-center">No detailed match performance logged.</p>
        )}
      </div>

      {/* 5. VALUATION CURVE & TRANSFER HISTORY TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Value History Chart */}
        <div className="glass-card p-6 border border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-sky-400" size={18} />
            <h3 className="text-base font-bold text-white tracking-tight">Market Valuation Trajectory</h3>
          </div>

          {valChartData.length > 0 ? (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={valChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `€${v}M`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`€${val} Million`, 'Valuation']}
                  />
                  <Area type="monotone" dataKey="valueMillions" stroke="#38bdf8" strokeWidth={2.5} fillOpacity={1} fill="url(#valGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-10 text-center">No valuation history recorded.</p>
          )}
        </div>

        {/* Transfer Timeline */}
        <div className="glass-card p-6 border border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-purple-400" size={18} />
            <h3 className="text-base font-bold text-white tracking-tight">Career Transfer Timeline</h3>
          </div>

          {transfers.length > 0 ? (
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {transfers.map((t, idx) => (
                <div
                  key={`${t.transfer_date || t.transfer_season}-${t.to_club_name}-${idx}`}
                  className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{formatDate(t.transfer_date)} ({t.transfer_season})</span>
                    <span className="font-bold text-emerald-400">
                      {t.transfer_fee ? formatEUR(t.transfer_fee) : 'Free / Loan'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white">
                    <span className="text-slate-400">{t.from_club_name}</span>
                    <ArrowRight size={12} className="text-sky-400 shrink-0" />
                    <span className="font-semibold text-sky-300">{t.to_club_name}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-10 text-center">No transfer records found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
