// Shared domain types for the agricultural intelligence calculation services.

import type { DataQuality } from "@/data/sim/provenance";
import type { Season, SoilType } from "@/data/sim";

export interface YieldInput {
  crop: string;
  district: string;
  season: Season | string;
  farmSizeHa: number;
  soil: SoilType | string;
  improvedSeed: boolean;
  organicFertilizer: boolean;
  inorganicFertilizer: boolean;
  pesticide: boolean;
  irrigation: boolean;
  erosionControl: boolean;
  agroforestry: boolean;
  /** Optional measured/forecast rainfall for the season (mm). */
  rainfallMm?: number;
  /** Optional measured/forecast mean temperature (°C). */
  temperatureC?: number;
}

export interface YieldFactor {
  key: string;
  label: string;
  multiplier: number;
  /** Percentage effect on yield relative to the district reference. */
  impactPct: number;
  direction: "increase" | "decrease" | "neutral";
  note: string;
}

export interface YieldResult {
  crop: string;
  district: string;
  season: string;
  baseYieldKgHa: number;
  predictedYieldKgHa: number;
  lowerKgHa: number;
  upperKgHa: number;
  uncertaintyPct: number;
  confidencePct: number;
  totalProductionKg: number;
  rainfallMm: number;
  temperatureC: number;
  factors: YieldFactor[];
  assumptions: string[];
  quality: DataQuality;
  engine: string;
}

export type StorageMethod =
  "Traditional granary" | "Hermetic bag" | "Warehouse" | "Open air" | "Improved silo";

export interface StorageInput {
  crop: string;
  quantityKg: number;
  currentPriceRwfKg: number;
  storageMethod: StorageMethod | string;
  durationWeeks: number;
  humidityPct: number;
  temperatureC: number;
  /** Expected price change over the storage period, percent. Defaults to 0. */
  priceTrendPct?: number;
}

export type StoreRecommendation =
  "SELL_NOW" | "STORE_IF_SAFE" | "WAIT_AND_MONITOR" | "NOT_ENOUGH_INFORMATION";

export interface StorageResult {
  totalLossPct: number;
  weeklyLossPct: number;
  remainingKg: number;
  lostKg: number;
  revenueSellNowRwf: number;
  revenueStoreRwf: number;
  netGainStoreRwf: number;
  storageCostRwf: number;
  futurePriceRwfKg: number;
  riskLevel: "low" | "moderate" | "high";
  recommendation: StoreRecommendation;
  rationale: string;
  actions: string[];
  quality: DataQuality;
}

export interface InputCombination {
  label: string;
  improvedSeed: boolean;
  organicFertilizer: boolean;
  inorganicFertilizer: boolean;
  pesticide: boolean;
}

export interface ComboResult {
  combination: InputCombination;
  yieldKgHa: number;
  yieldLiftPct: number;
  inputCostRwf: number;
  grossRevenueRwf: number;
  netBenefitRwf: number;
  roiPct: number;
  notes: string[];
}

export interface ComboAnalysis {
  crop: string;
  district: string;
  season: string;
  farmSizeHa: number;
  baselineYieldKgHa: number;
  priceRwfKg: number;
  results: ComboResult[];
  bestByNet: ComboResult | null;
  bestByYield: ComboResult | null;
  bestByRoi: ComboResult | null;
  quality: DataQuality;
}
