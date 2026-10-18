// Input adoption patterns and demonstration input costs.
//
// Adoption percentages are AHS-style reference values used by the
// demonstration engines (tagged `derived` in the AI data provenance and
// `simulated` here for the interactive modules). Per-unit costs are
// synthesized estimates for illustration only.

import type { ProvinceKey } from "./districts";
import type { DataQuality } from "./provenance";

export interface InputAdoption {
  improvedSeed: number;
  organic: number;
  inorganic: number;
  pesticide: number;
}

export const INPUT_ADOPTION: Record<ProvinceKey, InputAdoption> = {
  Kigali: { improvedSeed: 0.666, organic: 0.933, inorganic: 0.404, pesticide: 0.378 },
  South: { improvedSeed: 0.634, organic: 0.963, inorganic: 0.587, pesticide: 0.488 },
  West: { improvedSeed: 0.556, organic: 0.957, inorganic: 0.745, pesticide: 0.389 },
  North: { improvedSeed: 0.653, organic: 0.978, inorganic: 0.726, pesticide: 0.566 },
  East: { improvedSeed: 0.712, organic: 0.887, inorganic: 0.658, pesticide: 0.302 },
};

/** Improved-seed use by crop (reference proportions). */
export const IMPROVED_SEED_BY_CROP: Record<string, number> = {
  Maize: 0.704,
  "Paddy rice": 0.585,
  Wheat: 0.099,
  Beans: 0.005,
  "Irish potato": 0.037,
  Soybean: 0.01,
  Vegetables: 0.376,
  Cassava: 0.002,
  "Sweet potato": 0.005,
};

/** Practices by province (erosion control, agroforestry, irrigation). */
export const PRACTICES: Record<
  ProvinceKey,
  { erosionControl: number; agroforestry: number; irrigation: number }
> = {
  Kigali: { erosionControl: 0.923, agroforestry: 0.743, irrigation: 0.16 },
  South: { erosionControl: 0.941, agroforestry: 0.589, irrigation: 0.192 },
  West: { erosionControl: 0.923, agroforestry: 0.688, irrigation: 0.064 },
  North: { erosionControl: 0.97, agroforestry: 0.679, irrigation: 0.086 },
  East: { erosionControl: 0.806, agroforestry: 0.727, irrigation: 0.179 },
};

export const FERTILIZER_SOURCES = [
  { name: "Agro-dealers", share: 0.497 },
  { name: "NGO programmes", share: 0.384 },
  { name: "Market", share: 0.078 },
  { name: "Cooperative", share: 0.067 },
  { name: "Government", share: 0.06 },
  { name: "Other", share: 0.015 },
];

/** Demonstration input costs (RWF). Synthesized — not market quotes. */
export interface InputCost {
  key: "improvedSeed" | "organic" | "inorganic" | "pesticide";
  label: string;
  unit: string;
  /** Cost per hectare for a typical application. */
  costPerHaRwf: number;
  quality: DataQuality;
}

export const INPUT_COSTS: InputCost[] = [
  {
    key: "improvedSeed",
    label: "Improved seed",
    unit: "per ha",
    costPerHaRwf: 28000,
    quality: "synthesized",
  },
  {
    key: "organic",
    label: "Organic fertilizer (manure)",
    unit: "2 t/ha",
    costPerHaRwf: 35000,
    quality: "synthesized",
  },
  {
    key: "inorganic",
    label: "Inorganic fertilizer (NPK blend)",
    unit: "100 kg/ha",
    costPerHaRwf: 52000,
    quality: "synthesized",
  },
  {
    key: "pesticide",
    label: "Pesticide / crop protection",
    unit: "per ha",
    costPerHaRwf: 12000,
    quality: "synthesized",
  },
];

export const INPUT_COST_BY_KEY = new Map(INPUT_COSTS.map((c) => [c.key, c]));
