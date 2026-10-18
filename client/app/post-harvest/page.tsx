import type { Metadata } from "next";
import { PostHarvest } from "@/components/modules/PostHarvest";

export const metadata: Metadata = {
  title: "Post-Harvest Loss Analyzer",
  description:
    "Compare storage methods by expected loss and cost, and see how heat and humidity change the picture.",
  openGraph: {
    title: "Post-Harvest Loss Analyzer | AgriPulse",
    description: "Storage loss comparison with simulated data clearly labelled.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function PostHarvestPage() {
  return <PostHarvest />;
}
