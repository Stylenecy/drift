import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/features/landing/components/Nav";

export const metadata: Metadata = {
  title: "Not found — DRIFT",
};

// 404 in the house style: the page is missing, the gate is not.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-ink text-bone">
      <Nav solid />
      <main className="hero-x relative isolate flex flex-1 items-center overflow-hidden px-[var(--gx)] pb-10 pt-[84px]">
        <div aria-hidden className="ld-clip pointer-events-none absolute inset-y-0 left-[var(--gx)] right-[var(--gx)] -z-10 grid-12" style={{ "--d": "0s" } as CSSProperties} />
        <div className="hud relative w-full px-5 pb-8 pt-12 sm:px-10 sm:pb-12 sm:pt-16">
          <span className="meta absolute left-4 top-3 text-mute">DRIFT — 404</span>
          <span className="meta absolute right-4 top-3 hidden text-mute sm:inline">no such route</span>
          <p className="ld-lines display font-mono tracking-[-0.06em] text-bone">
            <span className="ln">
              <span className="ln-i" style={{ "--i": 0 } as CSSProperties}>
                404
              </span>
            </span>
          </p>
          <h1 className="serif-i ld-up mt-6 text-[30px] leading-[1.1] text-bone sm:text-[44px]" style={{ "--d": "0.45s" } as CSSProperties}>
            This page is not on the record.
          </h1>
          <p className="ld-up mt-4 max-w-[46ch] text-[16px] leading-relaxed text-mute" style={{ "--d": "0.55s" } as CSSProperties}>
            The address you followed does not exist here. The risk gate does: it is a public contract on BSC Testnet, and its
            page reads it live.
          </p>
          <div className="ld-up mt-9 flex flex-wrap items-center gap-x-6 gap-y-4" style={{ "--d": "0.65s" } as CSSProperties}>
            <Link href="/macroguard" className="inline-flex items-center gap-3 bg-chain px-5 py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-chain-soft">
              Inspect the live guard <span aria-hidden>→</span>
            </Link>
            <Link href="/" className="text-[14px] text-bone">
              <span className="u-draw pb-0.5">Back to the start</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
