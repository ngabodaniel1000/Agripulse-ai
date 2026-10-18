// Cross-module analytics.
//
// Aggregations used by the Planner dashboard, Rwanda map, market intelligence
// and reports. All values derive from the same centralized simulated datasets,
// so summary cards always reconcile with the charts and tables beside them.

import { BASE_YIELDS_A, BASE_YIELDS_B, CROPS, getCrop } from "@/data/sim/crops";
import { DISTRICTS, PROVINCES, provinceOf, type ProvinceKey } from "@/data/sim/districts";
import { currentPrice, nationalAveragePrice, priceMovement } from "@/data/sim/market";
import { buildAlerts } from "@/data/sim/alerts";
import { NATIONAL_STORAGE_DEFAULTS } from "./storage";
import { round, safeDivide } from "./format";
import type { Season } from "@/data/sim";

/** Simulated national planted area (ha) per crop. */
export const SIMULATED_AREA_HA: Record<string, number> = {
  Maize: 320000,
  Beans: 480000,
  "Irish potato": 120000,
  Cassava: 180000,
  "Sweet potato": 150000,
  "Paddy rice": 45000,
  Banana: 260000,
  Vegetables: 90000,
};

/** Simulated share of national area by province. */
export const PROVINCE_AREA_SHARE: Record<ProvinceKey, number> = {
  Kigali: 0.05,
  South: 0.28,
  West: 0.2,
  North: 0.17,
  East: 0.3,
};

export interface DistrictYield {
  district: string;
  province: ProvinceKey;
  yieldKgHa: number;
  rank: number;
}

function referenceYield(crop: string, district: string, season: Season): number {
  const a = BASE_YIELDS_A[crop]?.[district] ?? 0;
  const b = BASE_YIELDS_B[crop]?.[district] ?? 0;
  const baseA = a > 0 ? a : b;
  if (baseA <= 0) return 0;
  if (season === "B") {
    const baseB = b > 0 ? b : baseA;
    return 0.6 * baseA + 0.4 * baseB;
  }
  if (season === "C") return baseA * 0.85;
  return baseA;
}

export function districtYieldRanking(crop: string, season: Season): DistrictYield[] {
  const rows = DISTRICTS.map((d) => ({
    district: d.name,
    province: d.province,
    yieldKgHa: round(referenceYield(crop, d.name, season)),
  }))
    .filter((r) => r.yieldKgHa > 0)
    .sort((a, b) => b.yieldKgHa - a.yieldKgHa)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  return rows;
}

export function nationalYield(crop: string, season: Season): number {
  const ranking = districtYieldRanking(crop, season);
  if (!ranking.length) return 0;
  return round(ranking.reduce((sum, r) => sum + r.yieldKgHa, 0) / ranking.length);
}

export interface CropDistributionRow {
  crop: string;
  areaHa: number;
  sharePct: number;
  productionKg: number;
}

export function cropDistribution(season: Season = "A"): CropDistributionRow[] {
  const total = Object.values(SIMULATED_AREA_HA).reduce((s, v) => s + v, 0);
  return Object.entries(SIMULATED_AREA_HA)
    .map(([crop, areaHa]) => ({
      crop,
      areaHa,
      sharePct: round(safeDivide(areaHa, total) * 100, 1),
      productionKg: round(areaHa * nationalYield(crop, season)),
    }))
    .sort((a, b) => b.areaHa - a.areaHa);
}

export interface ProvinceProductionRow {
  province: ProvinceKey;
  label: string;
  areaHa: number;
  productionKg: number;
  avgYieldKgHa: number;
}

export function provinceProduction(crop: string, season: Season): ProvinceProductionRow[] {
  const cropArea = SIMULATED_AREA_HA[crop] ?? 0;
  const cropYield = nationalYield(crop, season);
  return PROVINCES.map((province) => {
    const areaHa = round(cropArea * PROVINCE_AREA_SHARE[province]);
    const provinceDistricts = DISTRICTS.filter((d) => d.province === province);
    const avgYield = provinceDistricts.length
      ? round(
          provinceDistricts.reduce((s, d) => s + referenceYield(crop, d.name, season), 0) /
            provinceDistricts.length,
        )
      : cropYield;
    return {
      province,
      label: province,
      areaHa,
      productionKg: round(areaHa * avgYield),
      avgYieldKgHa: avgYield,
    };
  }).sort((a, b) => b.productionKg - a.productionKg);
}

