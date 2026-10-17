import type { Metadata } from "next";
import { Reports } from "@/components/Dashboard";

export const metadata: Metadata = {
  title: "Source Reports",
  description:
    "Read original NISR agricultural, food balance, enterprise, population, industrial production and trade reports.",
  openGraph: {
    title: "Source Reports | NISR Agricultural Intelligence",
    description:
      "Trace dashboard statistics to the nine uploaded source publications and export crop data.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function ReportsPage() {
  return <Reports />;
}
