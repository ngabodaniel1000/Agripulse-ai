// Post-Harvest Loss & Sell-vs-Store engine — transparent demonstration logic.
//
// Compares revenue from selling immediately with expected revenue from storing,
// after accounting for simulated spoilage and storage cost. All assumptions are
// surfaced, and the recommendation degrades to NOT_ENOUGH_INFORMATION when the
// inputs cannot support a defensible answer.

import { getCrop } from "@/data/sim/crops";
import { clamp, round } from "./format";
import type { StorageInput, StorageMethod, StorageResult, StoreRecommendation } from "./types";

const STORAGE_METHODS: Record<string, { weeklyLoss: number; costPerKgWeek: number; note: string }> =
  {
    "Traditional granary": {
      weeklyLoss: 0.015,
      costPerKgWeek: 2,
      note: "Simple granary with moderate losses.",
    },
    "Hermetic bag": {
      weeklyLoss: 0.002,
      costPerKgWeek: 5,
      note: "Air-tight bag with low losses but a purchase cost.",
    },
    Warehouse: { weeklyLoss: 0.008, costPerKgWeek: 10, note: "Shared warehouse with higher fees." },
    "Open air": {
      weeklyLoss: 0.025,
      costPerKgWeek: 1,
      note: "Open drying/floor storage with the highest losses.",
    },
    "Improved silo": { weeklyLoss: 0.004, costPerKgWeek: 8, note: "Modern silo with low losses." },
  };

export const STORAGE_METHOD_NAMES = Object.keys(STORAGE_METHODS);

/** National storage defaults used for aggregate loss reporting. */
export const NATIONAL_STORAGE_DEFAULTS = Object.entries(STORAGE_METHODS).map(([name, d]) => ({
  name,
  weeklyLoss: d.weeklyLoss,
  costPerKgWeek: d.costPerKgWeek,
}));

export const STORAGE_METHOD_DETAILS = Object.entries(STORAGE_METHODS).map(([name, d]) => ({
  name: name as StorageMethod,
  costPerKgWeek: d.costPerKgWeek,
  note: d.note,
}));

