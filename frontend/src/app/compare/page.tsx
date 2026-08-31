'use client';

import React, { useState, useEffect } from 'react';
import { GitCompare, Search, User, X, Plus, Activity } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '@/lib/api';
import { ComparedPlayer, PlayerSearchItem } from '@/lib/types';
import { formatEUR, formatNumber } from '@/lib/format';

export default function PlayerComparisonPage() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [comparedPlayers, setComparedPlayers] = useState<ComparedPlayer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlayerSearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize with 2 top players if empty
  useEffect(() => {
    async function initComparison() {
      try {
        const res = await api.searchPlayers('Mbapp', 1);
        const res2 = await api.searchPlayers('Bellingham', 1);
        const ids: number[] = [];
        if (res.players.length > 0) ids.push(res.players[0].player_id);
        if (res2.players.length > 0) ids.push(res2.players[0].player_id);
        setSelectedIds(ids);
      } catch (err) {
        console.error('Failed to init comparison:', err);
      }
    }
    initComparison();
  }, []);

  // Fetch comparison vector whenever selected IDs change
  useEffect(() => {
    if (selectedIds.length === 0) {
      setComparedPlayers([]);
      return;
    }
    async function loadComparison() {
      setLoading(true);
      try {
        const res = await api.comparePlayers(selectedIds);
        setComparedPlayers(res.players);
      } catch (err) {
        console.error('Failed to load comparison data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadComparison();
  }, [selectedIds]);

  // Search debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.searchPlayers(searchQuery, 5);
        setSearchResults(res.players);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addPlayer = (playerId: number) => {
    if (selectedIds.includes(playerId) || selectedIds.length >= 4) return;
    setSelectedIds([...selectedIds, playerId]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removePlayer = (playerId: number) => {
    setSelectedIds(selectedIds.filter((id) => id !== playerId));
  };

  // Prepare chart comparison data
  const chartData = [
    {
      metric: 'Goals/90',
      ...comparedPlayers.reduce((acc, p) => ({ ...acc, [p.name]: p.stats.goals_per_90 }), {}),
    },
    {
      metric: 'Assists/90',
      ...comparedPlayers.reduce((acc, p) => ({ ...acc, [p.name]: p.stats.assists_per_90 }), {}),
    },
  ];

  const colors = ['#38bdf8', '#818cf8', '#34d399', '#f472b6'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Player Comparison</h1>
        <p className="text-sm text-slate-400 mt-1">
          Compare up to 4 players on performance metrics and market valuations.
        </p>
      </div>

      {/* Add Player Search */}
      {selectedIds.length < 4 && (
        <div className="glass-card p-4 border border-white/5 relative max-w-xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Search player to add to comparison (e.g. Saka, Vinícius Jr., Haaland)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
            />
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          </div>

          {searchResults.length > 0 && (
            <div className="absolute left-4 right-4 top-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-white/5">
              {searchResults.map((p) => (
                <button
                  key={p.player_id}
                  onClick={() => addPlayer(p.player_id)}
                  disabled={selectedIds.includes(p.player_id)}
                  className="w-full p-2.5 flex items-center justify-between text-left hover:bg-sky-500/10 transition-colors disabled:opacity-40"
                >
                  <span className="text-xs font-bold text-white">{p.name} ({p.current_club_name})</span>
                  <span className="text-xs text-emerald-400 font-semibold">{p.market_value_in_eur ? formatEUR(p.market_value_in_eur) : 'N/A'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comparison Cards & Table */}
      {comparedPlayers.length > 0 ? (
        <div className="space-y-6">
          {/* Top Player Header Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {comparedPlayers.map((p, idx) => (
              <div
                key={p.player_id}
                className="glass-card p-5 border border-white/5 relative flex flex-col justify-between"
                style={{ borderTop: `3px solid ${colors[idx % colors.length]}` }}
              >
                <button
                  onClick={() => removePlayer(p.player_id)}
                  className="absolute top-3 right-3 text-slate-500 hover:text-rose-400"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={22} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{p.name}</h3>
                    <p className="text-xs text-slate-400">{p.current_club_name}</p>
                    <span className="badge badge-blue mt-1">{p.position}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 mt-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Market Value:</span>
                    <span className="font-bold text-emerald-400">{formatEUR(p.market_value_in_eur)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Age:</span>
                    <span className="font-semibold text-white">{p.age} yrs</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Metric Comparison Matrix */}
          <div className="glass-card p-6 border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight">Metric Benchmarks</h3>

            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    {comparedPlayers.map((p) => (
                      <th key={p.player_id} className="text-center">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold text-slate-300">Position</td>
                    {comparedPlayers.map((p) => (
                      <td key={p.player_id} className="text-center font-semibold text-sky-400">{p.position}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-300">Age</td>
                    {comparedPlayers.map((p) => (
                      <td key={p.player_id} className="text-center text-white">{p.age} yrs</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-300">Career Matches Tracked</td>
                    {comparedPlayers.map((p) => (
                      <td key={p.player_id} className="text-center text-slate-200">{p.stats.total_matches}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-300">Career Minutes</td>
                    {comparedPlayers.map((p) => (
                      <td key={p.player_id} className="text-center text-slate-200">{formatNumber(p.stats.total_minutes)}'</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-300">Career Goals</td>
                    {comparedPlayers.map((p) => (
                      <td key={p.player_id} className="text-center font-bold text-emerald-400">{p.stats.total_goals}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-300">Career Assists</td>
                    {comparedPlayers.map((p) => (
                      <td key={p.player_id} className="text-center font-bold text-indigo-400">{p.stats.total_assists}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-300">Goals / 90 Minutes</td>
                    {comparedPlayers.map((p) => (
                      <td key={p.player_id} className="text-center font-bold text-emerald-300">{p.stats.goals_per_90}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-300">Assists / 90 Minutes</td>
                    {comparedPlayers.map((p) => (
                      <td key={p.player_id} className="text-center font-bold text-indigo-300">{p.stats.assists_per_90}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Productivity Chart */}
          <div className="glass-card p-6 border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight">Per-90 Productivity Comparison</h3>
            <div className="h-[240px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="metric" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  {comparedPlayers.map((p, idx) => (
                    <Bar key={p.player_id} dataKey={p.name} fill={colors[idx % colors.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card text-center py-20 text-slate-400">
          <p className="font-semibold text-white">Select at least one player to compare</p>
        </div>
      )}
    </div>
  );
}
