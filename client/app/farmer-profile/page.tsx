import type { Metadata } from "next";
import { FarmerProfile } from "@/components/modules/FarmerProfile";

export const metadata: Metadata = {
  title: "Farmer Profile",
  description:
    "A single consistent demonstration household linking the farm, input, market and estimate data.",
  openGraph: {
    title: "Farmer Profile | AgriPulse",
    description: "Illustrative household profile with simulated data labelled.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function FarmerProfilePage() {
  return <FarmerProfile />;
}
