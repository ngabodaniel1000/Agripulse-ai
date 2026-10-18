// Centralized Rwanda district reference data for the demonstration workspaces.
//
// Provinces are structural and publicly known. Coordinates, elevation,
// rainfall and temperature values are calibrated approximations for the demo
// and are tagged `simulated` — they must not be read as official measurements.

import type { DataQuality } from "./provenance";

export type ProvinceKey = "Kigali" | "South" | "West" | "North" | "East";

export interface District {
  name: string;
  province: ProvinceKey;
  /** Approximate centroid latitude (decimal degrees). */
  lat: number;
  /** Approximate centroid longitude (decimal degrees). */
  lng: number;
  /** Approximate mean elevation, metres. */
  elevationM: number;
  /** Approximate annual rainfall, millimetres. */
  annualRainfallMm: number;
  /** Approximate mean air temperature, degrees Celsius. */
  meanTempC: number;
  /** Dominant soil association for the demonstration. */
  dominantSoil: SoilType;
  quality: DataQuality;
}

export type SoilType = "Volcanic" | "Loam" | "Clay" | "Sandy" | "Peat";

export const PROVINCES: ProvinceKey[] = ["Kigali", "South", "West", "North", "East"];

export const PROVINCE_LABELS: Record<ProvinceKey, string> = {
  Kigali: "City of Kigali",
  South: "Southern Province",
  West: "Western Province",
  North: "Northern Province",
  East: "Eastern Province",
};

