"use client";

import { Decode } from "@/features/motion/Motion";
import { useGuardLive } from "@/features/guard/useGuardLive";
import { DEX_GUARD, addressUrl, short } from "@/features/guard/evidence";

// One quiet line under the hero: what the contract says right now, read from
// BNB Chain by this browser. Loading, live and unavailable each say what they are.
export function LiveStatus() {
  const live = useGuardLive();
  const state = live.status === "live" ? live.read.state : null;
  const limit = ((state?.max_drawdown_bps ?? DEX_GUARD.maxDrawdownBps) / 100).toFixed(0);

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--line-strong)] pt-5 text-[14px] text-mute sm:flex-row sm:items-center sm:justify-between">
      <p className="needs-js flex flex-wrap items-center gap-x-5 gap-y-2" aria-live="polite">
        {live.status === "live" && state ? (
          <>
            <span className="flex items-center gap-2 text-bone">
              <span aria-hidden className="live-dot h-1.5 w-1.5 rounded-full bg-ok" />
              Live on BNB Chain
            </span>
            <span>
              Block <Decode value={live.read.block} className="font-mono text-bone tnum" />
            </span>
            <span className={state.halted ? "text-veto" : "text-bone"}>{state.halted ? "Bot halted" : "Bot running"}</span>
            <span>
              Loss limit <span className="text-chain-soft">{limit}%</span>
            </span>
          </>
        ) : live.status === "loading" ? (
          <span>Reading the contract on BNB Chain…</span>
        ) : (
          <span>Live read unavailable right now. The contract is still public on BscScan.</span>
        )}
      </p>
      <p className="no-js-note">The live read needs JavaScript. The contract is public on BscScan.</p>
      <a href={addressUrl(DEX_GUARD.address)} target="_blank" rel="noopener noreferrer" className="font-mono text-[13px] text-chain-soft">
        <span className="u-draw pb-0.5">Contract {short(DEX_GUARD.address, 6, 4)} ↗</span>
      </a>
    </div>
  );
}
