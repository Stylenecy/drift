"use client";

import { Fragment } from "react";
import { Ticker } from "@/features/motion/Motion";
import { useGuardLive } from "@/features/guard/useGuardLive";
import { DEX_GUARD, SMOKE_TEST, short } from "@/features/guard/evidence";

// A thin band of machine text under the hero. Live values only after this
// browser read the contract; otherwise it says so and lists static, dated evidence.

const REGIMES = ["RISK OFF", "NEUTRAL", "RISK ON"] as const;

export function LiveTicker() {
  const live = useGuardLive();
  let items: { text: string; tone?: "chain" | "ok" | "veto" }[];

  if (live.status === "live") {
    const s = live.read.state;
    items = [
      { text: `LIVE READ · BLOCK ${live.read.block.toLocaleString("en-US")}`, tone: "ok" },
      { text: `REGIME ${s.regime != null ? REGIMES[s.regime] ?? "UNKNOWN" : "UNKNOWN"}` },
      { text: s.halted ? "HALTED · ONLY FLAT" : "RUNNING · NO HALT", tone: s.halted ? "veto" : undefined },
      ...(["long", "short", "flat"] as const).map((sig) => ({
        text: `${sig.toUpperCase()} ${s.allowed?.[sig] ? "ALLOWED" : "BLOCKED"}`,
        tone: s.allowed?.[sig] ? undefined : ("veto" as const),
      })),
      { text: `HALT LINE ${(s.max_drawdown_bps ?? DEX_GUARD.maxDrawdownBps).toLocaleString("en-US")} BPS`, tone: "chain" },
      { text: `${s.decision_count ?? "?"} DECISIONS ON RECORD` },
      { text: `CONTRACT ${short(DEX_GUARD.address, 6, 4)}`, tone: "chain" },
      { text: "SOURCE VERIFIED ON SOURCIFY · EXACT MATCH" },
    ];
  } else if (live.status === "loading") {
    items = [{ text: "READING BSC TESTNET FROM YOUR BROWSER" }, { text: `CONTRACT ${short(DEX_GUARD.address, 6, 4)}`, tone: "chain" }, { text: "CHAIN 97" }];
  } else {
    items = [
      { text: "LIVE READ UNAVAILABLE · NO LIVE CLAIM", tone: "veto" },
      { text: `STATIC EVIDENCE · ${SMOKE_TEST.length} RECEIPTS · STATUS 1 · ${DEX_GUARD.testedOn}` },
      { text: `CONTRACT ${short(DEX_GUARD.address, 6, 4)}`, tone: "chain" },
      { text: "SOURCE VERIFIED ON SOURCIFY · EXACT MATCH" },
    ];
  }

  const toneClass = { chain: "text-chain", ok: "text-ok", veto: "text-veto" } as const;
  // Each loop copy must be wider than the widest screen, so short lists repeat.
  const reps = live.status === "live" ? 2 : 4;
  const row = Array.from({ length: reps }, () => items).flat();

  return (
    <div className="needs-js border-y border-[var(--line)] bg-ink py-3">
      <Ticker label="MacroGuard status" seconds={live.status === "live" ? 90 : 60}>
        {row.map((it, i) => (
          <Fragment key={i}>
            <span
              aria-hidden={i >= items.length ? true : undefined}
              className={`meta whitespace-nowrap px-5 ${it.tone ? toneClass[it.tone] : "text-bone"}`}
            >
              {it.text}
            </span>
            <span aria-hidden className="h-1 w-1 shrink-0 rotate-45 bg-slate-2" />
          </Fragment>
        ))}
      </Ticker>
    </div>
  );
}
