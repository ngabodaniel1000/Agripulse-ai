// src/lib/api/agripulse.ts
const API_BASE =
  process.env.NEXT_PUBLIC_AGRIPULSE_API_URL ?? "https://agripulse-ai-pbyp.onrender.com";

export interface InputStrategy {
  improved_seed: 0 | 1;
  organic: 0 | 1;
  inorganic: 0 | 1;
  pesticide: 0 | 1;
}

export interface InputRecommendation {
  strategy: InputStrategy;
  expected_yield_kg_ha: number;
  yield_lower_kg_ha: number;
  yield_upper_kg_ha: number;
}

export type BudgetLevel = "low" | "medium" | "high";

export interface InputOptimizerRequest {
  district: string;
  crop: string;
  season: "A" | "B" | "C";
  farm_size_ha: number;
  budget_level: BudgetLevel;
}

export interface InputOptimizerResponse {
  success: boolean;
  recommendations?: InputRecommendation[];
  error?: string;
}

export async function fetchInputOptimizer(
  payload: InputOptimizerRequest,
): Promise<InputOptimizerResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/input-optimizer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        success: false,
        error: `HTTP ${res.status}: ${text || res.statusText}`,
      };
    }

    return (await res.json()) as InputOptimizerResponse;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function fetchHealth(): Promise<{
  status: string;
  engines: Record<string, boolean>;
} | null> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// src/lib/api/agripulse.ts  (append this at the end)

// ──────────────────────────────────────────────────────────────────
// ENGINE 2 — YIELD PREDICTOR
// ──────────────────────────────────────────────────────────────────

export interface YieldPredictorRequest {
  district: string;
  crop: string;
  season: "A" | "B" | "C";
  soil_type: string;
  farm_size_ha: number;
  elevation_m: number;
  rainfall_mm: number;
  temperature_c: number;
  used_improved_seed: 0 | 1;
  used_organic_fertilizer: 0 | 1;
  used_inorganic_fertilizer: 0 | 1;
  used_pesticide: 0 | 1;
  used_irrigation: 0 | 1;
  used_erosion_control: 0 | 1;
  used_agroforestry: 0 | 1;
}

export interface YieldPrediction {
  predicted_yield_kg_ha: number;
  yield_lower_kg_ha: number;
  yield_upper_kg_ha: number;
  confidence_level_pct: number;
}

export interface YieldExplanation {
  predicted_yield_kg_ha: number;
  factor_importance_pct: Record<string, number>;
}

export interface YieldPredictorResponse {
  success: boolean;
  prediction?: YieldPrediction;
  explanation?: YieldExplanation;
  error?: string;
}

export async function fetchYieldPredictor(
  payload: YieldPredictorRequest,
): Promise<YieldPredictorResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/yield-predictor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        success: false,
        error: `HTTP ${res.status}: ${text || res.statusText}`,
      };
    }

    return (await res.json()) as YieldPredictorResponse;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

// ──────────────────────────────────────────────────────────────────
// ENGINE 3 — MARKET & POST-HARVEST INTELLIGENCE
// ──────────────────────────────────────────────────────────────────

export interface MarketPredictorRequest {
  district: string;
  crop: string;
  season: "A" | "B" | "C";
  harvest_quantity_kg: number;
  current_price_rwf_kg: number;
  price_trend_pct: number;
  storage_method: string;
  storage_duration_weeks: number;
  storage_cost_per_kg_week: number;
  humidity_pct: number;
  temperature_c: number;
  total_loss_rate_pct: number;
}

export interface MarketPrediction {
  recommendation: "STORE" | "SELL NOW";
  store_probability_pct: number;
  sell_probability_pct: number;
  net_gain_from_storing_rwf: number;
  revenue_if_sell_now_rwf: number;
  revenue_if_store_rwf: number;
  post_harvest_loss_risk: "Low" | "Medium" | "High";
  loss_rate_pct: number;
}

export interface MarketPredictorResponse {
  success: boolean;
  result?: MarketPrediction;
  error?: string;
}

export async function fetchMarketIntelligence(
  payload: MarketPredictorRequest,
): Promise<MarketPredictorResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/market-intelligence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        success: false,
        error: `HTTP ${res.status}: ${text || res.statusText}`,
      };
    }

    return (await res.json()) as MarketPredictorResponse;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Derive a reasonable loss-rate estimate for the Flask payload.
 * Flask expects `total_loss_rate_pct` in the request, but the user
 * shouldn't have to know how to calculate it. We estimate it here
 * based on storage method, duration, and environmental conditions.
 *
 * Values are informed by FAO post-harvest literature and match
 * the ranges used in the synthetic training data generator.
 */
export function estimateLossRate(
  storageMethod: string,
  weeks: number,
  humidity: number,
  temperature: number,
  crop: string,
): number {
  const basePerWeek: Record<string, number> = {
    "Traditional granary": 0.015,
    "Hermetic bag": 0.002,
    Warehouse: 0.008,
    "Open air": 0.025,
    "Improved silo": 0.004,
  };
  const cropMult: Record<string, number> = {
    Maize: 1.0,
    Beans: 1.2,
    "Irish potato": 1.8,
    Cassava: 1.5,
    "Sweet potato": 1.7,
    "Paddy rice": 0.8,
    Banana: 2.0,
    Vegetables: 2.5,
  };
  const base = basePerWeek[storageMethod] ?? 0.01;
  const cropFactor = cropMult[crop] ?? 1.0;
  const envFactor = 1.0 + Math.max(0, humidity - 70) * 0.01 + Math.max(0, temperature - 25) * 0.02;
  const weekly = base * cropFactor * envFactor;
  const total = (1 - Math.pow(1 - weekly, Math.max(0, weeks))) * 100;
  return Math.min(95, Math.max(0, total));
}

/**
 * Storage costs per kg per week by method.
 * Used to populate the Flask payload.
 */
export function storageCostPerKgWeek(storageMethod: string): number {
  const costs: Record<string, number> = {
    "Traditional granary": 2,
    "Hermetic bag": 5,
    Warehouse: 10,
    "Open air": 1,
    "Improved silo": 8,
  };
  return costs[storageMethod] ?? 3;
}
