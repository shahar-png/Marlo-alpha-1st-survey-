import type { Metadata, Viewport } from "next";
import "./globals.css";
import { STAGING } from "@/lib/staging-mode";

export const metadata: Metadata = {
  title: STAGING ? "Marlo · Quiz 2 staging" : "Marlo — the alpha",
  description: "Meet Marlo. Three months of your supplements, handled.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f2e9dd",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@400;500;600&family=Manrope:wght@400;500;600&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
