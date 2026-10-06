"use client";

import { Fragment } from "react";
import { Ticker } from "@/features/motion/Motion";
import { useGuardLive } from "@/features/guard/useGuardLive";
import { DEX_GUARD, SMOKE_TEST } from "@/features/guard/evidence";

// A quiet band of plain words under the hero. Live values only after this browser
// read the contract; otherwise it says so and keeps to static, dated facts.
export function LiveTicker() {
  const live = useGuardLive();
  const limit = (DEX_GUARD.maxDrawdownBps / 100).toFixed(0);
  let items: { text: string; tone?: "chain" | "ok" | "veto" }[];

  if (live.status === "live") {
    const s = live.read.state;
    items = [
      { text: "Live on BNB Chain", tone: "ok" },
      { text: s.halted ? "Bot halted · exits only" : "Bot running" , tone: s.halted ? "veto" : undefined },
      { text: `Loss limit ${limit}%`, tone: "chain" },
      { text: `${s.decision_count ?? "?"} decisions on the public record` },
      { text: "Source code verified" },
      { text: "Nothing to sign, nothing to install" },
    ];
  } else {
    items = [
      { text: `Loss limit ${limit}%`, tone: "chain" },
      { text: `${SMOKE_TEST.length} public receipts, all successful` },
      { text: "Source code verified" },
      { text: "Nothing to sign, nothing to install" },
    ];
  }

  const toneClass = { chain: "text-chain-soft", ok: "text-ok", veto: "text-veto" } as const;
  const row = Array.from({ length: 4 }, () => items).flat();

  return (
    <div className="needs-js q-fade-x border-y border-[var(--line)] bg-ink py-5">
      <Ticker label="DRIFT status" seconds={70}>
        {row.map((it, i) => (
          <Fragment key={i}>
            <span
              aria-hidden={i >= items.length ? true : undefined}
              className={`whitespace-nowrap px-7 text-[14px] uppercase tracking-[0.06em] ${it.tone ? toneClass[it.tone] : "text-bone"}`}
            >
              {it.text}
            </span>
            <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-slate-2" />
          </Fragment>
        ))}
      </Ticker>
    </div>
  );
}
