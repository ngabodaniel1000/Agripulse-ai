import type { Metadata } from "next";
import { Advisory } from "@/components/Dashboard";

export const metadata: Metadata = {
  title: "Soil–Climate Advisory",
  description:
    "Prepare a Rwanda soil-climate field assessment from user-reported soil tests and plot measurements.",
  openGraph: {
    title: "Soil–Climate Advisory | NISR Agricultural Intelligence",
    description:
      "Five-stage field assessment with downloadable PDF and SMS-ready summary for local review.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function AdvisoryPage() {
  return <Advisory />;
}
