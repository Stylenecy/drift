"use client";

import { useState } from "react";
import { DEX_GUARD, SMOKE_TEST, txUrl } from "@/features/guard/evidence";
import { useScrollProgress } from "../motion";

// A pinned scene, driven by scroll: the bot's loss climbs from 0 to 25%; at the 20%
// line the contract halts it. The end state is the real halt from the 30 Sep 2026
// public test. Under reduced motion the scene is static at its end state.

const SCALE = 30;
const LIMIT = DEX_GUARD.maxDrawdownBps / 100;
const halt = SMOKE_TEST.find((s) => s.action.startsWith("Breach"))!;

const LINES = [
  { title: "Every decision is recorded.", body: "Each time the bot decides, its loss at that moment goes on the public record." },
  { title: `At ${LIMIT}%, the contract steps in.`, body: "No owner to ask, no settings page, no delay. The rule is in the contract." },
  { title: "The bot stops. Only exits are allowed.", body: "The halt was tested in public on BNB Chain on 30 Sep 2026. Restarting takes the owner's key, also in public." },
];

export function Halt() {
  const [loss, setLoss] = useState(0);
  const ref = useScrollProgress<HTMLElement>((p) => {
    const next = Math.round(Math.min(1, Math.max(0, (p - 0.08) / 0.72)) * 25);
    setLoss((prev) => (prev === next ? prev : next));
  });
  const halted = loss >= LIMIT;
  const phase = loss < 12 ? 0 : halted ? 2 : 1;

  return (
    <section id="limit" ref={ref} className="relative h-[300svh] scroll-mt-16 motion-reduce:h-auto">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden px-4 sm:px-8 motion-reduce:static">
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 -z-10 transition-opacity duration-700 ${halted ? "opacity-100" : "opacity-0"}`}
          style={{ background: "radial-gradient(60% 50% at 70% 60%, rgba(227,76,34,0.14), transparent 70%)" }}
        />
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
          <div className="relative min-h-[290px] sm:min-h-[340px] lg:col-span-7">
            {LINES.map((l, i) => (
              <div key={l.title} data-on={phase === i} className="sc-line absolute inset-x-0 top-0">
                <p className="text-[13px] uppercase tracking-[0.16em] text-mute">
                  {String(i + 1).padStart(2, "0")} / 03
                </p>
                <h2 className={`q-h2 mt-4 max-w-[14ch] ${i === 2 ? "text-veto" : "text-bone"}`}>{l.title}</h2>
                <p className="q-lead mt-6 max-w-[40ch] text-mute">{l.body}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-5 lg:text-right">
            <p className="text-[13px] uppercase tracking-[0.16em] text-mute">Bot&apos;s loss</p>
            <p className={`font-mono text-[clamp(80px,13vw,190px)] leading-[0.9] tracking-[-0.05em] tnum transition-colors duration-300 ${halted ? "text-veto" : "text-bone"}`}>
              {loss === 0 ? "0%" : `−${loss}%`}
            </p>
            <p
              data-on={halted}
              className="sc-stamp mt-4 inline-block rounded-full bg-veto px-5 py-2 text-[14px] font-semibold uppercase tracking-[0.12em] text-ink"
            >
              Halted by the contract
            </p>
          </div>
        </div>

        {/* the loss bar with the on-chain limit */}
        <div className="mx-auto mt-14 w-full max-w-[1440px] sm:mt-20">
          <div className="relative h-3 rounded-full bg-slate-1">
            <div
              className={`sc-bar absolute inset-y-0 left-0 w-full rounded-full ${halted ? "bg-veto" : "bg-ok"}`}
              style={{ "--fill": (loss / SCALE).toFixed(4) } as React.CSSProperties}
            />
            <div className="absolute -top-4 bottom-[-16px] w-1 rounded bg-chain" style={{ left: `${(LIMIT / SCALE) * 100}%` }} />
          </div>
          <div className="relative mt-5 flex justify-between text-[14px] text-mute">
            <span>0%</span>
            <span className="absolute -translate-x-1/2 text-chain-soft" style={{ left: `${(LIMIT / SCALE) * 100}%` }}>
              {LIMIT}% limit
            </span>
            <span>−{SCALE}%</span>
          </div>
          <div className={`mt-8 flex flex-wrap items-center justify-between gap-4 transition-opacity duration-500 ${halted ? "opacity-100" : "opacity-0"}`}>
            <span className="text-[15px] text-mute">The on-chain test halt: block {halt.block.toLocaleString("en-US")}, 30 Sep 2026.</span>
            <a href={txUrl(halt.tx)} target="_blank" rel="noopener noreferrer" className="text-[15px] text-chain-soft" tabIndex={halted ? 0 : -1}>
              <span className="u-draw pb-0.5">Open the receipt ↗</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
