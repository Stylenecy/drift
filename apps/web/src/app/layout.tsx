import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { AUTH_ENABLED } from "@/lib/auth";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE = "DRIFT — a trading bot whose risk rules you can verify on BNB Chain";
const DESCRIPTION =
  "DRIFT's quant engine runs off-chain; its risk gate, MacroGuard, is a public contract on BNB Smart Chain Testnet. See what the bot may do right now, ask the live contract a what-if, and open every receipt on BscScan. No login, no wallet.";

export const metadata: Metadata = {
  // Production domain, so Open Graph and Twitter image URLs are absolute.
  metadataBase: new URL("https://drift-macroguard.vercel.app"),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "DRIFT",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "DRIFT",
    locale: "en_US",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  // Public commit id of this build, so anyone can check which commit a deployment serves.
  other: { "build-sha": process.env.NEXT_PUBLIC_BUILD_SHA ?? "local" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AuthProvider enabled={AUTH_ENABLED}>{children}</AuthProvider>
      </body>
    </html>
  );
}
