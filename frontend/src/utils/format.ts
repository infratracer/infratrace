import { format, formatDistanceToNow } from "date-fns";

export function formatCurrency(value: number, currency = "AUD"): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(value);
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "d MMM yyyy");
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), "d MMM yyyy, HH:mm");
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function truncateHash(hash: string, chars = 8): string {
  if (hash.length <= chars * 2) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}

export function formatSensorValue(value: number, unit: string): string {
  return `${value.toFixed(1)} ${unit}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
