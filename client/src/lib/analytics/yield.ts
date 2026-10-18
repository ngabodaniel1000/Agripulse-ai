// Yield Prediction Engine — transparent demonstration algorithm.
//
// This is NOT a trained machine-learning model. It is a documented,
// deterministic response function: a district reference yield for the crop and
// season, multiplied by clearly-labelled agronomic adjustment factors. Every
// factor is reported so the result can be explained and audited.

import { BASE_YIELDS_A, BASE_YIELDS_B, getCrop } from "@/data/sim/crops";
import { getDistrict } from "@/data/sim/districts";
import { seasonClimate } from "@/data/sim/weather";
import { clamp, round } from "./format";
import type { SoilType } from "@/data/sim";
import type { YieldFactor, YieldInput, YieldResult } from "./types";

const SOIL_EFFECT: Record<string, number> = {
  Clay: 1.0,
  Loam: 1.15,
  Sandy: 0.85,
  Volcanic: 1.1,
  Peat: 0.95,
};

const SOIL_NOTE: Record<string, string> = {
  Clay: "Clay soils hold water but can be heavy to work.",
  Loam: "Loam soils are generally the most productive in this model.",
  Sandy: "Sandy soils drain quickly and hold fewer nutrients.",
  Volcanic: "Volcanic soils are fertile but can be acidic.",
  Peat: "Peat soils need careful drainage management.",
};

function referenceYield(crop: string, district: string, season: string): number {
  const a = BASE_YIELDS_A[crop]?.[district] ?? 0;
  const b = BASE_YIELDS_B[crop]?.[district] ?? 0;
  const baseA = a > 0 ? a : b;
  if (baseA <= 0) {
    const table = BASE_YIELDS_A[crop];
    if (!table) return 1000;
    const values = Object.values(table).filter((v) => v > 0);
    return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 1000;
  }
  if (season === "B") {
    const baseB = b > 0 ? b : baseA;
    return 0.6 * baseA + 0.4 * baseB;
  }
  if (season === "C") return baseA * 0.85;
  return baseA;
}

function rainEffect(ratio: number): { value: number; note: string } {
  if (ratio < 0.5)
    return {
      value: 0.6,
      note: "Well below the crop water requirement — strong drought stress assumed.",
    };
  if (ratio < 0.8)
    return { value: 0.8, note: "Below the crop water requirement — some drought stress assumed." };
  if (ratio <= 1.2) return { value: 1.0, note: "Rainfall is close to the crop water requirement." };
  if (ratio <= 1.5)
    return {
      value: 0.85,
      note: "Above the crop water requirement — some waterlogging risk assumed.",
    };
  return {
    value: 0.65,
    note: "Well above the crop water requirement — waterlogging and disease risk assumed.",
  };
}

