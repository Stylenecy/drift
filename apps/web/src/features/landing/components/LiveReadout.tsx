"use client";

import type { CSSProperties, ReactNode } from "react";
import { Odometer } from "@/features/motion/Motion";
import { useGuardLive } from "@/features/guard/useGuardLive";
import { DEX_GUARD, addressUrl } from "@/features/guard/evidence";

// The hero's instrument: what MacroGuard says right now, read from BSC Testnet
// by this browser. Loading, live and unavailable each say what they are.

const REGIMES = ["Risk off", "Neutral", "Risk on"] as const;

function Row({ k, children, d }: { k: string; children: ReactNode; d: number }) {
  return (
    <div className="ld-up flex items-baseline justify-between gap-4 border-t border-[var(--line)] py-2.5" style={{ "--d": `${d}s` } as CSSProperties}>
      <dt className="meta text-mute">{k}</dt>
      <dd className="text-right font-mono text-[13px] text-bone tnum">{children}</dd>
    </div>
  );
}

export function LiveReadout() {
  const live = useGuardLive();
  const state = live.status === "live" ? live.read.state : null;

  return (
    <aside aria-label="MacroGuard, live read" className="hud hud-chain ld-clip relative px-4 pb-4 pt-9 sm:px-5" style={{ "--d": "0.55s" } as CSSProperties}>
      <span className="meta absolute left-3 top-2.5 text-chain">(live read)</span>
      <span className="meta absolute right-3 top-2.5 flex items-center gap-1.5 text-mute" aria-live="polite">
        {live.status === "live" && <span aria-hidden className="live-dot h-1.5 w-1.5 rounded-full bg-ok" />}
        {live.status === "live" ? "live" : live.status === "loading" ? "reading…" : "not live"}
      </span>

      <div className="mt-1">
        <div className="meta text-mute">Block</div>
        <div className="mt-1 font-mono text-[34px] leading-none tracking-[-0.03em] text-bone sm:text-[40px]">
          {live.status === "live" ? (
            <Odometer value={live.read.block} />
          ) : (
            live.status === "loading" ? (
              <span aria-hidden className="text-slate-2">
                ———,———,———
              </span>
            ) : (
              <span className="text-[22px] text-mute sm:text-[24px]">unavailable</span>
            )
          )}
        </div>
      </div>

      <dl className="mt-5">
        <Row k="Regime" d={0.7}>
          {state?.regime != null ? REGIMES[state.regime] ?? "Unknown" : "—"}
        </Row>
        <Row k="Halt" d={0.76}>
          {state ? (
            state.halted ? (
              <span className="text-veto">■ Halted · only Flat</span>
            ) : (
              <span className="text-ok">● Running</span>
            )
          ) : (
            "—"
          )}
        </Row>
        <Row k="Halt line" d={0.82}>
          {((state?.max_drawdown_bps ?? DEX_GUARD.maxDrawdownBps) / 100).toFixed(0)}% ·{" "}
          {(state?.max_drawdown_bps ?? DEX_GUARD.maxDrawdownBps).toLocaleString("en-US")} bps
        </Row>
        <Row k="Decisions" d={0.88}>
          {state?.decision_count ?? "—"}
        </Row>
        <Row k="Allowed now" d={0.94}>
          {state?.allowed ? (
            <span className="flex justify-end gap-3">
              {(["long", "short", "flat"] as const).map((sig) => (
                <span key={sig} className={state.allowed?.[sig] ? "text-bone" : "text-veto"}>
                  {sig === "long" ? "L" : sig === "short" ? "S" : "F"}
                  <span aria-hidden>{state.allowed?.[sig] ? " ✓" : " ✕"}</span>
                  <span className="sr-only">{`${sig} ${state.allowed?.[sig] ? "allowed" : "blocked"}`}</span>
                </span>
              ))}
            </span>
          ) : (
            "—"
          )}
        </Row>
      </dl>

      <p className="meta no-js-note mt-3 border-t border-[var(--line)] pt-3 text-mute">
        live read needs JavaScript · the contract is public on{" "}
        <a href={addressUrl(DEX_GUARD.address)} target="_blank" rel="noopener noreferrer" className="text-chain-soft underline underline-offset-2">
          BscScan ↗
        </a>
      </p>
      <p className="meta needs-js mt-3 min-h-[4.25em] border-t border-[var(--line)] pt-3 text-mute [overflow-wrap:anywhere]">
        {live.status === "live" && `public RPC · ${live.read.rpc} · read ${live.at}`}
        {live.status === "loading" && "reading BSC Testnet from your browser…"}
        {live.status === "offline" && (
          <>
            live read unavailable · no live claim ·{" "}
            <a href={addressUrl(DEX_GUARD.address)} target="_blank" rel="noopener noreferrer" className="text-chain-soft underline underline-offset-2">
              BscScan ↗
            </a>
          </>
        )}
      </p>
    </aside>
  );
}
