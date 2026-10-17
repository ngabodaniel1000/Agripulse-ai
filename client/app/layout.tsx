import type { Metadata } from "next";
import "../src/styles.css";

export const metadata: Metadata = {
  title: {
    default: "NISR Agricultural Intelligence",
    template: "%s | NISR Agricultural Intelligence",
  },
  description:
    "Rwanda agricultural market intelligence, source reports and field assessment drafts.",
  authors: [{ name: "NISR" }],
  openGraph: {
    title: "NISR Agricultural Intelligence",
    description: "Data-informed agricultural decisions for Rwanda.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;450;500;550;600;650;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
