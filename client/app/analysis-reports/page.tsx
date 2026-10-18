import type { Metadata } from "next";
import { AnalysisReports } from "@/components/modules/AnalysisReports";

export const metadata: Metadata = {
  title: "Analytical Reports",
  description:
    "Build a crop, district and season report, preview it, and download it as PDF or CSV.",
  openGraph: {
    title: "Analytical Reports | AgriPulse",
    description: "Generate shareable documents from simulated module data.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function AnalysisReportsPage() {
  return <AnalysisReports />;
}