export interface SeasonHistoryPoint {
  period: string;
  yieldKgHa: number;
}

export function seasonHistory(crop: string, district: string, points = 6): SeasonHistoryPoint[] {
  const baseA = BASE_YIELDS_A[crop]?.[district] ?? 0;
  const baseB = BASE_YIELDS_B[crop]?.[district] ?? 0;
  const base = baseA > 0 ? baseA : baseB;
  if (base <= 0) return [];
  const periods: string[] = [];
  const seasonsCycle: Season[] = ["A", "B"];
  let year = 2023;
  for (let i = 0; i < points; i += 1) {
    const season = seasonsCycle[i % 2];
    if (i % 2 === 0 && i > 0) year += 1;
    periods.push(`${season} ${year}`);
  }
  return periods.map((period, i) => {
    const season = period.startsWith("A") ? "A" : "B";
    const seasonal = season === "B" ? safeDivide(baseB > 0 ? baseB : base, base, 1) : 1;
    const drift = 1 + 0.012 * (i - points / 2);
    const wobble = 1 + 0.03 * Math.sin(i * 1.7 + crop.length);
    return { period, yieldKgHa: round(base * seasonal * drift * wobble) };
  });
}

export interface LossRow {
  method: string;
  weeklyLossPct: number;
  loss8WeeksPct: number;
  costPerKgWeek: number;
}

export function lossSummary(): LossRow[] {
  return NATIONAL_STORAGE_DEFAULTS.map((m) => ({
    method: m.name,
    weeklyLossPct: round(m.weeklyLoss * 100, 2),
    loss8WeeksPct: round((1 - (1 - m.weeklyLoss) ** 8) * 100, 1),
    costPerKgWeek: m.costPerKgWeek,
  }));
}

export interface PlannerKpis {
  districts: number;
  crops: number;
  simulatedAreaHa: number;
  simulatedProductionKg: number;
  averageYieldKgHa: number;
  priceIndexRwfKg: number;
  averageLossPct: number;
  openAlerts: number;
  highAlerts: number;
}

export function plannerKpis(season: Season = "A"): PlannerKpis {
  const distribution = cropDistribution(season);
  const totalArea = distribution.reduce((s, c) => s + c.areaHa, 0);
  const totalProduction = distribution.reduce((s, c) => s + c.productionKg, 0);
  const alerts = buildAlerts();
  const lossRows = lossSummary();
  const averageLossPct = lossRows.length
    ? round(lossRows.reduce((s, r) => s + r.loss8WeeksPct, 0) / lossRows.length, 1)
    : 0;
  return {
    districts: DISTRICTS.length,
    crops: CROPS.length,
    simulatedAreaHa: totalArea,
    simulatedProductionKg: totalProduction,
    averageYieldKgHa: round(safeDivide(totalProduction, totalArea)),
    priceIndexRwfKg: round(
      nationalAveragePrice("Maize") * 0.35 + nationalAveragePrice("Beans") * 0.65,
      1,
    ),
    averageLossPct,
    openAlerts: alerts.length,
    highAlerts: alerts.filter((a) => a.severity === "high").length,
  };
}

export interface DistrictProfile {
  district: string;
  province: ProvinceKey;
  topCrop: string;
  topCropYieldKgHa: number;
  referencePriceRwfKg: number;
  priceChangePct: number;
  rainfallMm: number;
  elevationM: number;
  soil: string;
}

export function districtProfile(district: string, season: Season = "A"): DistrictProfile {
  const info = DISTRICTS.find((d) => d.name === district) ?? DISTRICTS[0];
  const ranking = CROPS.map((c) => ({ crop: c.name, y: referenceYield(c.name, district, season) }))
    .filter((r) => r.y > 0)
    .sort((a, b) => b.y - a.y);
  const top = ranking[0] ?? { crop: "—", y: 0 };
  const movement = priceMovement("Maize", district);
  return {
    district: info.name,
    province: info.province,
    topCrop: top.crop,
    topCropYieldKgHa: round(top.y),
    referencePriceRwfKg: round(currentPrice("Maize", district), 1),
    priceChangePct: movement.changePct,
    rainfallMm: info.annualRainfallMm,
    elevationM: info.elevationM,
    soil: info.dominantSoil,
  };
}

export function provinceOfDistrict(district: string): ProvinceKey {
  return provinceOf(district);
}

export { getCrop };
