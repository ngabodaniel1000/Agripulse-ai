// Demonstration farmer profile.
//
// This is a single, internally consistent illustrative household used by the
// Farm Performance, Post-Harvest and Farmer Profile modules. It is simulated
// and does not describe a real person.

import type { Season } from "./crops";
import type { DataQuality } from "./provenance";

export interface FarmProfile {
  id: string;
  farmerName: string;
  cooperative: string;
  district: string;
  province: string;
  cell: string;
  farmSizeHa: number;
  plots: number;
  irrigation: boolean;
  erosionControl: boolean;
  agroforestry: boolean;
  memberSince: number;
  quality: DataQuality;
}

export interface HarvestRecord {
  season: Season;
  year: number;
  crop: string;
  areaHa: number;
  harvestKg: number;
  yieldKgHa: number;
  inputCostRwf: number;
  marketValueRwf: number;
  lossKg: number;
  storageMethod: string;
  priceRwfKg: number;
  quality: DataQuality;
}

export interface InputEvent {
  date: string;
  crop: string;
  seedKg: number;
  organicKg: number;
  inorganicKg: number;
  pesticideL: number;
  costRwf: number;
  note: string;
}

export interface PredictionRecord {
  date: string;
  crop: string;
  season: Season;
  predictedKgHa: number;
  lowerKgHa: number;
  upperKgHa: number;
  actualKgHa: number | null;
  quality: DataQuality;
}

export interface MarketInteraction {
  date: string;
  crop: string;
  quantityKg: number;
  priceRwfKg: number;
  buyer: string;
  channel: string;
}

export const DEMO_FARM: FarmProfile = {
  id: "SIM-FARM-001",
  farmerName: "Demo Farmer (illustrative)",
  cooperative: "Musanze Highland Growers",
  district: "Musanze",
  province: "North",
  cell: "Illustrative cell",
  farmSizeHa: 1.2,
  plots: 3,
  irrigation: false,
  erosionControl: true,
  agroforestry: true,
  memberSince: 2019,
  quality: "simulated",
};

export const DEMO_HARVESTS: HarvestRecord[] = [
  {
    season: "A",
    year: 2023,
    crop: "Irish potato",
    areaHa: 0.6,
    harvestKg: 5200,
    yieldKgHa: 8667,
    inputCostRwf: 92000,
    marketValueRwf: 1664000,
    lossKg: 420,
    storageMethod: "Traditional granary",
    priceRwfKg: 320,
    quality: "simulated",
  },
  {
    season: "B",
    year: 2023,
    crop: "Beans",
    areaHa: 0.4,
    harvestKg: 260,
    yieldKgHa: 650,
    inputCostRwf: 38000,
    marketValueRwf: 169000,
    lossKg: 24,
    storageMethod: "Hermetic bag",
    priceRwfKg: 650,
    quality: "simulated",
  },
  {
    season: "A",
    year: 2024,
    crop: "Irish potato",
    areaHa: 0.7,
    harvestKg: 6400,
    yieldKgHa: 9143,
    inputCostRwf: 108000,
    marketValueRwf: 2048000,
    lossKg: 510,
    storageMethod: "Warehouse",
    priceRwfKg: 320,
    quality: "simulated",
  },
  {
    season: "B",
    year: 2024,
    crop: "Beans",
    areaHa: 0.45,
    harvestKg: 295,
    yieldKgHa: 656,
    inputCostRwf: 44000,
    marketValueRwf: 191750,
    lossKg: 18,
    storageMethod: "Hermetic bag",
    priceRwfKg: 650,
    quality: "simulated",
  },
  {
    season: "A",
    year: 2025,
    crop: "Irish potato",
    areaHa: 0.75,
    harvestKg: 7100,
    yieldKgHa: 9467,
    inputCostRwf: 121000,
    marketValueRwf: 2272000,
    lossKg: 360,
    storageMethod: "Improved silo",
    priceRwfKg: 320,
    quality: "simulated",
  },
  {
    season: "A",
    year: 2025,
    crop: "Maize",
    areaHa: 0.25,
    harvestKg: 470,
    yieldKgHa: 1880,
    inputCostRwf: 21000,
    marketValueRwf: 211500,
    lossKg: 15,
    storageMethod: "Improved silo",
    priceRwfKg: 450,
    quality: "simulated",
  },
];

export const DEMO_INPUT_HISTORY: InputEvent[] = [
  {
    date: "2025-09-12",
    crop: "Irish potato",
    seedKg: 1500,
    organicKg: 1200,
    inorganicKg: 60,
    pesticideL: 1.2,
    costRwf: 121000,
    note: "Improved seed + NPK blend",
  },
  {
    date: "2025-09-28",
    crop: "Maize",
    seedKg: 6,
    organicKg: 300,
    inorganicKg: 20,
    pesticideL: 0.4,
    costRwf: 21000,
    note: "Hybrid seed",
  },
  {
    date: "2025-03-05",
    crop: "Beans",
    seedKg: 18,
    organicKg: 400,
    inorganicKg: 0,
    pesticideL: 0,
    costRwf: 44000,
    note: "Local seed, manure only",
  },
  {
    date: "2024-09-10",
    crop: "Irish potato",
    seedKg: 1400,
    organicKg: 1000,
    inorganicKg: 50,
    pesticideL: 1.0,
    costRwf: 108000,
    note: "Improved seed",
  },
];

export const DEMO_PREDICTIONS: PredictionRecord[] = [
  {
    date: "2025-09-01",
    crop: "Irish potato",
    season: "A",
    predictedKgHa: 9200,
    lowerKgHa: 7800,
    upperKgHa: 10600,
    actualKgHa: 9467,
    quality: "simulated",
  },
  {
    date: "2025-09-01",
    crop: "Maize",
    season: "A",
    predictedKgHa: 1950,
    lowerKgHa: 1650,
    upperKgHa: 2250,
    actualKgHa: 1880,
    quality: "simulated",
  },
  {
    date: "2024-09-01",
    crop: "Irish potato",
    season: "A",
    predictedKgHa: 8900,
    lowerKgHa: 7500,
    upperKgHa: 10300,
    actualKgHa: 9143,
    quality: "simulated",
  },
  {
    date: "2024-09-01",
    crop: "Beans",
    season: "A",
    predictedKgHa: 640,
    lowerKgHa: 540,
    upperKgHa: 740,
    actualKgHa: 656,
    quality: "simulated",
  },
];

export const DEMO_MARKET_INTERACTIONS: MarketInteraction[] = [
  {
    date: "2026-01-20",
    crop: "Irish potato",
    quantityKg: 4000,
    priceRwfKg: 318,
    buyer: "Musanze market",
    channel: "Spot market",
  },
  {
    date: "2025-12-15",
    crop: "Maize",
    quantityKg: 300,
    priceRwfKg: 462,
    buyer: "Local trader",
    channel: "Private sale",
  },
  {
    date: "2025-06-02",
    crop: "Beans",
    quantityKg: 250,
    priceRwfKg: 640,
    buyer: "Cooperative",
    channel: "Collective sale",
  },
  {
    date: "2025-04-18",
    crop: "Irish potato",
    quantityKg: 1800,
    priceRwfKg: 305,
    buyer: "Kigali wholesaler",
    channel: "Wholesale",
  },
];

export const DEMO_FARM_INPUTS: Record<string, InputEvent> = DEMO_INPUT_HISTORY.reduce(
  (map, event, index) => {
    if (index === 0) map[event.crop] = event;
    return map;
  },
  {} as Record<string, InputEvent>,
);
