import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

// Self-hosted type. The design leans on Manrope (headings), DM Sans (body),
// JetBrains Mono (numbers/code) and Bebas Neue (ranking numerals). Previously
// these came from a fonts.googleapis.com @import, so any blocked/slow request
// silently dropped the whole typographic identity to a system fallback.
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/bebas-neue/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas Academy — Learn the markets, understand the risk",
  description:
    "A thoughtful trading education workspace. Learn forex fundamentals, check your understanding, and practise risk decisions with virtual examples.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Atlas Academy",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon-32x32.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4d3a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
