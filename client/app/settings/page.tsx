import type { Metadata } from "next";
import { SettingsPage } from "@/components/Dashboard";

export const metadata: Metadata = {
  title: "Workspace Settings",
  description:
    "Set role and advisory geography context for the NISR agricultural intelligence workspace.",
  openGraph: {
    title: "Workspace Settings | NISR Agricultural Intelligence",
    description:
      "Manage session preferences and download a workspace context note.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function SettingsRoute() {
  return <SettingsPage />;
}
