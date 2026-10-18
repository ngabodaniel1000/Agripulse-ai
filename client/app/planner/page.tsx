import type { Metadata } from "next";
import { Planner } from "@/components/modules/Planner";

export const metadata: Metadata = {
  title: "Planner Dashboard",
  description:
    "National scale, crop mix, production and alert picture from one shared simulated data layer.",
  openGraph: {
    title: "Planner Dashboard | AgriPulse",
    description: "Whole-country planning view with simulated data clearly labelled.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function PlannerPage() {
  return <Planner />;
}
