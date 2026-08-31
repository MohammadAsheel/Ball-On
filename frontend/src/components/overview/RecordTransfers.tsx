import React from 'react';
import Link from 'next/link';
import { Award, ArrowRight } from 'lucide-react';
import { TopTransfer } from '@/lib/types';
import { formatEUR, formatDate } from '@/lib/format';

export function RecordTransfers({ transfers }: { transfers: TopTransfer[] }) {
  const top5 = transfers.slice(0, 5);

  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="text-amber-400" size={16} />
          <h3 className="text-sm font-bold text-white">Record Transfer Moves</h3>
        </div>
        <Link
          href="/transfers"
          className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight size={11} />
        </Link>
      </div>

      <div className="space-y-2">
        {top5.map((t, idx) => (
          <div
            key={`${t.player_name}-${idx}`}
            className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-bold text-sky-400 tabular-nums w-5 shrink-0">
                #{idx + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {t.player_name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {t.from_club_name} → {t.to_club_name}
                </p>
              </div>
            </div>
            <span className="text-sm font-bold text-emerald-400 shrink-0 ml-3">
              {formatEUR(t.transfer_fee)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
