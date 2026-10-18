// Simulated market price intelligence.
//
// Reference prices are synthesized in the style of Rwanda e-Soko ranges.
// They are demonstration values only and must not be quoted as live market
// prices. A future `MarketAdapter` can replace this module with a verified
// price feed without changing the presentation layer.

import { CROPS, getCrop } from "./crops";
import { DISTRICTS, getDistrict, provinceOf } from "./districts";
import type { ProvinceKey } from "./districts";
import type { DataQuality } from "./provenance";

export const MARKET_SOURCE_LABEL = "Simulated market reference (e-Soko style)";
export const REPORTING_PERIOD = "Jan–Dec demonstration period";
export const PRICE_QUALITY: DataQuality = "simulated";

/** Province-level price multipliers (transport + demand access). */
const PROVINCE_PRICE_MULTIPLIER: Record<ProvinceKey, number> = {
  Kigali: 1.12,
  South: 1.0,
  West: 1.02,
  North: 0.98,
  East: 0.95,
};

/** Seasonal harvest (low) and lean (high) price factors. */
export const SEASONAL_PRICE_FACTORS: Record<"A" | "B" | "C", { harvest: number; lean: number }> = {
  A: { harvest: 0.85, lean: 1.15 },
  B: { harvest: 0.9, lean: 1.1 },
  C: { harvest: 0.95, lean: 1.05 },
};

const MONTH_ORDER = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PricePoint {
  month: string;
  monthIndex: number;
  priceRwfKg: number;
}

/** Base (national reference) price for a crop, RWF per kg. */
export function basePrice(cropName: string): number {
  return getCrop(cropName)?.baseMarketPriceRwfKg ?? 400;
}

/**
 * Deterministic 12-month price series for a crop in a district.
 * Harvest months push prices down, lean months push them up.
 */
export function priceSeries(cropName: string, districtName: string): PricePoint[] {
  const district = getDistrict(districtName);
  const province = district?.province ?? "South";
  const base = basePrice(cropName);
  const provinceFactor = PROVINCE_PRICE_MULTIPLIER[province];
  const random = mulberry32(hashSeed(`${cropName}:${districtName}:price`));

  // Harvest (low) months: A ~ Dec, B ~ May, C ~ Aug. Lean peaks around Feb/Mar.
  const harvestMonths = new Set([5, 8, 12]);
  return MONTH_ORDER.map((month, i) => {
    const monthIndex = i + 1;
    const seasonal = harvestMonths.has(monthIndex)
      ? 0.9
      : [1, 2, 3, 7, 9].includes(monthIndex)
        ? 1.08
        : 1.0;
    const noise = 0.97 + random() * 0.06;
    const priceRwfKg = base * provinceFactor * seasonal * noise;
    return {
      month,
      monthIndex,
      priceRwfKg: Math.round(priceRwfKg * 10) / 10,
    };
  });
}

export function currentPrice(cropName: string, districtName: string): number {
  const series = priceSeries(cropName, districtName);
  return series.length ? series[series.length - 1].priceRwfKg : basePrice(cropName);
}

export interface PriceMovement {
  current: number;
  previous: number;
  changePct: number;
  direction: "up" | "down" | "flat";
  label: string;
  tone: "danger" | "success" | "neutral";
  source: string;
  period: string;
  quality: DataQuality;
}

export function priceMovement(cropName: string, districtName: string): PriceMovement {
  const series = priceSeries(cropName, districtName);
  const current = series[series.length - 1]?.priceRwfKg ?? basePrice(cropName);
  const previous = series[series.length - 2]?.priceRwfKg ?? current;
  const changePct = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const direction = changePct > 1 ? "up" : changePct < -1 ? "down" : "flat";
  return {
    current,
    previous,
    changePct: Math.round(changePct * 10) / 10,
    direction,
    label: direction === "up" ? "Rising" : direction === "down" ? "Falling" : "Stable",
    tone: direction === "up" ? "danger" : direction === "down" ? "success" : "neutral",
    source: MARKET_SOURCE_LABEL,
    period: REPORTING_PERIOD,
    quality: PRICE_QUALITY,
  };
}

export interface DistrictPrice {
  district: string;
  province: ProvinceKey;
  priceRwfKg: number;
  changePct: number;
}

export function districtPriceComparison(cropName: string): DistrictPrice[] {
  return DISTRICTS.map((d) => ({
    district: d.name,
    province: d.province,
    priceRwfKg: currentPrice(cropName, d.name),
    changePct: priceMovement(cropName, d.name).changePct,
  })).sort((a, b) => b.priceRwfKg - a.priceRwfKg);
}

/** Average reference price per crop (national). */
export function nationalAveragePrice(cropName: string): number {
  if (!DISTRICTS.length) return basePrice(cropName);
  const total = DISTRICTS.reduce((sum, d) => sum + currentPrice(cropName, d.name), 0);
  return Math.round((total / DISTRICTS.length) * 10) / 10;
}

export const MARKET_CROPS = CROPS.map((c) => c.name);

export function priceSeriesForProvince(cropName: string, province: ProvinceKey): PricePoint[] {
  const district = DISTRICTS.find((d) => d.province === province);
  return priceSeries(cropName, district?.name ?? DISTRICTS[0].name);
}

export { provinceOf };
