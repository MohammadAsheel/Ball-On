import React from 'react';

export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-xl border border-white/[0.04] bg-white/[0.04] ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card flex flex-col justify-between p-5 space-y-4 rounded-2xl border border-white/[0.08] bg-[#0e121a]/80">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-2 pt-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="border-t border-white/[0.06] pt-4 flex items-center justify-between">
        <div className="space-y-1 w-1/2">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}
