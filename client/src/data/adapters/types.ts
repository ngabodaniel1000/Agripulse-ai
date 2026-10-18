// Adapter contracts for future real-data integration.
//
// The demo works entirely with local simulated data. These interfaces define
// the shape a real integration must satisfy (NISR datasets, a CHIRPS-compatible
// rainfall service, a weather API and verified market prices) so the UI can be
// migrated without redesign.

import type { DataQuality } from "@/data/sim/provenance";

export interface AdapterMeta {
  id: string;
  name: string;
  provider: string;
  live: boolean;
  quality: DataQuality;
  note: string;
}

export interface AdapterResult<T> {
  data: T;
  meta: AdapterMeta;
  fetchedAt: string;
}

export interface NisrDatasetPoint {
  indicator: string;
  district: string;
  value: number;
  unit: string;
  period: string;
}

export interface NisrAdapter {
  meta: AdapterMeta;
  getDistrictIndicators(district: string): Promise<AdapterResult<NisrDatasetPoint[]>>;
}

export interface RainfallMonth {
  month: number;
  monthLabel: string;
  rainfallMm: number;
}

export interface RainfallSeries {
  year: number;
  district: string;
  months: RainfallMonth[];
}

export interface RainfallAdapter {
  meta: AdapterMeta;
  getMonthlyRainfall(district: string, year: number): Promise<AdapterResult<RainfallSeries>>;
}

export interface WeatherForecast {
  district: string;
  season: string;
  expectedRainfallMm: number;
  expectedTempC: number;
  riskLabel: string;
}

export interface WeatherAdapter {
  meta: AdapterMeta;
  getSeasonOutlook(district: string, season: string): Promise<AdapterResult<WeatherForecast>>;
}

export interface MarketQuote {
  crop: string;
  district: string;
  priceRwfKg: number;
  period: string;
}

export interface MarketAdapter {
  meta: AdapterMeta;
  getQuotes(crop: string): Promise<AdapterResult<MarketQuote[]>>;
}
