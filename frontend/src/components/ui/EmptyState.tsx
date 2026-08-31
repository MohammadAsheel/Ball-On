import React from 'react';
import { LucideIcon, HelpCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon: Icon = HelpCircle,
  action,
}: EmptyStateProps) {
  return (
    <div className="glass-card text-center py-16 px-6 space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/5 mx-auto flex items-center justify-center text-slate-500">
        <Icon size={24} />
      </div>
      <h4 className="text-base font-bold text-white">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mx-auto">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
