import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  iconColor?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-sky-400',
}: StatCardProps) {
  return (
    <div className="glass-card flex items-center justify-between p-4">
      <div className="space-y-0.5 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-xl font-bold tracking-tight text-white">{value}</p>
        {subtext && <p className="text-[11px] text-slate-500">{subtext}</p>}
      </div>
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0 ml-3">
          <Icon className={iconColor} size={18} />
        </div>
      )}
    </div>
  );
}