export function analyzeStorage(input: StorageInput): StorageResult {
  const crop = getCrop(input.crop);
  const method =
    STORAGE_METHODS[String(input.storageMethod)] ?? STORAGE_METHODS["Traditional granary"];
  const quantityKg = Number(input.quantityKg);
  const price = Number(input.currentPriceRwfKg);
  const weeks = Number(input.durationWeeks);
  const humidity = Number(input.humidityPct);
  const temperature = Number(input.temperatureC);

  const valid =
    Number.isFinite(quantityKg) &&
    quantityKg > 0 &&
    Number.isFinite(price) &&
    price > 0 &&
    Number.isFinite(weeks) &&
    weeks >= 0;

  if (!valid) {
    return {
      totalLossPct: 0,
      weeklyLossPct: 0,
      remainingKg: 0,
      lostKg: 0,
      revenueSellNowRwf: 0,
      revenueStoreRwf: 0,
      netGainStoreRwf: 0,
      storageCostRwf: 0,
      futurePriceRwfKg: 0,
      riskLevel: "high",
      recommendation: "NOT_ENOUGH_INFORMATION",
      rationale:
        "Enter a harvest quantity greater than zero, a price greater than zero and a storage duration of zero or more weeks.",
      actions: [
        "Measure your harvest quantity in kilograms.",
        "Record the current price you have been offered.",
        "Decide how many weeks you could realistically store the crop.",
      ],
      quality: "simulated",
    };
  }

  const cropMultiplier = crop?.lossMultiplierPerWeek ?? 1.0;
  const envMultiplier =
    1 + 0.01 * Math.max(0, humidity - 70) + 0.02 * Math.max(0, temperature - 25);
  const weeklyLossRate = method.weeklyLoss * cropMultiplier * envMultiplier;
  const totalLossRate = clamp(1 - (1 - weeklyLossRate) ** weeks, 0, 0.95);

  const trendPct = Number.isFinite(input.priceTrendPct) ? Number(input.priceTrendPct) : 0;
  const futurePrice = Math.max(1, price * (1 + trendPct / 100));

  const remainingKg = quantityKg * (1 - totalLossRate);
  const lostKg = quantityKg - remainingKg;
  const storageCostRwf = quantityKg * method.costPerKgWeek * weeks;

  const revenueSellNowRwf = quantityKg * price;
  const revenueStoreRwf = remainingKg * futurePrice - storageCostRwf;
  const netGainStoreRwf = revenueStoreRwf - revenueSellNowRwf;

  const riskLevel: StorageResult["riskLevel"] =
    totalLossRate < 0.05 ? "low" : totalLossRate < 0.15 ? "moderate" : "high";

  let recommendation: StoreRecommendation;
  let rationale: string;

  if (netGainStoreRwf <= 0) {
    recommendation = "SELL_NOW";
    rationale = `Storage is expected to reduce your net revenue by about ${Math.round(Math.abs(netGainStoreRwf))} RWF. The simulated spoilage (${round(totalLossRate * 100, 1)}%) and storage cost outweigh the expected price gain.`;
  } else if (riskLevel === "high") {
    recommendation = "WAIT_AND_MONITOR";
    rationale = `Storing could add about ${Math.round(netGainStoreRwf)} RWF, but the simulated loss risk is high (${round(totalLossRate * 100, 1)}% over ${weeks} weeks). Improve storage or reduce the duration before committing.`;
  } else {
    recommendation = "STORE_IF_SAFE";
    rationale = `Storing could add about ${Math.round(netGainStoreRwf)} RWF after simulated spoilage (${round(totalLossRate * 100, 1)}%) and storage cost, if you can protect the crop.`;
  }

  const actions = buildActions(recommendation, method.note);

  return {
    totalLossPct: round(totalLossRate * 100, 1),
    weeklyLossPct: round(weeklyLossRate * 100, 2),
    remainingKg: round(remainingKg),
    lostKg: round(lostKg),
    revenueSellNowRwf: round(revenueSellNowRwf),
    revenueStoreRwf: round(revenueStoreRwf),
    netGainStoreRwf: round(netGainStoreRwf),
    storageCostRwf: round(storageCostRwf),
    futurePriceRwfKg: round(futurePrice, 1),
    riskLevel,
    recommendation,
    rationale,
    actions,
    quality: "simulated",
  };
}

function buildActions(recommendation: StoreRecommendation, methodNote: string): string[] {
  const base = [
    "Dry the crop to a safe moisture level before storage.",
    "Inspect stored produce regularly and remove any spoiled material.",
    methodNote,
  ];
  if (recommendation === "SELL_NOW") {
    return ["Sell now, or fix a forward price with a trusted buyer.", ...base];
  }
  if (recommendation === "WAIT_AND_MONITOR") {
    return ["Do not commit to long storage yet.", "Re-check local prices every week.", ...base];
  }
  if (recommendation === "STORE_IF_SAFE") {
    return [
      "Confirm you have safe, dry storage for the full period.",
      "Arrange a buyer or price agreement before the expected price rise.",
      ...base,
    ];
  }
  return base;
}

export const RECOMMENDATION_META: Record<
  StoreRecommendation,
  { label: string; plain: string; tone: "success" | "warning" | "destructive" | "neutral" }
> = {
  SELL_NOW: {
    label: "SELL NOW",
    plain: "Selling now gives the better result.",
    tone: "destructive",
  },
  STORE_IF_SAFE: {
    label: "STORE IF SAFE",
    plain: "Storing can pay off if it is protected.",
    tone: "success",
  },
  WAIT_AND_MONITOR: {
    label: "WAIT AND MONITOR",
    plain: "Watch prices and improve storage before deciding.",
    tone: "warning",
  },
  NOT_ENOUGH_INFORMATION: {
    label: "NOT ENOUGH INFORMATION",
    plain: "More details are needed for a safe answer.",
    tone: "neutral",
  },
};
