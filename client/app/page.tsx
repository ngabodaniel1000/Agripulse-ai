import type { Metadata } from "next";
import { Market } from "@/components/Dashboard";

export const metadata: Metadata = {
  title: "Market Dominance",
  description:
    "Explore Rwanda crop adoption, food self-sufficiency and import substitution opportunities from NISR reports.",
  openGraph: {
    title: "Market Dominance | NISR Agricultural Intelligence",
    description:
      "Source-backed crop adoption and national agricultural decision support for Rwanda.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function HomePage() {
  return <Market />;
}
