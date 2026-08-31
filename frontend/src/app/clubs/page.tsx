'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Users, Landmark, TrendingUp } from 'lucide-react';
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

export default function ClubsPage() {
  const [data, setData] = useState<ClubsData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const stadiumChartData = data?.stadiums.slice(0, 10).map((s) => ({
    name: s.club_name.replace('Football Club', 'FC').replace('Club de Fútbol', 'CF'),
    seats: s.stadium_seats,
    stadium: s.stadium_name,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Clubs & Stadiums</h1>
        <p className="text-sm text-slate-400 mt-1">
          Squad valuations, sizes, and stadium capacities across European football.
        </p>
      </div>

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
  );
}
