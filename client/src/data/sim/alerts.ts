// Demonstration agricultural alerts.
//
// Alerts are generated deterministically from the simulated datasets so the
// same inputs always produce the same set. They are illustrative, not a live
// notification service.

import { DISTRICTS } from "./districts";
import { weatherRisk } from "./weather";
import { districtPriceComparison } from "./market";
import type { DataQuality } from "./provenance";

export type AlertCategory = "rainfall" | "yield" | "price" | "storage";
export type AlertSeverity = "high" | "medium" | "low";

export interface AgriAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  detail: string;
  district: string;
  metric: string;
  suggestedAction: string;
  quality: DataQuality;
}

const CROP_FOR_RISK = "Maize";

function buildRainfallAlerts(): AgriAlert[] {
  const alerts: AgriAlert[] = [];
  for (const district of DISTRICTS) {
    const risk = weatherRisk(district.name, "B", 500);
    if (risk.level === "low") continue;
    alerts.push({
      id: `rain-${district.name}`,
      category: "rainfall",
      severity: risk.level === "high" ? "high" : "medium",
      title: risk.label,
      detail: `${district.name} (${district.province}): ${risk.reason}`,
      district: district.name,
      metric: risk.label,
      suggestedAction: risk.label.toLowerCase().includes("drought")
        ? "Confirm the seasonal forecast and consider supplementary irrigation or a drought-tolerant variety."
        : "Check plot drainage and monitor for fungal disease after heavy rain.",
      quality: "simulated",
    });
  }
  return alerts;
}

function buildPriceAlerts(): AgriAlert[] {
  const alerts: AgriAlert[] = [];
  const comparison = districtPriceComparison(CROP_FOR_RISK);
  const avg = comparison.reduce((sum, d) => sum + d.priceRwfKg, 0) / (comparison.length || 1);
  for (const row of comparison.slice(0, 3)) {
    const premium = avg > 0 ? ((row.priceRwfKg - avg) / avg) * 100 : 0;
    alerts.push({
      id: `price-${row.district}`,
      category: "price",
      severity: premium > 10 ? "medium" : "low",
      title: `${CROP_FOR_RISK} price above average`,
      detail: `Reference price in ${row.district} is ${row.priceRwfKg} RWF/kg, about ${premium.toFixed(1)}% above the district average (${avg.toFixed(0)} RWF/kg).`,
      district: row.district,
      metric: `${row.priceRwfKg} RWF/kg`,
      suggestedAction: "Compare transport costs before selling outside your district.",
      quality: "simulated",
    });
  }
  const lowest = comparison[comparison.length - 1];
  if (lowest) {
    alerts.push({
      id: `price-low-${lowest.district}`,
      category: "price",
      severity: "medium",
      title: `${CROP_FOR_RISK} price below average`,
      detail: `Reference price in ${lowest.district} is ${lowest.priceRwfKg} RWF/kg, the lowest of the 30 districts in this simulation.`,
      district: lowest.district,
      metric: `${lowest.priceRwfKg} RWF/kg`,
      suggestedAction: "Consider storage or a higher-value market if quality allows.",
      quality: "simulated",
    });
  }
  return alerts;
}

function buildYieldAnomalyAlerts(): AgriAlert[] {
  const alerts: AgriAlert[] = [];
  const checkpoints = ["Ruhango", "Ngororero", "Kicukiro", "Nyamasheke"];
  for (const name of checkpoints) {
    alerts.push({
      id: `yield-${name}`,
      category: "yield",
      severity: name === "Ruhango" || name === "Kicukiro" ? "medium" : "low",
      title: "Yield anomaly flagged",
      detail: `${name} shows a below-trend reference yield for the selected season in the demonstration model. Treat as a prompt to investigate, not a confirmed failure.`,
      district: name,
      metric: "Below trend",
      suggestedAction: "Review input use and soil condition with an extension officer.",
      quality: "simulated",
    });
  }
  return alerts;
}

function buildStorageAlerts(): AgriAlert[] {
  return [
    {
      id: "storage-open-air",
      category: "storage",
      severity: "high",
      title: "High storage loss risk",
      detail:
        "Open-air storage with humid conditions can lose a large share of the harvest within a few weeks in this demonstration model.",
      district: "Rwamagana",
      metric: "Loss risk: high",
      suggestedAction:
        "Move grain to a hermetic bag or improved silo and dry to a safe moisture level.",
      quality: "simulated",
    },
    {
      id: "storage-traditional",
      category: "storage",
      severity: "medium",
      title: "Moderate storage loss risk",
      detail:
        "Traditional granaries show moderate weekly losses for legumes and tubers in this demonstration model.",
      district: "Musanze",
      metric: "Loss risk: medium",
      suggestedAction: "Inspect stored produce weekly and remove affected material early.",
      quality: "simulated",
    },
  ];
}

export function buildAlerts(): AgriAlert[] {
  return [
    ...buildRainfallAlerts(),
    ...buildYieldAnomalyAlerts(),
    ...buildStorageAlerts(),
    ...buildPriceAlerts(),
  ];
}

export const ALERT_CATEGORY_LABELS: Record<AlertCategory, string> = {
  rainfall: "Rainfall risk",
  yield: "Yield anomaly",
  price: "Price movement",
  storage: "Storage loss",
};

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};
