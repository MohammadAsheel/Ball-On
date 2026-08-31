export function formatEUR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return 'N/A';
  }
  const abs = Math.abs(val);
  if (abs >= 1_000_000_000) {
    return `€${(val / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `€${(val / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `€${(val / 1_000).toFixed(0)}K`;
  }
  return `€${val.toLocaleString()}`;
}

export function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '0';
  }
  return val.toLocaleString();
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
