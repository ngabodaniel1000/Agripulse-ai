// Input Combination Intelligence.
//
// Builds every combination of improved seed, organic fertilizer, inorganic
// fertilizer and pesticide, scores each with the transparent yield engine and
// the demonstration input costs, and explains trade-offs. It never asserts a
// causal effect from an observational pattern — all differences come from the
// documented response function.

import { INPUT_COST_BY_KEY } from "@/data/sim/inputs";
import { currentPrice } from "@/data/sim/market";
import { predictYield } from "./yield";
import { round, safeDivide } from "./format";
import type { ComboAnalysis, ComboResult, InputCombination, YieldInput } from "./types";

const BASE_INPUTS: Omit<
  YieldInput,
  "improvedSeed" | "organicFertilizer" | "inorganicFertilizer" | "pesticide"
> = {
  crop: "Maize",
  district: "Musanze",
  season: "A",
  farmSizeHa: 1,
  soil: "Loam",
  irrigation: false,
  erosionControl: true,
  agroforestry: false,
};

function labelFor(combo: InputCombination): string {
  const parts: string[] = [];
  if (combo.improvedSeed) parts.push("Improved seed");
  if (combo.organicFertilizer) parts.push("Organic");
  if (combo.inorganicFertilizer) parts.push("Inorganic");
  if (combo.pesticide) parts.push("Pesticide");
  return parts.length ? parts.join(" + ") : "No purchased inputs";
}

function notesFor(combo: InputCombination, cropName: string): string[] {
  const notes: string[] = [];
  if (combo.inorganicFertilizer && !combo.organicFertilizer) {
    notes.push(
      "Mineral fertilizer alone can raise yield quickly but does not rebuild soil organic matter.",
    );
  }
  if (combo.organicFertilizer && !combo.inorganicFertilizer) {
    notes.push(
      "Organic matter improves soil health over time but releases nutrients slowly and is bulky to transport.",
    );
  }
  if (combo.organicFertilizer && combo.inorganicFertilizer) {
    notes.push(
      "Combining organic and mineral fertilizer is shown with a small synergy in this model.",
    );
  }
  if (combo.improvedSeed) {
    notes.push(
      `Improved seed for ${cropName} has the largest modelled effect for cereals and is best paired with adequate fertility.`,
    );
  }
  if (combo.pesticide) {
    notes.push(
      "Crop protection reduces modelled losses; always follow safe-handling and pre-harvest interval guidance.",
    );
  }
  if (!combo.improvedSeed && !combo.inorganicFertilizer) {
    notes.push("Low-input options keep costs down but leave more yield potential unrealised.");
  }
  return notes;
}

export function compareInputCombinations(
  crop: string,
  district: string,
  season: string,
  farmSizeHa: number,
): ComboAnalysis {
  const areaHa = farmSizeHa > 0 ? farmSizeHa : 1;
  const priceRwfKg = currentPrice(crop, district);

  const combos: InputCombination[] = [];
  for (const improvedSeed of [false, true]) {
    for (const organicFertilizer of [false, true]) {
      for (const inorganicFertilizer of [false, true]) {
        for (const pesticide of [false, true]) {
          combos.push({
            improvedSeed,
            organicFertilizer,
            inorganicFertilizer,
            pesticide,
            label: "",
          });
        }
      }
    }
  }

  const baseInput: YieldInput = {
    ...BASE_INPUTS,
    crop,
    district,
    season,
    farmSizeHa: areaHa,
    soil: "Loam",
    improvedSeed: false,
    organicFertilizer: false,
    inorganicFertilizer: false,
    pesticide: false,
  };
  const baselineYieldKgHa = predictYield(baseInput).predictedYieldKgHa;

  const results: ComboResult[] = combos.map((raw) => {
    const combo = { ...raw, label: labelFor(raw) };
    const result = predictYield({
      ...baseInput,
      improvedSeed: combo.improvedSeed,
      organicFertilizer: combo.organicFertilizer,
      inorganicFertilizer: combo.inorganicFertilizer,
      pesticide: combo.pesticide,
    });

    let inputCostRwf = 0;
    if (combo.improvedSeed)
      inputCostRwf += (INPUT_COST_BY_KEY.get("improvedSeed")?.costPerHaRwf ?? 0) * areaHa;
    if (combo.organicFertilizer)
      inputCostRwf += (INPUT_COST_BY_KEY.get("organic")?.costPerHaRwf ?? 0) * areaHa;
    if (combo.inorganicFertilizer)
      inputCostRwf += (INPUT_COST_BY_KEY.get("inorganic")?.costPerHaRwf ?? 0) * areaHa;
    if (combo.pesticide)
      inputCostRwf += (INPUT_COST_BY_KEY.get("pesticide")?.costPerHaRwf ?? 0) * areaHa;

    const grossRevenueRwf = result.totalProductionKg * priceRwfKg;
    const netBenefitRwf = grossRevenueRwf - inputCostRwf;
    const roiPct = safeDivide(netBenefitRwf, inputCostRwf, 0) * 100;
    const yieldLiftPct =
      safeDivide(result.predictedYieldKgHa - baselineYieldKgHa, baselineYieldKgHa, 0) * 100;

    return {
      combination: combo,
      yieldKgHa: result.predictedYieldKgHa,
      yieldLiftPct: round(yieldLiftPct, 1),
      inputCostRwf: round(inputCostRwf),
      grossRevenueRwf: round(grossRevenueRwf),
      netBenefitRwf: round(netBenefitRwf),
      roiPct: round(roiPct, 1),
      notes: notesFor(combo, crop),
    };
  });

  const bestByNet = results.reduce<ComboResult | null>(
    (best, r) => (best === null || r.netBenefitRwf > best.netBenefitRwf ? r : best),
    null,
  );
  const bestByYield = results.reduce<ComboResult | null>(
    (best, r) => (best === null || r.yieldKgHa > best.yieldKgHa ? r : best),
    null,
  );
  const withCost = results.filter((r) => r.inputCostRwf > 0);
  const bestByRoi = withCost.reduce<ComboResult | null>(
    (best, r) => (best === null || r.roiPct > best.roiPct ? r : best),
    null,
  );

  return {
    crop,
    district,
    season,
    farmSizeHa: areaHa,
    baselineYieldKgHa: round(baselineYieldKgHa),
    priceRwfKg: round(priceRwfKg, 1),
    results: results.sort((a, b) => b.netBenefitRwf - a.netBenefitRwf),
    bestByNet,
    bestByYield,
    bestByRoi,
    quality: "simulated",
  };
}
