import type { Metadata } from "next";
import { SellOrStore } from "@/components/modules/SellOrStore";

export const metadata: Metadata = {
  title: "Sell vs Store",
  description:
    "Compare selling now with storing, after spoilage, storage cost and an expected price change.",
  openGraph: {
    title: "Sell vs Store | AgriPulse",
    description: "Plain-language sell-or-store recommendation from simulated data.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function SellOrStorePage() {
  return <SellOrStore />;
}
