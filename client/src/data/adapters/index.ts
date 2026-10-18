// Simulated adapter implementations.
//
// These wrap the centralized simulated data with asynchronous, adapter-shaped
// APIs. `live: false` is reported everywhere so the interface can honestly say
// no external service is connected.

import { DISTRICTS, getDistrict } from "@/data/sim/districts";
import { monthClimate, MONTHS, districtWeatherSummary } from "@/data/sim/weather";
import { INPUT_ADOPTION, IMPROVED_SEED_BY_CROP } from "@/data/sim/inputs";
import { currentPrice } from "@/data/sim/market";
import type { Season } from "@/data/sim/crops";
import type {
  AdapterMeta,
  AdapterResult,
  MarketAdapter,
  NisrAdapter,
  RainfallAdapter,
  WeatherAdapter,
} from "./types";

const now = () => new Date().toISOString();

export const SIM_META = {
  nisr: {
    id: "nisr",
    name: "NISR agricultural indicators",
    provider: "Local simulation (future: NISR datasets)",
    live: false,
    quality: "simulated" as const,
    note: "Awaiting a disaggregated NISR crop and input dataset. Values shown are simulated.",
  },
  chirps: {
    id: "chirps",
    name: "CHIRPS-compatible rainfall",
    provider: "Local simulation (future: CHIRPS / Earth Engine)",
    live: false,
    quality: "simulated" as const,
    note: "CHIRPS-compatible monthly structure. No external rainfall service is connected.",
  },
  weather: {
    id: "weather",
    name: "Seasonal weather outlook",
    provider: "Local simulation (future: Meteo Rwanda / weather API)",
    live: false,
    quality: "simulated" as const,
    note: "Demonstration outlook only. Not an official seasonal forecast.",
  },
  market: {
    id: "market",
    name: "Market price feed",
    provider: "Local simulation (future: e-Soko / verified market source)",
    live: false,
    quality: "simulated" as const,
    note: "Reference prices are simulated. Not live market quotes.",
  },
} satisfies Record<string, AdapterMeta>;

function buildNisrPoints(district: string) {
  const info = getDistrict(district);
  const province = info?.province ?? "South";
  const adoption = INPUT_ADOPTION[province];
  return [
    {
      indicator: "Improved seed adoption",
      district,
      value: Math.round(adoption.improvedSeed * 1000) / 10,
      unit: "%",
      period: "Simulated reference",
    },
    {
      indicator: "Organic fertilizer adoption",
      district,
      value: Math.round(adoption.organic * 1000) / 10,
      unit: "%",
      period: "Simulated reference",
    },
    {
      indicator: "Inorganic fertilizer adoption",
      district,
      value: Math.round(adoption.inorganic * 1000) / 10,
      unit: "%",
      period: "Simulated reference",
    },
    {
      indicator: "Pesticide adoption",
      district,
      value: Math.round(adoption.pesticide * 1000) / 10,
      unit: "%",
      period: "Simulated reference",
    },
    {
      indicator: "Maize improved-seed use",
      district,
      value: Math.round((IMPROVED_SEED_BY_CROP.Maize ?? 0) * 1000) / 10,
      unit: "%",
      period: "Simulated reference",
    },
  ];
}

export const simulatedNisrAdapter: NisrAdapter = {
  meta: SIM_META.nisr,
  async getDistrictIndicators(district: string) {
    return { data: buildNisrPoints(district), meta: SIM_META.nisr, fetchedAt: now() };
  },
};

function buildRainfall(district: string, year: number) {
  return {
    year,
    district,
    months: MONTHS.map((label, i) => ({
      month: i + 1,
      monthLabel: label,
      rainfallMm: monthClimate(district, i + 1),
    })),
  };
}

export const chirpsRainfallAdapter: RainfallAdapter = {
  meta: SIM_META.chirps,
  async getMonthlyRainfall(district: string, year: number) {
    return { data: buildRainfall(district, year), meta: SIM_META.chirps, fetchedAt: now() };
  },
};

export const simulatedWeatherAdapter: WeatherAdapter = {
  meta: SIM_META.weather,
  async getSeasonOutlook(district: string, season: string) {
    const summary = districtWeatherSummary(district, (season as Season) ?? "A");
    return {
      data: {
        district,
        season,
        expectedRainfallMm: summary.seasonRainfallMm,
        expectedTempC: summary.meanTempC,
        riskLabel: summary.risk.label,
      },
      meta: SIM_META.weather,
      fetchedAt: now(),
    };
  },
};

export const simulatedMarketAdapter: MarketAdapter = {
  meta: SIM_META.market,
  async getQuotes(crop: string) {
    return {
      data: DISTRICTS.map((d) => ({
        crop,
        district: d.name,
        priceRwfKg: currentPrice(crop, d.name),
        period: "Demonstration period",
      })),
      meta: SIM_META.market,
      fetchedAt: now(),
    };
  },
};

export const ADAPTER_STATUS: AdapterMeta[] = [
  SIM_META.nisr,
  SIM_META.chirps,
  SIM_META.weather,
  SIM_META.market,
];

export type { AdapterMeta, AdapterResult };
