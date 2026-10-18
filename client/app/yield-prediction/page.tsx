import type { Metadata } from "next";
import { YieldPrediction } from "@/components/modules/YieldPrediction";

export const metadata: Metadata = {
  title: "Crop Yield Prediction",
  description:
    "Estimate crop yield from plot, soil and planned inputs using a transparent demonstration calculation.",
  openGraph: {
    title: "Crop Yield Prediction | AgriPulse",
    description:
      "Transparent yield estimate with every assumption listed and simulated data labelled.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function YieldPredictionPage() {
  return <YieldPrediction />;
}
