import type { Metadata } from "next";
import { InputCombinations } from "@/components/modules/InputCombinations";

export const metadata: Metadata = {
  title: "Input Combination Intelligence",
  description:
    "Compare every combination of improved seed, fertilizer and crop protection for yield, cost and net benefit.",
  openGraph: {
    title: "Input Combination Intelligence | AgriPulse",
    description:
      "Trade-off comparison of 16 input combinations with simulated data clearly labelled.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function InputCombinationsPage() {
  return <InputCombinations />;
}
