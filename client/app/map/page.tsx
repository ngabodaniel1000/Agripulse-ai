import type { Metadata } from "next";
import { RwandaMap } from "@/components/modules/RwandaMap";

export const metadata: Metadata = {
  title: "Rwanda Map",
  description:
    "Explore provinces in 3D and read the soil, rainfall and yield profile of every district.",
  openGraph: {
    title: "Rwanda Map | AgriPulse",
    description: "Interactive geography with simulated agronomic profiles.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RwandaMapPage() {
  return <RwandaMap />;
}
