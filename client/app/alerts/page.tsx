import type { Metadata } from "next";
import { Alerts } from "@/components/modules/Alerts";

export const metadata: Metadata = {
  title: "Agricultural Alerts",
  description:
    "Rainfall, price, yield and storage prompts for every district, each with a suggested next step.",
  openGraph: {
    title: "Agricultural Alerts | AgriPulse",
    description: "Deterministic demonstration alerts with clear actions.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function AlertsPage() {
  return <Alerts />;
}
