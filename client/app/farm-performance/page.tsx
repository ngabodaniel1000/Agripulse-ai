import type { Metadata } from "next";
import { FarmPerformance } from "@/components/modules/FarmPerformance";

export const metadata: Metadata = {
  title: "Farm Performance",
  description:
    "Harvest, cost, margin and estimate accuracy for one illustrative smallholder household.",
  openGraph: {
    title: "Farm Performance | AgriPulse",
    description: "Season-by-season performance tracking with simulated data labelled.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function FarmPerformancePage() {
  return <FarmPerformance />;
}
