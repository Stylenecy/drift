import type { CSSProperties } from "react";
import Link from "next/link";
import { Magnetic } from "@/features/motion/Motion";
import { Lines } from "@/features/motion/Lines";
import { DEX_GUARD, SMOKE_TEST, addressUrl, short } from "@/features/guard/evidence";
import { LiveReadout } from "./LiveReadout";

// Hero: one focal point (the headline), a live readout of the contract beside it,
// and a measuring grid behind it. The grid is a drawdown scale: 12 columns,
// 2.5% each, 0 at the left edge and −30% at the right; the gold hairline is the
// on-chain halt line at −20%. The two dots are the drawdowns recorded on chain
// in the 30 Sep 2026 smoke test (docs/deployment-dex.md).

const SCALE = 30; // percent across the full width
const LIMIT = DEX_GUARD.maxDrawdownBps / 100; // 20
const at = (pct: number) => `${(pct / SCALE) * 100}%`;
const recorded = SMOKE_TEST.filter((s) => s.drawdownPct !== undefined);

function HaltRuler() {
  return (
    <div className="relative mt-12 sm:mt-16" role="group" aria-label="Drawdown scale with the on-chain halt line">
      <div className="flex items-baseline justify-between gap-4 px-4 sm:px-8 lg:px-10">
        <span className="meta text-mute">Drawdown scale · 1 column = 2.5%</span>
        <span className="meta hidden text-mute sm:inline">recorded on chain · {DEX_GUARD.testedOn}</span>
      </div>
      <div className="ld-clip-x relative mt-3 h-10" style={{ "--d": "0.9s" } as CSSProperties}>
        {/* ticks every 2.5% */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-2 grid-12 opacity-80" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-[var(--line-strong)]" />
        {/* safe and breach zones */}
        <div aria-hidden className="absolute left-0 top-3 h-[3px] bg-ok/40" style={{ width: at(LIMIT) }} />
        <div aria-hidden className="absolute right-0 top-3 h-[3px] bg-veto/55" style={{ left: at(LIMIT) }} />
        {/* recorded decisions */}
        {recorded.map((s) => {
          const breach = (s.drawdownPct ?? 0) >= LIMIT;
          return (
            <span
              key={s.tx}
              className="absolute top-[7px] -translate-x-1/2"
              style={{ left: at(s.drawdownPct ?? 0) }}
            >
              <span aria-hidden className={`block h-2.5 w-2.5 rotate-45 ${breach ? "bg-veto" : "bg-ok"}`} />
            </span>
          );
        })}
        {/* labels */}
        <div className="meta absolute inset-x-0 top-6 text-mute">
          <span className="absolute left-2">0%</span>
          <span className="absolute hidden -translate-x-1/2 sm:inline" style={{ left: at(10) }}>
            −10%
          </span>
          <span className="absolute -translate-x-1/2 text-chain" style={{ left: at(LIMIT) }}>
            −{LIMIT}% halt
          </span>
          <span className="absolute right-2">−{SCALE}%</span>
        </div>
      </div>
      <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-1.5 px-4 sm:grid-cols-2 sm:px-8 lg:px-10">
        {recorded.map((s) => {
          const breach = (s.drawdownPct ?? 0) >= LIMIT;
          return (
            <li key={s.tx} className="meta flex items-center gap-2 text-mute">
              <span aria-hidden className={`h-2 w-2 shrink-0 rotate-45 ${breach ? "bg-veto" : "bg-ok"}`} />
              <span>
                −{s.drawdownPct}% recorded ·{" "}
                <span className={breach ? "text-veto" : "text-bone"}>
                  {breach ? "the contract halted itself" : "inside the line, kept running"}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="hero-x relative isolate overflow-hidden pt-[60px]">
      {/* measuring grid and the halt line, drawn on load */}
      <div aria-hidden className="ld-clip pointer-events-none absolute inset-y-0 left-[var(--gx)] right-[var(--gx)] -z-10 grid-12" style={{ "--d": "0s" } as CSSProperties} />
      <div
        aria-hidden
        className="ld-clip pointer-events-none absolute inset-y-0 -z-10 hidden w-px bg-chain/35 lg:block"
        style={{ left: `calc(var(--gx) + (100% - 2 * var(--gx)) * ${LIMIT / SCALE})`, "--d": "0.35s" } as CSSProperties}
      />

      <div className="hud relative mx-[var(--gx)] mb-6 mt-4 pb-8 pt-12 sm:pb-10 sm:pt-14">
        <span className="meta ld-fade absolute left-4 top-3 text-mute sm:left-5" style={{ "--d": "0.2s" } as CSSProperties}>
          DRIFT — 01 / RISK GATE
        </span>
        <span className="meta ld-fade absolute right-4 top-3 hidden text-right text-mute sm:right-5 sm:inline" style={{ "--d": "0.25s" } as CSSProperties}>
          BSC TESTNET · CHAIN {DEX_GUARD.chainId}
        </span>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-0">
          <div className="px-4 sm:px-8 lg:col-span-8 lg:pl-10 lg:pr-12">
            <p className="meta ld-up text-mute" style={{ "--d": "0.15s" } as CSSProperties}>
              <span className="text-bone">(drift)</span> — a trading bot whose
            </p>
            <div className="relative mt-5">
              <Lines
                as="h1"
                mode="settle"
                delay={0.05}
                label="A trading bot whose risk rules you can verify."
                className="display text-bone"
                lines={["Risk rules", "you can", <span key="v" className="text-chain">verify.</span>]}
              />
              <span aria-hidden className="read-head" />
            </div>
            <p className="serif-i ld-up mt-8 text-[28px] leading-[1.1] text-bone sm:text-[34px]" style={{ "--d": "0.8s" } as CSSProperties}>
              Don&apos;t take the bot&apos;s word for it.
            </p>
            <p className="ld-settle-up mt-4 max-w-[34rem] text-[16px] leading-relaxed text-mute sm:text-[17px]" style={{ "--d": "0.35s" } as CSSProperties}>
              Quant research runs off-chain. The risk gate, MacroGuard, is a public contract on BNB Smart Chain
              Testnet: read it from your browser, ask it a what-if, open every receipt on BscScan.
            </p>
            <div className="ld-up mt-9 flex flex-wrap items-center gap-x-6 gap-y-4" style={{ "--d": "1s" } as CSSProperties}>
              <Magnetic>
                <Link
                  href="/macroguard"
                  className="group inline-flex items-center gap-3 bg-chain px-5 py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-chain-soft"
                >
                  Inspect the live guard
                  <span aria-hidden className="transition-transform duration-500 [transition-timing-function:var(--ease-out)] group-hover:translate-x-1">→</span>
                </Link>
              </Magnetic>
              <Link href="/macroguard#ask" className="text-[14px] text-bone">
                <span className="u-draw pb-0.5">Ask the contract a what-if</span>
              </Link>
            </div>
          </div>

          <div className="px-4 sm:px-8 lg:col-span-4 lg:px-6 lg:pt-3">
            <LiveReadout />
          </div>
        </div>

        <HaltRuler />

        <div className="mx-4 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4 sm:mx-8 lg:mx-10">
          <a
            href={addressUrl(DEX_GUARD.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="meta text-chain-soft"
          >
            <span className="u-draw pb-0.5">MacroGuard {short(DEX_GUARD.address, 6, 4)} ↗</span>
          </a>
          <span className="meta text-mute">(scroll) how the gate works ↓</span>
        </div>
      </div>
    </section>
  );
}
