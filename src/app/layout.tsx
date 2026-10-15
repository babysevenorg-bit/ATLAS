import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas Academy — Learn the markets, understand the risk",
  description: "A thoughtful trading education workspace. Learn forex fundamentals, check your understanding, and practise risk decisions with virtual examples.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
