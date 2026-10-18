import type { Metadata } from "next";
import { ExplainableAI } from "@/components/modules/ExplainableAI";

export const metadata: Metadata = {
  title: "Explainable AI",
  description:
    "See how every estimate is built, what each dataset is, and the honest limits of the engines.",
  openGraph: {
    title: "Explainable AI | AgriPulse",
    description: "Transparent methods and data provenance, no black boxes.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function ExplainableAIPage() {
  return <ExplainableAI />;
}
