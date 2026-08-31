import React from 'react';
import { Award, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { formatEUR, formatNumber } from '@/lib/format';
import { TransferIntelligence as TransferIntelligenceType } from '@/lib/types';

export function TransferIntelligence({ data }: { data: TransferIntelligenceType }) {
  return (
    <div className="glass-card space-y-4 p-6 border border-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="text-sky-400" size={18} />
          <h3 className="text-base font-bold text-white tracking-tight">Transfer Intelligence</h3>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
          Market Insights
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Highest Fee */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Award size={14} className="text-amber-400" />
            <span>All-Time Record Fee</span>
          </div>
          <p className="text-lg font-black text-emerald-400">{formatEUR(data.highest_fee)}</p>
          <p className="text-[11px] text-slate-400">{data.highest_fee_player}</p>
        </div>

        {/* Average Fee */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <DollarSign size={14} className="text-sky-400" />
            <span>Average Transfer Fee</span>
          </div>
          <p className="text-lg font-black text-white">{formatEUR(data.average_transfer_fee)}</p>
          <p className="text-[11px] text-slate-400">Paid deals benchmark</p>
        </div>

        {/* Highest Spending Season */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <TrendingUp size={14} className="text-purple-400" />
            <span>Peak Spending Season</span>
          </div>
          <p className="text-lg font-black text-purple-400">{data.highest_spending_season}</p>
          <p className="text-[11px] text-slate-400">{formatEUR(data.highest_season_spend)} total</p>
        </div>

        {/* Most Transferred Position */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Activity size={14} className="text-indigo-400" />
            <span>Most Transferred Position</span>
          </div>
          <p className="text-lg font-black text-sky-400">{data.most_transferred_position}</p>
          <p className="text-[11px] text-slate-400">{formatNumber(data.most_transferred_position_count)} moves</p>
        </div>
      </div>
    </div>
  );
}
