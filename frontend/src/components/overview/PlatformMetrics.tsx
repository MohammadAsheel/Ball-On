import React from 'react';
import { Users, ArrowLeftRight, CheckCircle2, Calendar } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { formatNumber } from '@/lib/format';
import { KPIs } from '@/lib/types';

export function PlatformMetrics({ kpis }: { kpis: KPIs }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Players Indexed"
        value={formatNumber(kpis.total_players)}
        subtext="Top European divisions"
        icon={Users}
        iconColor="text-sky-400"
      />
      <StatCard
        label="Transfers Analyzed"
        value={formatNumber(kpis.total_transfers)}
        subtext="Historical transfer moves"
        icon={ArrowLeftRight}
        iconColor="text-indigo-400"
      />
      <StatCard
        label="Paid Transfers"
        value={formatNumber(kpis.paid_transfers)}
        subtext="Known fee agreements"
        icon={CheckCircle2}
        iconColor="text-emerald-400"
      />
      <StatCard
        label="Seasons Covered"
        value={kpis.seasons_covered}
        subtext="Continuous timeline"
        icon={Calendar}
        iconColor="text-purple-400"
      />
    </div>
  );
}
