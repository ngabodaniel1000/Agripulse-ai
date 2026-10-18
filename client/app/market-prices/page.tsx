import type { Metadata } from "next";
import { MarketPrices } from "@/components/modules/MarketPrices";

export const metadata: Metadata = {
  title: "Market Prices",
  description:
    "Twelve-month reference price patterns, district comparison and a clear rising or falling signal.",
  openGraph: {
    title: "Market Prices | AgriPulse",
    description: "Simulated e-Soko style reference prices, not live quotes.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function MarketPricesPage() {
  return <MarketPrices />;
}
