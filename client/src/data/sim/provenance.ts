// Data provenance and quality labels.
//
// AgriPulse deliberately separates what is observed in official statistics
// from what is derived, synthesized or simulated. Every dataset in
// `src/data/sim` is tagged with one of these qualities so the interface can
// never present a fabricated number as a verified observation.

export type DataQuality = "observed" | "derived" | "synthesized" | "simulated";

export interface DataQualityMeta {
  key: DataQuality;
  label: string;
  short: string;
  description: string;
  /** Semantic status token used for badges (never colour alone). */
  tone: "success" | "info" | "warning" | "neutral";
}

export const DATA_QUALITY: Record<DataQuality, DataQualityMeta> = {
  observed: {
    key: "observed",
    label: "Observed (source report)",
    short: "Observed",
    description: "Copied from an official NISR publication table.",
    tone: "success",
  },
  derived: {
    key: "derived",
    label: "Derived from observations",
    short: "Derived",
    description: "Calculated from published values using documented arithmetic.",
    tone: "info",
  },
  synthesized: {
    key: "synthesized",
    label: "Synthesized (agronomic range)",
    short: "Synthesized",
    description: "Not published by NISR — assumed from agronomic literature for demonstration.",
    tone: "warning",
  },
  simulated: {
    key: "simulated",
    label: "Simulated (demonstration)",
    short: "Simulated",
    description: "Generated with a transparent demonstration algorithm, not a trained model.",
    tone: "neutral",
  },
};

export const SIMULATION_DISCLAIMER =
  "Demonstration data. Values are simulated for illustration and are not verified NISR statistics, live market prices, real weather observations or validated model predictions.";

export const SIMULATION_SHORT = "Simulated demonstration data";

export function qualityLabel(quality: DataQuality): string {
  return DATA_QUALITY[quality].label;
}
