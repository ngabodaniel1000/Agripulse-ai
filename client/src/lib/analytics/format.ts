// Shared numeric helpers. Every calculation service uses these so identical
// inputs produce identical, safely-rounded outputs and edge cases (zero
// denominators, NaN, Infinity) never leak into the interface.

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function safeDivide(numerator: number, denominator: number, fallback = 0): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return fallback;
  }
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : fallback;
}

export function round(value: number, digits = 0): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatNumber(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "—";
  return digits === 0 ? numberFormatter.format(value) : decimalFormatter.format(value);
}

export function compactNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${Math.round(value)}`;
}

export function formatRwf(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${numberFormatter.format(Math.round(value))} RWF`;
}

export function formatCompactRwf(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${compactNumber(value)} RWF`;
}

export function formatKg(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "—";
  return `${formatNumber(value, digits)} kg`;
}

export function formatTonnes(valueKg: number, digits = 1): string {
  if (!Number.isFinite(valueKg)) return "—";
  return `${formatNumber(valueKg / 1000, digits)} t`;
}

export function formatHa(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  const formatted =
    digits === 0 ? numberFormatter.format(value) : value.toFixed(digits).replace(/\.?0+$/, "");
  return `${formatted} ha`;
}

export function formatPct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatSignedPct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}
