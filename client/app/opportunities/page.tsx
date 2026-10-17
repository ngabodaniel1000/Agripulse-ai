import type { Metadata } from "next";
import { Opportunities } from "@/components/Dashboard";

export const metadata: Metadata = {
  title: "Crop Opportunities",
  description:
    "Identify import substitution and nutrition priorities from Rwanda Food Balance Sheets and prepare campaign briefs.",
  openGraph: {
    title: "Crop Opportunities | NISR Agricultural Intelligence",
    description:
      "Explore vegetable oils, sugar and fish import dependency and actionable promotion drafts.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function OpportunitiesPage() {
  return <Opportunities />;
}
