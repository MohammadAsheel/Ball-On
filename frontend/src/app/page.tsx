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

const samplePlayers: PlayerSearchItem[] = [
  { player_id: 1, name: 'Kylian Mbappé', current_club_name: 'Real Madrid', position: 'Attack', sub_position: null, date_of_birth: null, age: 27, country_of_citizenship: 'France', market_value_in_eur: 180000000, image_url: null },
  { player_id: 2, name: 'Erling Haaland', current_club_name: 'Manchester City', position: 'Attack', sub_position: null, date_of_birth: null, age: 26, country_of_citizenship: 'Norway', market_value_in_eur: 175000000, image_url: null },
  { player_id: 3, name: 'Jude Bellingham', current_club_name: 'Real Madrid', position: 'Midfield', sub_position: null, date_of_birth: null, age: 23, country_of_citizenship: 'England', market_value_in_eur: 160000000, image_url: null },
  { player_id: 4, name: 'Lamine Yamal', current_club_name: 'FC Barcelona', position: 'Attack', sub_position: null, date_of_birth: null, age: 19, country_of_citizenship: 'Spain', market_value_in_eur: 150000000, image_url: null },
];

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
  const [players, setPlayers] = useState<PlayerSearchItem[]>(samplePlayers);
  const [age, setAge] = useState(24);
  const [goals, setGoals] = useState(18);
  const [league, setLeague] = useState(82);
  const [risk, setRisk] = useState(12);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [era, setEra] = useState('All Players');

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

  const value = useMemo(
    () =>
      Math.max(
        5,
        Math.round(
          125 +
            (goals - 18) * 2.2 -
            Math.max(0, age - 24) * 5.5 +
            (league - 82) * 0.7 -
            risk * 0.8
        )
      ),
    [age, goals, league, risk]
  );

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

  const title = overview?.transfer_intelligence?.highest_fee_player || 'Kylian Mbappé';

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
                {(overview?.kpis?.total_players || 50000).toLocaleString()}
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
                <p className="mono-font mt-2 text-5xl sm:text-6xl font-extrabold tracking-tight text-white">
                  €{value}
                  <span className="ml-1 text-2xl font-semibold text-slate-500">M</span>
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="mono-font inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                    <TrendingUp size={13} /> +12.8% EDGE
                  </span>
                  <span className="text-xs text-slate-400">vs market baseline</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <p className="editorial-kicker text-slate-400">Market Value</p>
                  <p className="mono-font mt-1.5 text-lg font-bold text-white">€{Math.round(value * 0.88)}M</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <p className="editorial-kicker text-slate-400">Confidence</p>
                  <p className="mono-font mt-1.5 text-lg font-bold text-emerald-400">91.4%</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <p className="editorial-kicker text-slate-400">Model Drift</p>
                  <p className="mono-font mt-1.5 text-lg font-bold text-cyan-400">LOW</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <p className="editorial-kicker text-slate-400">Sample Depth</p>
                  <p className="mono-font mt-1.5 text-lg font-bold text-white">2,481</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/[0.08] pt-6">
            {[
              ['GOALS / SEASON', goals],
              ['AGE CURVE', `${age}Y`],
              ['CONTRACT LEFT', '3.8Y'],
              ['LEAGUE COEFF', `${league}/100`],
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
              <Tuner label="Age curve" value={age} min={17} max={36} suffix=" yrs" onChange={setAge} />
              <Tuner label="Goals / season" value={goals} min={0} max={45} onChange={setGoals} />
              <Tuner label="League coefficient" value={league} min={40} max={100} suffix=" /100" onChange={setLeague} />
              <Tuner label="Injury risk index" value={risk} min={0} max={50} suffix="%" onChange={setRisk} />
            </div>
          </div>

          <div className="mt-8 border-t border-white/[0.08] pt-6">
            <div className="flex items-center justify-between text-xs mb-4">
              <span className="text-slate-400">Estimated Confidence Band</span>
              <span className="mono-font font-bold text-white">
                €{value - 9}M — €{value + 12}M
              </span>
            </div>
            <Link
              href="/estimator"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold text-[#080808] transition hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(0,242,254,0.3)]"
            >
              Open Full Valuation Engine <ArrowUpRight size={14} />
            </Link>
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('grid')}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                view === 'grid'
                  ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300'
                  : 'border-white/[0.1] text-slate-400 hover:text-white'
              }`}
            >
              <Grid2X2 size={16} />
            </button>
            <button
              onClick={() => setView('table')}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                view === 'table'
                  ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300'
                  : 'border-white/[0.1] text-slate-400 hover:text-white'
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col gap-3 border-b border-white/[0.08] p-4 lg:flex-row lg:items-center">
          <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {['All Players', 'Active Stars', 'Historical Legends'].map((item) => (
              <button
                key={item}
                onClick={() => setEra(item)}
                className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  era === item
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="relative lg:ml-auto lg:w-72">
            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/[0.1] bg-[#0c1018] py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500"
              placeholder="Filter catalog…"
            />
          </div>
        </div>

        {/* Grid or Table View */}
        {view === 'grid' ? (
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

                  <div className="mt-4 grid grid-cols-3 rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-center">
                    <div>
                      <p className="editorial-kicker text-[9px] text-slate-400">APP</p>
                      <p className="mono-font mt-0.5 text-xs font-bold text-slate-200">{28 + i}</p>
                    </div>
                    <div className="border-x border-white/[0.06]">
                      <p className="editorial-kicker text-[9px] text-slate-400">GOALS</p>
                      <p className="mono-font mt-0.5 text-xs font-bold text-slate-200">{18 - i * 2}</p>
                    </div>
                    <div>
                      <p className="editorial-kicker text-[9px] text-slate-400">ASSISTS</p>
                      <p className="mono-font mt-0.5 text-xs font-bold text-slate-200">{7 + i}</p>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3.5">
                  <span className="editorial-kicker text-[9px] text-slate-400">Market Value</span>
                  <span className="mono-font text-sm font-bold text-emerald-400">
                    {formatEUR(player.market_value_in_eur)}
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
                  <th>Model Estimate</th>
                  <th>Signal</th>
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
                      {formatEUR(p.market_value_in_eur)}
                    </td>
                    <td className="mono-font text-xs font-semibold text-slate-200">
                      {formatEUR((p.market_value_in_eur || 0) * (1.06 + i / 100))}
                    </td>
                    <td>
                      <span className="mono-font rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        BULLISH
                      </span>
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
            DISPLAYING 1—{Math.min(4, filtered.length)} /{' '}
            {overview?.kpis?.total_players?.toLocaleString() || '50,000+'}
          </span>
          <Link
            href="/players"
            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:underline"
          >
            View all players →
          </Link>
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
              <Link href="/compare" className="text-xs font-semibold text-cyan-400 hover:underline">
                Open Matrix →
              </Link>
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
