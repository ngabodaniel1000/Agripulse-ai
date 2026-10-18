import type { Metadata } from "next";
import { Weather } from "@/components/modules/Weather";

export const metadata: Metadata = {
  title: "Weather Intelligence",
  description:
    "Monthly rainfall and temperature profiles with a transparent rainfall-risk read-out per district and season.",
  openGraph: {
    title: "Weather Intelligence | AgriPulse",
    description: "Simulated seasonal outlook with explainable rainfall risk.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function WeatherPage() {
  return <Weather />;
}
