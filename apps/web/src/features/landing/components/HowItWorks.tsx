"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Reveal, SplitWords } from "@/features/motion/Motion";
import { observe } from "@/features/motion/runtime";
import { Chapter } from "@/features/ui/hud";

// The one pinned sequence of the landing (DEX-MOTION-LANGUAGE.md §4). On wide
// screens the instrument on the left stays put while the four steps scroll past;
// the step crossing the middle of the screen lights its node. Nothing hijacks the
// scroll, so it can be skipped. Narrow screens and reduced motion get a plain stack.

type Step = { where: "off" | "on"; node: string; title: string; body: string; code: string };

const steps: Step[] = [
  {
    where: "off",
    node: "Engine",
    title: "The engine proposes a signal.",
    body: "Python strategies read Bybit market data and choose Long, Short or Flat for the next bar.",
    code: "target = int(strat.positions(df).iloc[-1])",
  },
  {
    where: "on",
    node: "MacroGuard · allowed()",
    title: "MacroGuard says yes or no.",
    body: "The contract checks the stored regime and its halt flag. Anyone can make the same free read.",
    code: "allowed(signal) → bool",
  },
  {
    where: "off",
    node: "Runner",
    title: "The runner trades on testnet.",
    body: "The runner moves the Bybit testnet position to the target the gate allows: a vetoed signal becomes Flat. If the chain is unreachable it falls back to its local stop, which means it fails open.",
    code: "client.place_market_order(symbol, side, qty)",
  },
  {
    where: "on",
    node: "MacroGuard · recordDecision()",
    title: "The decision goes on the record.",
    body: "Each recorded decision becomes a public receipt on BscScan. A reported drawdown at or past 20% makes the contract halt itself.",
    code: "recordDecision(symbol, signal, price, drawdownBps) → tx",
  },
];

const WHERE = {
  off: { label: "off-chain engine", text: "text-engine", border: "border-engine", bg: "bg-engine" },
  on: { label: "on BNB Chain", text: "text-chain", border: "border-chain", bg: "bg-chain" },
} as const;

