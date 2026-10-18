// Simulated weather intelligence.
//
// Produces a consistent monthly rainfall and temperature profile per district
// using a deterministic generator. The structure mirrors what a CHIRPS-backed
// rainfall adapter and a station/reanalysis temperature adapter would return,
// so `src/data/adapters` can swap in a real source without changing the UI.

import { DISTRICTS, getDistrict, provinceOf } from "./districts";
import type { Season } from "./crops";
import type { DataQuality } from "./provenance";

export const MONTHS = [
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
] as const;

export type MonthLabel = (typeof MONTHS)[number];

/** Share of annual rainfall by month (Rwanda bimodal pattern). */
const RAINFALL_SHARE = [0.09, 0.09, 0.12, 0.14, 0.11, 0.03, 0.02, 0.03, 0.09, 0.11, 0.1, 0.07];

export const SEASON_MONTHS: Record<Season, number[]> = {
  A: [9, 10, 11, 12, 1],
  B: [2, 3, 4, 5, 6],
  C: [7, 8],
};

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

export interface MonthlyClimate {
  month: MonthLabel;
  monthIndex: number;
  rainfallMm: number;
  tempC: number;
}

export function monthlyClimate(districtName: string): MonthlyClimate[] {
  const district = getDistrict(districtName);
  if (!district) return [];
  const random = mulberry32(hashSeed(district.name));
  return MONTHS.map((month, i) => {
    const jitter = 0.92 + random() * 0.16;
    const rainfallMm = district.annualRainfallMm * RAINFALL_SHARE[i] * jitter;
    const seasonal = 1.6 * Math.cos((2 * Math.PI * (i + 1 - 8)) / 12);
    const tempC = district.meanTempC + seasonal + (random() - 0.5) * 0.6;
    return {
      month,
      monthIndex: i + 1,
      rainfallMm: Math.round(rainfallMm * 10) / 10,
      tempC: Math.round(tempC * 10) / 10,
    };
  });
}

/** Rainfall for a single month index (1–12) in a district. */
export function monthClimate(districtName: string, monthIndex: number): number {
  const row = monthlyClimate(districtName).find((m) => m.monthIndex === monthIndex);
  return row?.rainfallMm ?? 0;
}

export interface SeasonClimate {
  season: Season;
  rainfallMm: number;
  meanTempC: number;
  months: number[];
  quality: DataQuality;
}

export function seasonClimate(districtName: string, season: Season): SeasonClimate {
  const monthly = monthlyClimate(districtName);
  const months = SEASON_MONTHS[season];
  const selected = monthly.filter((m) => months.includes(m.monthIndex));
  const rainfallMm = selected.reduce((sum, m) => sum + m.rainfallMm, 0);
  const meanTempC = selected.length
    ? selected.reduce((sum, m) => sum + m.tempC, 0) / selected.length
    : 0;
  return {
    season,
    rainfallMm: Math.round(rainfallMm),
    meanTempC: Math.round(meanTempC * 10) / 10,
    months,
    quality: "simulated",
  };
}

export interface WeatherRisk {
  level: "low" | "moderate" | "high";
  label: string;
  reason: string;
  tone: "success" | "warning" | "destructive";
}

/** Simple, explainable rainfall risk classification for a season. */
export function weatherRisk(
  districtName: string,
  season: Season,
  cropOptimalRainMm = 500,
): WeatherRisk {
  const climate = seasonClimate(districtName, season);
  const ratio = cropOptimalRainMm > 0 ? climate.rainfallMm / cropOptimalRainMm : 0;
  if (ratio < 0.65) {
    return {
      level: "high",
      label: "Drought risk",
      reason: `Season rainfall (${climate.rainfallMm} mm) is well below the crop requirement (~${cropOptimalRainMm} mm). Plan supplementary water or a drought-tolerant crop.`,
      tone: "destructive",
    };
  }
  if (ratio < 0.85) {
    return {
      level: "moderate",
      label: "Below-average rainfall",
      reason: `Season rainfall (${climate.rainfallMm} mm) is slightly below the crop requirement (~${cropOptimalRainMm} mm). Monitor soil moisture.`,
      tone: "warning",
    };
  }
  if (ratio > 1.45) {
    return {
      level: "high",
      label: "Excess rainfall / waterlogging risk",
      reason: `Season rainfall (${climate.rainfallMm} mm) is well above the crop requirement. Ensure drainage and check for fungal disease pressure.`,
      tone: "destructive",
    };
  }
  if (ratio > 1.2) {
    return {
      level: "moderate",
      label: "Above-average rainfall",
      reason: `Season rainfall (${climate.rainfallMm} mm) is above the crop requirement. Watch for erosion on slopes.`,
      tone: "warning",
    };
  }
  return {
    level: "low",
    label: "Favourable rainfall",
    reason: `Season rainfall (${climate.rainfallMm} mm) is close to the crop requirement (~${cropOptimalRainMm} mm).`,
    tone: "success",
  };
}

export interface DistrictWeatherSummary {
  district: string;
  province: string;
  annualRainfallMm: number;
  meanTempC: number;
  elevationM: number;
  seasonRainfallMm: number;
  seasonLabel: string;
  risk: WeatherRisk;
}

export function districtWeatherSummary(
  districtName: string,
  season: Season,
  cropOptimalRainMm = 500,
): DistrictWeatherSummary {
  const district = getDistrict(districtName);
  const climate = seasonClimate(districtName, season);
  return {
    district: districtName,
    province: provinceOf(districtName),
    annualRainfallMm: district?.annualRainfallMm ?? 0,
    meanTempC: district?.meanTempC ?? 0,
    elevationM: district?.elevationM ?? 0,
    seasonRainfallMm: climate.rainfallMm,
    seasonLabel: `Season ${season}`,
    risk: weatherRisk(districtName, season, cropOptimalRainMm),
  };
}

/** District-average season rainfall across all districts (simulated mm). */
export function nationalSeasonRainfall(season: Season): number {
  const districts = DISTRICTS;
  if (!districts.length) return 0;
  const total = districts.reduce((sum, d) => sum + seasonClimate(d.name, season).rainfallMm, 0);
  return Math.round(total / districts.length);
}
