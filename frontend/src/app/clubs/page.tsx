'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Landmark,
  TrendingUp,
  X,
  ExternalLink,
  ChevronRight,
  ArrowRightLeft,
  Calendar,
  Sparkles,
  Radio,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/api';
import { ClubsData } from '@/lib/types';
import { formatEUR, formatNumber } from '@/lib/format';
import { CardSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { UiverseButton } from '@/components/ui/UiverseButton';

const TOP_LEAGUES = [
  { id: 47, name: 'Premier League', ccode: 'ENG' },
  { id: 42, name: 'Champions League', ccode: 'INT' },
  { id: 87, name: 'LaLiga', ccode: 'ESP' },
  { id: 55, name: 'Serie A', ccode: 'ITA' },
  { id: 54, name: 'Bundesliga', ccode: 'GER' },
  { id: 53, name: 'Ligue 1', ccode: 'FRA' },
];

export default function ClubsPage() {
  const [data, setData] = useState<ClubsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Live Squads State
  const [selectedLeagueId, setSelectedLeagueId] = useState<number>(47);
  const [liveTeams, setLiveTeams] = useState<any[]>([]);
  const [teamsLoading, setTeamsLoading] = useState<boolean>(true);

  // Selected Club Squad Modal
  const [selectedClub, setSelectedClub] = useState<any | null>(null);
  const [clubSquad, setClubSquad] = useState<any[]>([]);
  const [clubTransfers, setClubTransfers] = useState<any[]>([]);
  const [clubDetailsLoading, setClubDetailsLoading] = useState<boolean>(false);
  const [clubModalTab, setClubModalTab] = useState<'squad' | 'transfers_in' | 'transfers_out' | 'extensions'>('squad');

  // Load Historical DB data
  useEffect(() => {
    async function loadClubs() {
      try {
        const res = await api.getClubs(20);
        setData(res);
      } catch (err) {
        console.error('Failed to load clubs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadClubs();
  }, []);

  // Load Live Teams by League
  useEffect(() => {
    async function loadLiveTeams() {
      setTeamsLoading(true);
      try {
        const res = await api.football.getTeams(selectedLeagueId);
        setLiveTeams(res.teams || []);
      } catch (err) {
        console.error('Failed to load league teams:', err);
      } finally {
        setTeamsLoading(false);
      }
    }
    loadLiveTeams();
  }, [selectedLeagueId]);

  // Open Club Squad Drawer/Modal
  const openClubDetails = async (team: any) => {
    setSelectedClub(team);
    setClubDetailsLoading(true);
    setClubModalTab('squad');

    try {
      const [squadRes, transInRes] = await Promise.all([
        api.football.getTeamPlayers(team.id).catch(() => ({ players: [] })),
        api.football.getTeamTransfers(team.id, 'in').catch(() => ({ transfers: [] })),
      ]);
      setClubSquad(squadRes.players || []);
      setClubTransfers(transInRes.transfers || []);
    } catch (err) {
      console.error('Failed to load squad details:', err);
    } finally {
      setClubDetailsLoading(false);
    }
  };

  const handleSwitchClubTab = async (tab: 'squad' | 'transfers_in' | 'transfers_out' | 'extensions') => {
    setClubModalTab(tab);
    if (!selectedClub) return;

    if (tab === 'squad') return;

    setClubDetailsLoading(true);
    try {
      const typeMap = {
        transfers_in: 'in',
        transfers_out: 'out',
        extensions: 'extensions',
      } as const;
      const res = await api.football.getTeamTransfers(selectedClub.id, typeMap[tab]);
      setClubTransfers(res.transfers || []);
    } catch (err) {
      console.error('Failed to fetch transfers:', err);
    } finally {
      setClubDetailsLoading(false);
    }
  };

  const stadiumChartData =
    data?.stadiums.slice(0, 10).map((s) => ({
      name: s.club_name.replace('Football Club', 'FC').replace('Club de Fútbol', 'CF'),
      seats: s.stadium_seats,
      stadium: s.stadium_name,
    })) || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292929] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="mono-font border border-[#10b981]/40 bg-[#10b981]/10 px-2 py-0.5 text-[10px] tracking-wider text-[#10b981]">
              LIVE RAPIDAPI INTELLIGENCE
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="mono-font text-[10px] text-sky-400">OFFICIAL SQUADS & ROSTERS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Clubs, Squads & Stadium Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Explore active 2026 club squad rosters, starting line-ups, and stadium valuations across European football.
          </p>
        </div>
      </div>

      {/* ────────────────────────────────────────────── */}
      {/* 1. LIVE CLUB SQUADS EXPLORER (RapidAPI)       */}
      {/* ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="text-emerald-400" size={18} />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Live European Club Squads
            </h2>
          </div>

          {/* League Selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#111] p-1 border border-white/5 rounded-lg">
            {TOP_LEAGUES.map((lg) => (
              <button
                key={lg.id}
                onClick={() => setSelectedLeagueId(lg.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedLeagueId === lg.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lg.name}
              </button>
            ))}
          </div>
        </div>

        {/* Club Grid */}
        {teamsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : liveTeams.length === 0 ? (
          <div className="glass-card p-10 text-center text-slate-400 border border-white/5">
            <p className="font-semibold text-white">No club data available for this competition.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {liveTeams.map((team) => (
              <div
                key={team.id}
                onClick={() => openClubDetails(team)}
                className="glass-card p-4 border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all cursor-pointer flex flex-col items-center text-center group"
              >
                <img
                  src={
                    team.logo ||
                    `https://images.fotmob.com/image_resources/logo/teamlogo/${team.id}.png`
                  }
                  alt={team.name}
                  className="w-12 h-12 object-contain mb-2.5 transition-transform group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.opacity = '0.3';
                  }}
                />
                <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-emerald-300">
                  {team.shortName || team.name}
                </h4>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <span>PTS: <strong className="text-white">{team.pts ?? '—'}</strong></span>
                  <span>•</span>
                  <span>PL: <strong className="text-white">{team.played ?? '—'}</strong></span>
                </div>
                <div className="mt-3 text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>View Squad</span>
                  <ChevronRight size={10} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────── */}
      {/* SQUAD DETAILS MODAL / DRAWER                  */}
      {/* ────────────────────────────────────────────── */}
      {selectedClub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#2a2a2a] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#242426] bg-[#161619]">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedClub.logo ||
                    `https://images.fotmob.com/image_resources/logo/teamlogo/${selectedClub.id}.png`
                  }
                  alt={selectedClub.name}
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedClub.name}</h3>
                    <span className="mono-font text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      OFFICIAL SQUAD
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    2026 Season Active Roster & Official Transfers
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedClub(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Subtabs */}
            <div className="flex items-center gap-2 px-5 pt-3 border-b border-[#242426] bg-[#141416] text-xs">
              <button
                onClick={() => handleSwitchClubTab('squad')}
                className={`pb-2.5 px-2 font-semibold transition-colors border-b-2 ${
                  clubModalTab === 'squad'
                    ? 'text-emerald-400 border-emerald-400'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                Squad Roster ({clubSquad.length})
              </button>
              <button
                onClick={() => handleSwitchClubTab('transfers_in')}
                className={`pb-2.5 px-2 font-semibold transition-colors border-b-2 ${
                  clubModalTab === 'transfers_in'
                    ? 'text-emerald-400 border-emerald-400'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                Arrivals
              </button>
              <button
                onClick={() => handleSwitchClubTab('transfers_out')}
                className={`pb-2.5 px-2 font-semibold transition-colors border-b-2 ${
                  clubModalTab === 'transfers_out'
                    ? 'text-emerald-400 border-emerald-400'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                Departures
              </button>
              <button
                onClick={() => handleSwitchClubTab('extensions')}
                className={`pb-2.5 px-2 font-semibold transition-colors border-b-2 ${
                  clubModalTab === 'extensions'
                    ? 'text-emerald-400 border-emerald-400'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                Renewals
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {clubDetailsLoading ? (
                <TableSkeleton rows={8} />
              ) : clubModalTab === 'squad' ? (
                clubSquad.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 text-xs">No roster entries found.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {clubSquad.map((player, idx) => (
                      <div
                        key={`${player.id}-${idx}`}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          {player.id ? (
                            <img
                              src={`https://images.fotmob.com/image_resources/playerimages/${player.id}.png`}
                              alt={player.name}
                              className="w-8 h-8 rounded-full bg-white/5 object-cover border border-white/10"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : null}
                          <div>
                            <p className="text-xs font-bold text-white">{player.name}</p>
                            <p className="text-[10px] text-slate-400 capitalize">
                              {player.role_group || player.role?.fallback || 'Player'}
                              {player.cname ? ` • ${player.cname}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          {player.shirtNumber ? (
                            <span className="mono-font text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              #{player.shirtNumber}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : clubTransfers.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-xs">No transactions recorded for this category.</p>
              ) : (
                <div className="space-y-2">
                  {clubTransfers.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Users size={14} className="text-sky-400" />
                        <div>
                          <p className="font-bold text-white">{t.name || 'Player'}</p>
                          <p className="text-[10px] text-slate-400">
                            {t.fromClub ? `From: ${t.fromClub}` : ''}
                            {t.toClub ? ` → To: ${t.toClub}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-mono text-emerald-400 font-bold">
                          {t.fee?.feeText || t.fee?.localizedFeeText || 'Contract'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {t.transferDate ? t.transferDate.split('T')[0] : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#242426] bg-[#141416] flex justify-end">
              <UiverseButton onClick={() => setSelectedClub(null)} size="sm">
                <span>Close</span>
              </UiverseButton>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────── */}
      {/* 2. HISTORICAL VALUATION & STADIUM CHARTS      */}
      {/* ────────────────────────────────────────────── */}
      <div className="pt-6 border-t border-[#292929] space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">
          Historical Valuation & Stadium Analytics
        </h3>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Squads Table */}
            <div className="glass-card p-6 border border-white/5 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-sky-400" size={18} />
                <h3 className="text-base font-bold text-white tracking-tight">Top 15 Most Valuable Squads</h3>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Club</th>
                      <th>Squad Valuation</th>
                      <th>Squad Size</th>
                      <th>Avg Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_squads.slice(0, 15).map((c, idx) => (
                      <tr key={c.club_id}>
                        <td className="font-bold text-sky-400">#{idx + 1}</td>
                        <td className="font-bold text-white">{c.name}</td>
                        <td className="font-extrabold text-emerald-400">{formatEUR(c.total_market_value)}</td>
                        <td className="text-slate-300">{c.squad_size} players</td>
                        <td className="text-slate-400 text-xs">{c.average_age ? `${c.average_age} yrs` : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Largest Stadiums Chart */}
            <div className="glass-card p-6 border border-white/5 space-y-4">
              <div className="flex items-center gap-2">
                <Landmark className="text-purple-400" size={18} />
                <h3 className="text-base font-bold text-white tracking-tight">Largest Stadium Capacities</h3>
              </div>

              <div className="h-[380px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stadiumChartData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                    <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={11} width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: any, item: any) => [
                        `${formatNumber(Number(val))} seats (${item.payload.stadium})`,
                        'Capacity',
                      ]}
                    />
                    <Bar dataKey="seats" fill="#818cf8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
