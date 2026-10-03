import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { MotionBoot } from "@/features/motion/Motion";
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

// One serif-italic phrase per screen (DEX-MOTION-LANGUAGE.md §2).
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: "italic",
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

export const viewport: Viewport = {
  themeColor: "#0c0d0d",
  colorScheme: "dark",
};

// Runs before first paint. html.has-js says JavaScript runs (live reads can work).
// With no reduced-motion preference it also sets html.js, which arms the reveal
// start states in globals.css; if the motion code has not booted 4 s later, it
// takes html.js away again so nothing stays hidden.
const BOOT = `(function(){try{var d=document.documentElement;d.classList.add('has-js');if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('js');setTimeout(function(){if(!window.__rv)d.classList.remove('js')},4000)}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body className="min-h-full">
        <MotionBoot />
        <AuthProvider enabled={AUTH_ENABLED}>{children}</AuthProvider>
      </body>
    </html>
  );
}