export function predictYield(input: YieldInput): YieldResult {
  const crop = getCrop(input.crop);
  const district = getDistrict(input.district);
  const season = String(input.season ?? "A");
  const areaHa = clamp(Number(input.farmSizeHa) || 0, 0.05, 1000);

  const baseYieldKgHa = referenceYield(input.crop, input.district, season);

  const climate = district
    ? seasonClimate(district.name, season === "B" ? "B" : season === "C" ? "C" : "A")
    : null;
  const rainfallMm = Number.isFinite(input.rainfallMm)
    ? Number(input.rainfallMm)
    : (climate?.rainfallMm ?? 500);
  const temperatureC = Number.isFinite(input.temperatureC)
    ? Number(input.temperatureC)
    : (district?.meanTempC ?? 20);

  const optimalRain = crop?.optimalRainfallMm ?? 500;
  const optimalTemp = crop?.optimalTempC ?? 22;
  const rainRatio = optimalRain > 0 ? rainfallMm / optimalRain : 0;
  const rain = rainEffect(rainRatio);

  const tempEffect = Math.max(0.7, 1 - 0.03 * Math.abs(temperatureC - optimalTemp));

  const seedEffect = input.improvedSeed ? (crop?.symbol === "cereal" ? 1.25 : 1.15) : 1.0;
  const organicEffect = input.organicFertilizer ? 1.12 : 1.0;
  const inorganicEffect = input.inorganicFertilizer ? 1.3 : 1.0;
  const pesticideEffect = input.pesticide ? 1.1 : 1.0;
  const irrigationEffect = input.irrigation ? 1.2 : 1.0;
  const erosionEffect = input.erosionControl ? 1.08 : 1.0;
  const agroforestryEffect = input.agroforestry ? 1.05 : 1.0;

  const soilKey = String(input.soil);
  const soilEffectValue = SOIL_EFFECT[soilKey] ?? 1.0;
  const soilNote = SOIL_NOTE[soilKey] ?? "Soil influence is assumed neutral.";

  const elevation = district?.elevationM ?? 1600;
  const elevEffectValue =
    input.crop === "Irish potato"
      ? clamp(1 + 0.0002 * (elevation - 1500), 0.8, 1.25)
      : clamp(1 - 0.0001 * Math.abs(elevation - 1600), 0.8, 1.1);

  const sizeEffect = clamp(1 + 0.03 * Math.log(1 + 1 / areaHa), 1.0, 1.06);

  const predictedRaw =
    baseYieldKgHa *
    rain.value *
    tempEffect *
    seedEffect *
    organicEffect *
    inorganicEffect *
    pesticideEffect *
    irrigationEffect *
    erosionEffect *
    agroforestryEffect *
    soilEffectValue *
    elevEffectValue *
    sizeEffect;

  const consistency =
    [
      input.improvedSeed,
      input.organicFertilizer,
      input.inorganicFertilizer,
      input.pesticide,
    ].filter(Boolean).length / 4;
  let uncertainty = 0.25 - 0.1 * consistency;
  if (Number.isFinite(input.rainfallMm)) uncertainty -= 0.03;
  if (Number.isFinite(input.temperatureC)) uncertainty -= 0.03;
  uncertainty = clamp(uncertainty, 0.08, 0.3);

  const predictedYieldKgHa = Math.max(100, predictedRaw);
  const lowerKgHa = predictedYieldKgHa * (1 - uncertainty);
  const upperKgHa = predictedYieldKgHa * (1 + uncertainty);

  const factors: YieldFactor[] = [
    factor("rainfall", "Rainfall vs crop requirement", rain.value, rain.note),
    factor(
      "temperature",
      "Temperature vs crop optimum",
      tempEffect,
      `Season temperature of about ${round(temperatureC, 1)} °C versus a ${optimalTemp} °C optimum.`,
    ),
    factor(
      "seed",
      "Improved seed",
      seedEffect,
      input.improvedSeed ? "Improved or certified seed assumed." : "Local or saved seed assumed.",
    ),
    factor(
      "organic",
      "Organic fertilizer",
      organicEffect,
      input.organicFertilizer
        ? "Manure or compost assumed applied."
        : "No organic fertilizer assumed.",
    ),
    factor(
      "inorganic",
      "Inorganic fertilizer",
      inorganicEffect,
      input.inorganicFertilizer
        ? "Mineral fertilizer assumed applied at a moderate rate."
        : "No mineral fertilizer assumed.",
    ),
    factor(
      "pesticide",
      "Crop protection",
      pesticideEffect,
      input.pesticide ? "Pest and disease control assumed." : "No pesticide assumed.",
    ),
    factor(
      "irrigation",
      "Irrigation",
      irrigationEffect,
      input.irrigation
        ? "Supplementary irrigation assumed available."
        : "Rain-fed production assumed.",
    ),
    factor(
      "erosion",
      "Erosion control",
      erosionEffect,
      input.erosionControl
        ? "Soil and water conservation structures assumed."
        : "No erosion control assumed.",
    ),
    factor(
      "agroforestry",
      "Agroforestry",
      agroforestryEffect,
      input.agroforestry ? "Trees integrated with the plot assumed." : "No agroforestry assumed.",
    ),
    factor("soil", "Soil type", soilEffectValue, soilNote),
    factor(
      "elevation",
      "Elevation",
      elevEffectValue,
      `District elevation of about ${elevation} m.`,
    ),
    factor(
      "size",
      "Farm size",
      sizeEffect,
      "Smaller plots can be farmed more intensively in this model.",
    ),
  ].sort((a, b) => Math.abs(b.impactPct) - Math.abs(a.impactPct));

  const assumptions = [
    "Reference yield is a simulated district value for the selected crop and season.",
    `Season rainfall assumed at ${round(rainfallMm)} mm (${Number.isFinite(input.rainfallMm) ? "user supplied" : "simulated"}) and mean temperature ${round(temperatureC, 1)} °C.`,
    "Factors are agronomic rules of thumb for demonstration, not validated coefficients from a trained model.",
    "No pest outbreak, disease epidemic or extreme weather event is modelled.",
  ];

  return {
    crop: input.crop,
    district: input.district,
    season,
    baseYieldKgHa: round(baseYieldKgHa),
    predictedYieldKgHa: round(predictedYieldKgHa),
    lowerKgHa: round(lowerKgHa),
    upperKgHa: round(upperKgHa),
    uncertaintyPct: round(uncertainty * 100),
    confidencePct: round((1 - uncertainty) * 100),
    totalProductionKg: round(predictedYieldKgHa * areaHa),
    rainfallMm: round(rainfallMm),
    temperatureC: round(temperatureC, 1),
    factors,
    assumptions,
    quality: "simulated",
    engine: "Transparent demonstration algorithm (not a trained model)",
  };
}

function factor(key: string, label: string, multiplier: number, note: string): YieldFactor {
  const impactPct = (multiplier - 1) * 100;
  return {
    key,
    label,
    multiplier: round(multiplier, 3),
    impactPct: round(impactPct, 1),
    direction: impactPct > 0.05 ? "increase" : impactPct < -0.05 ? "decrease" : "neutral",
    note,
  };
}

/** Soil types offered by the UI. */
export const SOIL_TYPES: SoilType[] = ["Volcanic", "Loam", "Clay", "Sandy", "Peat"];
