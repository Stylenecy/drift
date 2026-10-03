"use client";

import type { CSSProperties, ReactNode } from "react";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { engineAvailable } from "@/features/trade/api";

const QUICK_START = "https://github.com/Stylenecy/seed-bnb/tree/dex/drift/drift#quick-start";

// The host never changes while the page is open, so there is nothing to subscribe to.
const subscribe = () => () => {};

// null on the server and during hydration; true/false once the browser knows its host.
function useEngineAvailable(): boolean | null {
  return useSyncExternalStore(subscribe, engineAvailable, () => null);
}

// Cockpit routes need the local engine. On the hosted demo they show one honest
// notice instead of mounting (so they never try to reach it). The MacroGuard
// route reads BNB Chain itself and always renders.
export function EngineGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const engine = useEngineAvailable();

  if (pathname === "/dashboard/macroguard") return <>{children}</>;
  if (engine === null) return null;
  if (engine) return <>{children}</>;

  return (
    <section role="status" className="ld-clip hud relative max-w-3xl bg-engine/[0.05] px-5 pb-6 pt-10 sm:px-8" style={{ "--d": "0s" } as CSSProperties}>
      <span className="meta absolute left-4 top-3 text-engine">(hosted demo · read-only)</span>
      <span className="meta absolute right-4 top-3 hidden text-mute sm:inline">engine: not on this host</span>
      <p className="display-3 text-bone">
        The engine runs on <span className="serif-i">your own machine.</span>
      </p>
      <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-mute">
        This hosted demo is read-only: the live risk gate is at{" "}
        <Link href="/macroguard" className="text-chain-soft underline underline-offset-2 hover:text-chain">
          /macroguard
        </Link>
        , and the README shows how to run the cockpit locally.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          href="/macroguard"
          className="inline-flex items-center gap-2 bg-chain px-4 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:bg-chain-soft"
        >
          Open the live risk gate →
        </Link>
        <a
          href={QUICK_START}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center border border-[var(--line-strong)] px-4 py-2.5 text-[13px] text-bone transition-colors hover:border-bone/50"
        >
          Run the cockpit locally ↗
        </a>
      </div>
    </section>
  );
}
