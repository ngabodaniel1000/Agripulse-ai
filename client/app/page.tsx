import type { Metadata } from "next";
import { CropAnalysis } from "@/components/modules/CropAnalysis";

export const metadata: Metadata = {
  title: "Smart Crop & Input Analysis",
  description:
    "Compare crops, seed, fertilizer and pesticide patterns against simulated reference yields for a Rwanda district and season.",
  openGraph: {
    title: "Smart Crop & Input Analysis | AgriPulse",
    description:
      "Plain-language crop, input and yield comparison with simulated data clearly labelled.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function CropAnalysisPage() {
  return <CropAnalysis />;
}
