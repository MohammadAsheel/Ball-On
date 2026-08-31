import React from 'react';
import { AlertTriangle, LucideIcon } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  icon: Icon = AlertTriangle,
  action,
}: ErrorStateProps) {
  return (
    <div className="glass-card text-center py-14 px-6 space-y-3">
      <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 mx-auto flex items-center justify-center">
        <Icon size={22} className="text-rose-400" />
      </div>
      <h4 className="text-base font-bold text-white">{title}</h4>
      <p className="text-sm text-slate-400 max-w-md mx-auto">{message}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
