"use client";

import type { ReactNode } from "react";
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
    <section
      role="status"
      className="max-w-2xl rounded-2xl border border-[#9aa8f0]/25 bg-[#9aa8f0]/[0.06] p-5 text-sm leading-relaxed text-white/80 sm:p-6"
    >
      <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-[#9aa8f0]">
        Hosted demo · read-only
      </div>
      <p className="mt-3 text-[15px] text-white">
        The quant engine runs on your own machine. This hosted demo is read-only: the live risk gate is at{" "}
        <Link href="/macroguard" className="text-[#f8d36a] underline underline-offset-2 hover:text-[#f0b90b]">
          /macroguard
        </Link>
        , and the README shows how to run the cockpit locally.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/macroguard"
          className="inline-flex items-center rounded-lg bg-[#f0b90b] px-3 py-1.5 text-[12.5px] font-semibold text-[#1a1405] transition hover:bg-[#f8d36a]"
        >
          Open the live risk gate →
        </Link>
        <a
          href={QUICK_START}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg border border-white/20 px-3 py-1.5 text-[12.5px] text-white/85 transition hover:border-white/40"
        >
          Run the cockpit locally ↗
        </a>
      </div>
    </section>
  );
}
