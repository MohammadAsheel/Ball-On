'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { SeasonSpend } from '@/lib/types';
import { formatEUR } from '@/lib/format';

export function SeasonSpendingChart({ data }: { data: SeasonSpend[] }) {
  const chartData = data.map((d) => ({
    season: d.season,
    spendBillions: Number((d.total_spend / 1_000_000_000).toFixed(2)),
    rawSpend: d.total_spend,
    count: d.transfer_count,
  }));

  return (
    <div className="glass-card space-y-4 p-6 border border-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-sky-400" size={18} />
          <h3 className="text-base font-bold text-white tracking-tight">Transfer Spending by Season</h3>
        </div>
        <span className="text-xs text-slate-400">Total Outlay (€ Billions)</span>
      </div>

      <div className="h-[260px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="season"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `€${v}B`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '12px',
              }}
              formatter={(val: any, name: any, item: any) => [
                `${formatEUR(item.payload.rawSpend)} (${item.payload.count.toLocaleString()} deals)`,
                'Market Spend',
              ]}
              labelFormatter={(label) => `Season ${label}`}
            />
            <Bar dataKey="spendBillions" fill="#0284c7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
