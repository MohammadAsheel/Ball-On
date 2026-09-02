'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ChevronDown,
  Grid2X2,
  List,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Activity,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { OverviewData, PlayerSearchItem } from '@/lib/types';
import { formatEUR } from '@/lib/format';
import { FaviconSearch } from '@/components/ui/FaviconSearch';
import { UiverseButton } from '@/components/ui/UiverseButton';

function Tuner({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">{label}</span>
        <span className="mono-font text-xs font-bold text-cyan-400">
          {value}
          {suffix}
        </span>
      </div>
      <input
        className="range-control"
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export default function OverviewPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [players, setPlayers] = useState<PlayerSearchItem[]>([]);
  const [age, setAge] = useState(24);
  const [goals, setGoals] = useState(18);
  const [assists, setAssists] = useState(8);
  const [minutes, setMinutes] = useState(2500);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [era, setEra] = useState('All Players');
  const [estimatedValue, setEstimatedValue] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getOverview().catch(() => null),
      api.getPlayersDirectory({ page_size: 8 }).catch(() => null),
    ]).then(([ov, pl]) => {
      if (ov) setOverview(ov);
      if (pl?.players?.length) setPlayers(pl.players);
    });
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (search.trim().length >= 2) {
        api.searchPlayers(search, 8).then((res) => {
          if (res?.players?.length) setPlayers(res.players);
        }).catch(() => null);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsEstimating(true);
      try {
        const res = await api.predictScenario({
          name: 'Custom Player',
          age,
          position: 'Attack',
          market_value_before: 25000000,
          prior_minutes: minutes,
          goals,
          assists,
          configuration: 'market_aware'
        }, { signal: controller.signal });
        setEstimatedValue(res.valuation.estimated_transfer_value);
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error(err);
      } finally {
        setIsEstimating(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [age, goals, assists, minutes]);

  const filtered = useMemo(() => {
    return players.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.current_club_name || '').toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (era === 'Active Stars') return (p.market_value_in_eur || 0) > 80_000_000;
      if (era === 'Historical Legends') return (p.age || 0) > 30;
      return true;
    });
  }, [players, search, era]);

  const title = overview?.transfer_intelligence?.highest_fee_player || 'Loading...';

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#101522]/90 to-[#0a0d14]/90 p-6 sm:p-10 backdrop-blur-2xl">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="editorial-kicker text-cyan-400 font-bold">
                Valuation Intelligence / 2026
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span className="mono-font text-[11px] text-emerald-400 font-semibold">
                MODEL V2.4 ACTIVE
              </span>
            </div>
            <h1 className="display-font text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.05]">
              The market, <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">measured</span> with precision.
            </h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
              Empowering clubs, analysts, and fans with AI-driven player valuation models, historical fee projections, and live market intelligence.
            </p>
          </div>

          <div className="flex items-center gap-6 shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.08] pt-6 lg:pt-0 lg:pl-8">
            <div>
              <p className="editorial-kicker text-slate-400">Tracked Entities</p>
              <p className="mono-font mt-1.5 text-2xl sm:text-3xl font-bold text-white">
                {overview?.kpis?.total_players ? overview.kpis.total_players.toLocaleString() : '...'}
                <span className="text-emerald-400 font-normal">+</span>
              </p>
            </div>
            <div className="metric-rule pl-6">
              <p className="editorial-kicker text-slate-400">Session Status</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 radar-dot" />
                <p className="mono-font text-xs font-bold text-emerald-400">MARKET OPEN</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Two-Column Terminal Sections */}
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Market Valuation Terminal Card */}
        <div className="terminal-card p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="editorial-kicker text-cyan-400">Real-time Valuation Index / 01</span>
                <h2 className="display-font mt-2 text-2xl sm:text-3xl font-bold text-white">{title}</h2>
                <p className="mt-1 text-xs text-slate-400">Forward · Primary Market Valuation Model</p>
              </div>
              <Link
                href="/estimator"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-300"
              >
                <ArrowUpRight size={16} />
              </Link>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="editorial-kicker text-slate-400">Algorithm Valuation</p>
                <p className="mono-font mt-2 text-4xl sm:text-5xl font-extrabold tracking-tight text-white line-clamp-1">
                  {estimatedValue !== null ? formatEUR(estimatedValue) : '...'}
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="mono-font inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                    <TrendingUp size={13} /> ESTIMATE
                  </span>
                  <span className="text-xs text-slate-400">
                    {isEstimating ? 'Calculating...' : 'Synced with Engine'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <p className="editorial-kicker text-slate-400">Prior Market</p>
                  <p className="mono-font mt-1.5 text-lg font-bold text-white">€25M</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <p className="editorial-kicker text-slate-400">Status</p>
                  <p className="mono-font mt-1.5 text-sm font-bold text-emerald-400">{isEstimating ? 'BUSY' : 'READY'}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <p className="editorial-kicker text-slate-400">Model Drift</p>
                  <p className="mono-font mt-1.5 text-lg font-bold text-cyan-400">LOW</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <p className="editorial-kicker text-slate-400">Data Quality</p>
                  <p className="mono-font mt-1.5 text-sm font-bold text-white">HIGH</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/[0.08] pt-6">
            {[
              ['AGE CURVE', `${age}Y`],
              ['MINUTES PLAYED', `${minutes}'`],
              ['GOALS / SEASON', goals],
              ['ASSISTS / SEASON', assists],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-lg bg-white/[0.02] p-2.5 border border-white/[0.04]">
                <p className="editorial-kicker text-slate-400 text-[9px]">{k}</p>
                <p className="mono-font mt-1 text-sm font-semibold text-slate-200">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Scenario Controls */}
        <div className="terminal-card p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="editorial-kicker text-amber-400">Scenario Simulation</span>
                <h2 className="display-font mt-2 text-2xl font-bold text-white">Estimator Tuner</h2>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles size={18} />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Tuner label="Age curve" value={age} min={16} max={40} suffix=" yrs" onChange={setAge} />
              <Tuner label="Minutes played" value={minutes} min={0} max={4000} suffix="'" onChange={setMinutes} />
              <Tuner label="Goals" value={goals} min={0} max={50} onChange={setGoals} />
              <Tuner label="Assists" value={assists} min={0} max={30} onChange={setAssists} />
            </div>
          </div>

          <div className="mt-8 border-t border-white/[0.08] pt-6">
            <div className="flex items-center justify-between text-xs mb-4">
              <span className="text-slate-400">Estimated Confidence Band</span>
              <span className="mono-font font-bold text-white">
                {estimatedValue ? `€${Math.round(estimatedValue / 1000000 - 3)}M — €${Math.round(estimatedValue / 1000000 + 4)}M` : '...'}
              </span>
            </div>
            <UiverseButton
              href="/estimator"
              variant="cyan"
              size="lg"
              className="w-full"
              containerClassName="w-full"
            >
              <span>Open Full Valuation Engine</span>
              <ArrowUpRight size={14} />
            </UiverseButton>
          </div>
        </div>
      </section>

      {/* Global Entity Catalog with NeonBorder */}
      <section className="terminal-card overflow-hidden">
        {/* Catalog Header */}
        <div className="flex flex-col gap-4 border-b border-white/[0.08] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="editorial-kicker text-cyan-400">Global Entity Index</span>
            <h2 className="display-font mt-1 text-2xl font-bold text-white">Market Leaders</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <UiverseButton
              size="xs"
              active={view === 'grid'}
              onClick={() => setView('grid')}
              aria-label="Grid view"
            >
              <Grid2X2 size={14} />
            </UiverseButton>
            <UiverseButton
              size="xs"
              active={view === 'table'}
              onClick={() => setView('table')}
              aria-label="Table view"
            >
              <List size={14} />
            </UiverseButton>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col gap-3 border-b border-white/[0.08] p-4 lg:flex-row lg:items-center">
          <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {['All Players', 'Active Stars', 'Historical Legends'].map((item) => (
              <UiverseButton
                key={item}
                size="sm"
                active={era === item}
                onClick={() => setEra(item)}
              >
                {item}
              </UiverseButton>
            ))}
          </div>

          <div className="lg:ml-auto lg:w-72">
            <FaviconSearch
              value={search}
              onChange={(val) => setSearch(val)}
              placeholder="Filter catalog…"
              clearable={true}
              className="w-full"
              inputClassName="py-2 pl-[46px] text-xs rounded-xl border-white/[0.1] bg-[#0c1018]"
            />
          </div>
        </div>

        {/* Grid or Table View */}
        {players.length === 0 ? (
           <div className="py-20 text-center text-slate-400">
             <p className="font-semibold text-white">Loading database or no players found...</p>
           </div>
        ) : view === 'grid' ? (
          <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
            {filtered.slice(0, 4).map((player, i) => (
              <Link
                href={`/players/${player.player_id}`}
                key={player.player_id}
                className="group relative flex flex-col justify-between p-5 bg-[#0e121a]/85 backdrop-blur-xl rounded-2xl border border-white/[0.08] hover:border-cyan-500/35 hover:bg-[#131824] hover:shadow-[0_8px_30px_rgba(0,242,254,0.1)] transition-all duration-300 overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="display-font flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] text-base font-bold text-white shadow-inner">
                      {player.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <span className="mono-font rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      0{i + 1}
                    </span>
                  </div>

                  <h3 className="display-font mt-4 text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {player.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-1">
                    {player.current_club_name || 'Free Agent'} · {player.position}
                  </p>
                </div>

                <div className="relative z-10 mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3.5">
                  <span className="editorial-kicker text-[9px] text-slate-400">Market Value</span>
                  <span className="mono-font text-sm font-bold text-emerald-400">
                    {player.market_value_in_eur ? formatEUR(player.market_value_in_eur) : 'N/A'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[740px]">
              <thead>
                <tr>
                  <th>Entity</th>
                  <th>Club / Position</th>
                  <th>Age</th>
                  <th>Market Value</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.player_id} className="table-row">
                    <td className="display-font text-sm font-bold text-white">{p.name}</td>
                    <td className="text-xs text-slate-400">
                      {p.current_club_name} · {p.position}
                    </td>
                    <td className="mono-font text-xs text-slate-400">{p.age || '—'}</td>
                    <td className="mono-font text-xs font-bold text-emerald-400">
                      {p.market_value_in_eur ? formatEUR(p.market_value_in_eur) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Catalog Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-4">
          <span className="mono-font text-[11px] text-slate-500">
            DISPLAYING {Math.min(filtered.length, 4)} RESULTS
          </span>
          <UiverseButton
            href="/players"
            variant="cyan"
            size="sm"
          >
            <span>View all players</span>
            <ArrowUpRight size={13} />
          </UiverseButton>
        </div>
      </section>

      {/* Historical Matrix & Context Grid */}
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="terminal-card p-6 sm:p-8">
          <span className="editorial-kicker text-amber-400">Historical Telemetry</span>
          <h2 className="display-font mt-2 text-2xl font-bold text-white">Market Distribution</h2>
          <div className="mt-8 flex h-32 items-end gap-2.5">
            {[28, 43, 36, 62, 48, 78, 55, 92, 68, 74, 99, 83].map((height, i) => (
              <div key={i} className="flex-1 rounded-t-lg bg-white/[0.05] overflow-hidden" style={{ height: `${height}%` }}>
                <div
                  className="h-full bg-gradient-to-t from-amber-500 to-amber-300 transition-all rounded-t-lg"
                  style={{ height: `${Math.max(10, height - 30)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between mono-font text-[11px] text-slate-500">
            <span>2016</span>
            <span>2020</span>
            <span>2024</span>
            <span>2026</span>
          </div>
        </div>

        <div className="terminal-card p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="editorial-kicker text-cyan-400">Comparison Matrix</span>
                <h2 className="display-font mt-2 text-2xl font-bold text-white">Edge Vector Analysis</h2>
              </div>
              <UiverseButton href="/compare" variant="default" size="xs">
                <span>Open Matrix</span>
                <ArrowUpRight size={12} />
              </UiverseButton>
            </div>

            <div className="mt-6 space-y-4">
              {[
                ['Attack output', 86, 73],
                ['Value efficiency', 76, 85],
                ['Squad availability', 91, 67],
                ['Age curve trajectory', 88, 79],
              ].map(([label, a, b]) => (
                <div key={String(label)} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{label}</span>
                    <span className="mono-font text-slate-400">
                      Entity A <b className="text-cyan-400">{a}</b> / Entity B <b className="text-amber-400">{b}</b>
                    </span>
                  </div>
                  <div className="flex h-2 gap-1.5 rounded-full bg-white/[0.05] p-0.5">
                    <div className="rounded-full bg-cyan-400" style={{ width: `${Number(a) / 2}%` }} />
                    <div className="rounded-full bg-amber-400" style={{ width: `${Number(b) / 2}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
