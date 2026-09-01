import React from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  ArrowRight,
  Calculator,
  GitCompare,
  Search,
  TrendingUp,
  User,
} from 'lucide-react';
import { TopTransfer, ModelMetadata } from '@/lib/types';
import { formatEUR, formatDate } from '@/lib/format';

interface RightSidebarProps {
  recentTransfers: TopTransfer[];
  modelMeta: ModelMetadata | null;
}

export function RightSidebar({ recentTransfers, modelMeta }: RightSidebarProps) {
  const recent5 = recentTransfers.slice(0, 5);

  // Find best model from benchmark
  const bestModel = modelMeta && Object.entries(modelMeta.test_results).length > 0
    ? Object.entries(modelMeta.test_results).reduce(
        (best, current) => (current[1].mae_eur < best[1].mae_eur ? current : best),
        Object.entries(modelMeta.test_results)[0]
      )
    : null;

  return (
    <div className="space-y-5">
      {/* Recent Major Transfers */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="text-purple-400" size={15} />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Recent Major Transfers
            </h3>
          </div>
          <Link
            href="/transfers"
            className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            All <ArrowRight size={10} />
          </Link>
        </div>

        <div className="space-y-2">
          {recent5.map((t, idx) => (
            <div
              key={`recent-${idx}`}
              className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/[0.06] flex items-center justify-center shrink-0">
                  <User size={12} className="text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{t.player_name}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {t.from_club_name} → {t.to_club_name}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-xs font-bold text-emerald-400">{formatEUR(t.transfer_fee)}</p>
                <p className="text-[9px] text-slate-500">{formatDate(t.transfer_date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Tools */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <TrendingUp size={15} className="text-sky-400" />
          Quick Tools
        </h3>

        <div className="space-y-1.5">
          {[
            {
              href: '/estimator',
              icon: Calculator,
              label: 'Transfer Estimator',
              desc: "Estimate a player's transfer value",
            },
            {
              href: '/compare',
              icon: GitCompare,
              label: 'Player Comparison',
              desc: 'Compare up to 4 players',
            },
            {
              href: '/players',
              icon: Search,
              label: 'Advanced Search',
              desc: 'Find players, clubs or transfers',
            },
            {
              href: '/transfers',
              icon: TrendingUp,
              label: 'Market Trends',
              desc: 'Explore transfer analytics',
            },
          ].map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-white/[0.06] flex items-center justify-center shrink-0">
                <tool.icon size={14} className="text-sky-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">
                  {tool.label}
                </p>
                <p className="text-[10px] text-slate-500">{tool.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Model Performance */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <TrendingUp size={15} className="text-emerald-400" />
          Model Performance
        </h3>

        {bestModel ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">R²</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {bestModel[1].r2.toFixed(3)}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">MAE</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {formatEUR(bestModel[1].mae_eur)}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">RMSE</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {formatEUR(bestModel[1].rmse_eur)}
                </p>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 space-y-0.5">
              <p>
                <span className="text-slate-400">Model:</span> {bestModel[0]}
              </p>
              {modelMeta && (
                <p>
                  <span className="text-slate-400">Test starts:</span> {modelMeta.periods.test_start}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Metrics unavailable</p>
        )}
      </div>
    </div>
  );
}