export const DISTRICTS: District[] = [
  {
    name: "Nyarugenge",
    province: "Kigali",
    lat: -1.954,
    lng: 30.061,
    elevationM: 1480,
    annualRainfallMm: 990,
    meanTempC: 20.5,
    dominantSoil: "Loam",
    quality: "simulated",
  },
  {
    name: "Gasabo",
    province: "Kigali",
    lat: -1.923,
    lng: 30.15,
    elevationM: 1540,
    annualRainfallMm: 1010,
    meanTempC: 20.2,
    dominantSoil: "Loam",
    quality: "simulated",
  },
  {
    name: "Kicukiro",
    province: "Kigali",
    lat: -1.983,
    lng: 30.1,
    elevationM: 1510,
    annualRainfallMm: 980,
    meanTempC: 20.4,
    dominantSoil: "Clay",
    quality: "simulated",
  },
  {
    name: "Nyanza",
    province: "South",
    lat: -2.35,
    lng: 29.75,
    elevationM: 1690,
    annualRainfallMm: 1120,
    meanTempC: 19.4,
    dominantSoil: "Loam",
    quality: "simulated",
  },
  {
    name: "Gisagara",
    province: "South",
    lat: -2.467,
    lng: 29.85,
    elevationM: 1560,
    annualRainfallMm: 1080,
    meanTempC: 20.0,
    dominantSoil: "Clay",
    quality: "simulated",
  },
  {
    name: "Nyaruguru",
    province: "South",
    lat: -2.617,
    lng: 29.583,
    elevationM: 1880,
    annualRainfallMm: 1240,
    meanTempC: 18.4,
    dominantSoil: "Clay",
    quality: "simulated",
  },
  {
    name: "Huye",
    province: "South",
    lat: -2.6,
    lng: 29.733,
    elevationM: 1660,
    annualRainfallMm: 1160,
    meanTempC: 19.6,
    dominantSoil: "Loam",
    quality: "simulated",
  },
  {
    name: "Nyamagabe",
    province: "South",
    lat: -2.467,
    lng: 29.467,
    elevationM: 1930,
    annualRainfallMm: 1310,
    meanTempC: 18.0,
    dominantSoil: "Clay",
    quality: "simulated",
  },
  {
    name: "Ruhango",
    province: "South",
    lat: -2.183,
    lng: 29.783,
    elevationM: 1620,
    annualRainfallMm: 1060,
    meanTempC: 19.9,
    dominantSoil: "Loam",
    quality: "simulated",
  },
  {
    name: "Muhanga",
    province: "South",
    lat: -2.083,
    lng: 29.75,
    elevationM: 1720,
    annualRainfallMm: 1090,
    meanTempC: 19.2,
    dominantSoil: "Loam",
    quality: "simulated",
  },
  {
    name: "Kamonyi",
    province: "South",
    lat: -2.0,
    lng: 29.85,
    elevationM: 1580,
    annualRainfallMm: 1040,
    meanTempC: 20.1,
    dominantSoil: "Loam",
    quality: "simulated",
  },
  {
    name: "Karongi",
    province: "West",
    lat: -2.0,
    lng: 29.4,
    elevationM: 1810,
    annualRainfallMm: 1300,
    meanTempC: 18.8,
    dominantSoil: "Clay",
    quality: "simulated",
  },
  {
    name: "Rutsiro",
    province: "West",
    lat: -1.85,
    lng: 29.317,
    elevationM: 1980,
    annualRainfallMm: 1390,
    meanTempC: 17.9,
    dominantSoil: "Loam",
    quality: "simulated",
  },
  {
    name: "Rubavu",
    province: "West",
    lat: -1.683,
    lng: 29.267,
    elevationM: 1560,
    annualRainfallMm: 1210,
    meanTempC: 20.3,
    dominantSoil: "Volcanic",
    quality: "simulated",
  },
  {
    name: "Nyabihu",
    province: "West",
    lat: -1.65,
    lng: 29.5,
    elevationM: 2150,
    annualRainfallMm: 1420,
    meanTempC: 16.5,
    dominantSoil: "Volcanic",
    quality: "simulated",
  },
  {
    name: "Ngororero",
    province: "West",
    lat: -1.867,
    lng: 29.617,
    elevationM: 1900,
    annualRainfallMm: 1330,
    meanTempC: 18.1,
    dominantSoil: "Clay",
    quality: "simulated",
  },
  {
    name: "Rusizi",
    province: "West",
    lat: -2.483,
    lng: 29.0,
    elevationM: 1480,
    annualRainfallMm: 1180,
    meanTempC: 21.0,
    dominantSoil: "Sandy",
    quality: "simulated",
  },
  {
    name: "Nyamasheke",
    province: "West",
    lat: -2.333,
    lng: 29.133,
    elevationM: 1620,
    annualRainfallMm: 1270,
    meanTempC: 19.5,
    dominantSoil: "Clay",
    quality: "simulated",
  },
  {
    name: "Rulindo",
    province: "North",
    lat: -1.767,
    lng: 30.067,
    elevationM: 1780,
    annualRainfallMm: 1150,
    meanTempC: 18.6,
    dominantSoil: "Loam",
    quality: "simulated",
  },
  {
    name: "Gakenke",
    province: "North",
    lat: -1.7,
    lng: 29.783,
    elevationM: 1880,
    annualRainfallMm: 1240,
    meanTempC: 17.8,
    dominantSoil: "Volcanic",
    quality: "simulated",
  },
  {
    name: "Musanze",
    province: "North",
    lat: -1.5,
    lng: 29.633,
    elevationM: 1850,
    annualRainfallMm: 1230,
    meanTempC: 18.0,
    dominantSoil: "Volcanic",
    quality: "simulated",
  },
  {
    name: "Burera",
    province: "North",
    lat: -1.467,
    lng: 29.85,
    elevationM: 2050,
    annualRainfallMm: 1290,
    meanTempC: 16.9,
    dominantSoil: "Volcanic",
    quality: "simulated",
  },
  {
    name: "Gicumbi",
    province: "North",
    lat: -1.583,
    lng: 30.1,
    elevationM: 1960,
    annualRainfallMm: 1180,
    meanTempC: 17.5,
    dominantSoil: "Loam",
    quality: "simulated",
  },
  {
    name: "Rwamagana",
    province: "East",
    lat: -1.95,
    lng: 30.433,
    elevationM: 1450,
    annualRainfallMm: 870,
    meanTempC: 21.2,
    dominantSoil: "Sandy",
    quality: "simulated",
  },
  {
    name: "Nyagatare",
    province: "East",
    lat: -1.3,
    lng: 30.333,
    elevationM: 1380,
    annualRainfallMm: 790,
    meanTempC: 22.0,
    dominantSoil: "Sandy",
    quality: "simulated",
  },
  {
    name: "Gatsibo",
    province: "East",
    lat: -1.6,
    lng: 30.433,
    elevationM: 1480,
    annualRainfallMm: 850,
    meanTempC: 21.0,
    dominantSoil: "Loam",
    quality: "simulated",
  },
  {
    name: "Kayonza",
    province: "East",
    lat: -1.883,
    lng: 30.617,
    elevationM: 1420,
    annualRainfallMm: 810,
    meanTempC: 21.5,
    dominantSoil: "Sandy",
    quality: "simulated",
  },
  {
    name: "Kirehe",
    province: "East",
    lat: -2.283,
    lng: 30.7,
    elevationM: 1460,
    annualRainfallMm: 840,
    meanTempC: 21.1,
    dominantSoil: "Sandy",
    quality: "simulated",
  },
  {
    name: "Ngoma",
    province: "East",
    lat: -2.167,
    lng: 30.467,
    elevationM: 1510,
    annualRainfallMm: 880,
    meanTempC: 20.8,
    dominantSoil: "Clay",
    quality: "simulated",
  },
  {
    name: "Bugesera",
    province: "East",
    lat: -2.2,
    lng: 30.2,
    elevationM: 1430,
    annualRainfallMm: 820,
    meanTempC: 21.6,
    dominantSoil: "Sandy",
    quality: "simulated",
  },
];

export const DISTRICT_NAMES = DISTRICTS.map((d) => d.name);

const BY_NAME = new Map(DISTRICTS.map((d) => [d.name, d]));

export function getDistrict(name: string): District | undefined {
  return BY_NAME.get(name);
}

export function provinceOf(district: string): ProvinceKey {
  return BY_NAME.get(district)?.province ?? "South";
}

export function districtsInProvince(province: ProvinceKey): District[] {
  return DISTRICTS.filter((d) => d.province === province);
}
