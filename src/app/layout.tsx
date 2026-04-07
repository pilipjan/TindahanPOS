import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TindahanPOS — Cloud POS for Philippine MSMEs",
  description:
    "The modern, offline-ready Point of Sale system built for Filipino small businesses. BIR-compliant receipts, real-time inventory, GCash & Maya payments.",
  keywords: [
    "POS",
    "Point of Sale",
    "Philippines",
    "MSME",
    "BIR compliant",
    "GCash",
    "Maya",
    "inventory management",
    "cloud POS",
  ],
  authors: [{ name: "TindahanPOS" }],
  openGraph: {
    title: "TindahanPOS — Cloud POS for Philippine MSMEs",
    description:
      "The modern, offline-ready Point of Sale system built for Filipino small businesses.",
    type: "website",
    locale: "en_PH",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#0a0e1a" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-sans)" }}>
        {children}
      </body>
    </html>
  );
}
