import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agentic Accounting",
  description:
    "Australian double-entry accounting, practice workflows, and AI-assisted bookkeeping.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body
        className={`${figtree.variable} ${fraunces.variable} antialiased`}
        style={
          {
            "--font-sans": "var(--font-figtree), sans-serif",
            "--font-display": "var(--font-fraunces), serif",
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