function Instrument({ active, pinned }: { active: number; pinned: boolean }) {
  const step = steps[active];
  return (
    <div className="hud flex h-full min-h-[420px] flex-col px-5 pb-5 pt-10 sm:px-7">
      <span className="meta absolute left-4 top-3 text-mute">
        {pinned ? (
          <>
            STEP <span className="text-bone tnum">{String(active + 1).padStart(2, "0")}</span> / 04
          </>
        ) : (
          "ONE TICK, FOUR STEPS"
        )}
      </span>
      {pinned && <span className={`meta absolute right-4 top-3 ${WHERE[step.where].text}`}>{WHERE[step.where].label}</span>}

      <div className="relative mt-4 flex flex-1 flex-col">
        {/* spine and its progress fill */}
        <span aria-hidden className="absolute bottom-6 left-[11px] top-6 w-px bg-[var(--line-strong)]" />
        {pinned && (
          <span
            aria-hidden
            className="how-fill absolute left-[11px] top-6 w-px bg-bone"
            style={{ height: "calc(100% - 48px)", transform: `scaleY(${active / (steps.length - 1)})` }}
          />
        )}
        <ol className="relative flex flex-1 flex-col justify-between gap-4" aria-label="Pipeline">
        {steps.map((s, i) => {
          const lit = !pinned || i === active;
          const done = pinned && i < active;
          const tone = WHERE[s.where];
          return (
            <li key={s.node} className="relative flex items-center gap-4">
              <span
                aria-hidden
                className={`how-node relative z-10 grid h-6 w-6 shrink-0 place-items-center border bg-ink ${
                  lit ? tone.border : done ? "border-bone/60" : "border-slate-2"
                }`}
              >
                <span className={`how-node h-2 w-2 ${lit ? tone.bg : done ? "bg-bone/60" : "bg-transparent"}`} />
              </span>
              <span
                className={`how-node flex min-w-0 flex-1 items-baseline justify-between gap-3 border px-3 py-2.5 ${
                  lit ? `${tone.border} bg-slate-1` : "border-[var(--line)]"
                }`}
              >
                <span className={`font-mono text-[13px] ${lit ? "text-bone" : "text-mute"}`}>{s.node}</span>
                <span className={`meta hidden sm:inline ${lit ? tone.text : "text-mute"}`}>{s.where === "on" ? "on-chain" : "off-chain"}</span>
              </span>
            </li>
          );
        })}
        </ol>
      </div>

      {pinned && (
        <code key={active} className="ld-clip-x mt-6 block border-t border-[var(--line)] pt-4 font-mono text-[12.5px] text-bone [overflow-wrap:anywhere]" style={{ "--d": "0.05s" } as CSSProperties}>
          <span className="text-mute">› </span>
          {step.code}
        </code>
      )}
    </div>
  );
}

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const items = listRef.current?.querySelectorAll<HTMLElement>("[data-step]");
    if (!items) return;
    const stops = Array.from(items).map((el) =>
      observe(
        el,
        (e) => {
          if (e.isIntersecting) setActive(Number(el.dataset.step));
        },
        "-50% 0px -50% 0px",
      ),
    );
    return () => stops.forEach((stop) => stop());
  }, []);

  return (
    <section id="how" className="cv-auto relative scroll-mt-16 px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-[1440px]">
        <Chapter index="03" label="how it works" />
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <SplitWords
            className="display-2 text-bone lg:col-span-8"
            segments={[{ text: "One tick, four steps. Two of them are" }, { text: "public.", className: "serif-i text-chain" }]}
          />
          <Reveal className="max-w-[34ch] text-[15px] leading-relaxed text-mute lg:col-span-4 lg:self-end" delay={0.2}>
            Gold marks what happens on BNB Chain, where anyone can check it. Periwinkle marks DRIFT&apos;s own engine.
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Narrow screens, and reduced motion: the whole pipeline once, static */}
          <div className="lg:col-span-5 lg:hidden motion-reduce:lg:block">
            <Instrument active={0} pinned={false} />
          </div>
          {/* Wide screens: the pinned instrument */}
          <div className="hidden lg:col-span-5 motion-safe:lg:block">
            <div className="how-pin h-[72vh]">
              <Instrument active={active} pinned />
            </div>
          </div>

          <ol ref={listRef} className="lg:col-span-6 lg:col-start-7">
            {steps.map((s, i) => (
              <li
                key={s.title}
                data-step={i}
                className={`flex flex-col justify-center border-t border-[var(--line)] py-10 transition-opacity duration-700 lg:min-h-[72vh] lg:py-0 motion-reduce:transition-none motion-reduce:lg:min-h-0 motion-reduce:lg:py-12 motion-reduce:lg:opacity-100 ${
                  i === active ? "lg:opacity-100" : "lg:opacity-35"
                }`}
              >
                <Reveal>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[13px] text-mute tnum">{String(i + 1).padStart(2, "0")}</span>
                    <span className={`meta ${WHERE[s.where].text}`}>{WHERE[s.where].label}</span>
                  </div>
                  <h3 className="display-3 mt-5 max-w-[16ch] text-bone">{s.title}</h3>
                  <p className="mt-5 max-w-[44ch] text-[16px] leading-relaxed text-mute">{s.body}</p>
                  <code className="mt-6 block font-mono text-[12.5px] text-bone/80 lg:hidden [overflow-wrap:anywhere]">› {s.code}</code>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>

        <Reveal className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-[var(--line-strong)] pt-8 sm:flex-row sm:items-center">
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-mute">
            <span className="text-bone">What it does not do:</span> the contract never places orders, and if the chain is
            unreachable the runner falls back to its local stop. The live guard page says so too.
          </p>
          <Link href="/macroguard" className="meta shrink-0 border border-chain/50 px-4 py-2.5 text-chain-soft transition-colors hover:bg-chain hover:text-ink">
            See the live guard →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
