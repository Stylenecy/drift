"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/features/motion/Motion";
import { useGuardLive } from "@/features/guard/useGuardLive";
import { askRecordDecision, expectDecision, type DecisionAnswer, type SignalName } from "@/features/guard/chainRead";
import { DEX_GUARD } from "@/features/guard/evidence";

// Try the brake: pick a trade and a loss, the live contract answers through one
// eth_call (a simulation from the agent address: nothing signed, nothing spent).
// The verdict is the contract's; the one-line reason is shown only when the public
// rules agree with it.

const LIMIT = DEX_GUARD.maxDrawdownBps / 100;
const TRADES: { id: SignalName; label: string; hint: string }[] = [
  { id: "long", label: "Buy", hint: "open a long" },
  { id: "short", label: "Sell", hint: "open a short" },
  { id: "flat", label: "Exit", hint: "close positions" },
];

type Phase =
  | { kind: "idle" }
  | { kind: "asking" }
  | { kind: "answered"; answer: DecisionAnswer; signal: SignalName; loss: number }
  | { kind: "failed" };

function reason(signal: SignalName, loss: number, regime: number | null): string {
  if (loss >= LIMIT) {
    return signal === "flat"
      ? `At ${loss}% the bot would be halted, but exiting is always allowed.`
      : `At ${LIMIT}% or more the contract halts the bot. After a halt, only exits pass.`;
  }
  if (regime === 0 && signal === "long") return "The market mood is risk-off right now, which blocks new buys.";
  return `Inside the ${LIMIT}% limit, and today's market mood allows it.`;
}

export function TryIt() {
  const live = useGuardLive();
  const [signal, setSignal] = useState<SignalName>("long");
  const [loss, setLoss] = useState(12);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const inFlight = useRef<AbortController | null>(null);
  const sliderId = useId();
  useEffect(() => () => inFlight.current?.abort(), []);

  const state = live.status === "live" ? live.read.state : null;
  const rules =
    state && state.regime !== null && state.halted !== null
      ? { regime: state.regime, halted: state.halted, maxDrawdownBps: state.max_drawdown_bps ?? DEX_GUARD.maxDrawdownBps }
      : null;

  const ask = () => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    const asked = { signal, loss };
    setPhase({ kind: "asking" });
    askRecordDecision({ signal: asked.signal, drawdownBps: -asked.loss * 100 }, { signal: controller.signal })
      .then((answer) => {
        if (!controller.signal.aborted) setPhase({ kind: "answered", answer, ...asked });
      })
      .catch(() => {
        if (!controller.signal.aborted) setPhase({ kind: "failed" });
      });
  };

  const answered = phase.kind === "answered" ? phase : null;
  const expected = answered && rules ? expectDecision(rules, { signal: answered.signal, drawdownBps: -answered.loss * 100 }) : null;
  const explain = answered && expected && expected.allowed === answered.answer.allowed;

  return (
    <section id="try" className="scroll-mt-16 border-t border-[var(--line)] px-4 py-28 sm:px-8 sm:py-40">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-14 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Reveal as="h2" className="q-h2 text-bone">
            Try the brake yourself.
          </Reveal>
          <Reveal className="q-lead mt-6 max-w-[40ch] text-mute" delay={0.1}>
            Pick a trade and a loss. The live contract on BNB Chain answers. Nothing is signed, nothing is spent.
          </Reveal>

          <div className="mt-12">
            <p className="text-[13px] uppercase tracking-[0.16em] text-mute">The bot wants to</p>
            <div role="radiogroup" aria-label="Trade" className="mt-4 flex flex-wrap gap-3">
              {TRADES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={signal === t.id}
                  onClick={() => setSignal(t.id)}
                  className={`rounded-full border px-6 py-3 text-[16px] font-medium transition-colors duration-200 ${
                    signal === t.id ? "border-bone bg-bone text-ink" : "border-[var(--line-strong)] text-bone hover:border-bone/60"
                  }`}
                >
                  {t.label} <span className={signal === t.id ? "text-ink/60" : "text-mute"}>· {t.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <div className="flex items-baseline justify-between">
              <label htmlFor={sliderId} className="text-[13px] uppercase tracking-[0.16em] text-mute">
                Its loss at that moment
              </label>
              <span className={`font-mono text-[44px] leading-none tracking-[-0.04em] tnum ${loss >= LIMIT ? "text-veto" : "text-bone"}`}>{loss === 0 ? "0%" : `−${loss}%`}</span>
            </div>
            <input
              id={sliderId}
              type="range"
              min={0}
              max={30}
              step={1}
              value={loss}
              onChange={(e) => setLoss(Number(e.target.value))}
              className="ty-range mt-4"
              aria-valuetext={`${loss} percent loss`}
            />
            <div className="relative mt-1 flex justify-between text-[13px] text-mute">
              <span>0%</span>
              <span className="absolute left-[66.66%] -translate-x-1/2 text-chain-soft">{LIMIT}% limit</span>
              <span>30%</span>
            </div>
          </div>

          <button type="button" onClick={ask} disabled={phase.kind === "asking"} className="pill mt-12 disabled:opacity-60">
            {phase.kind === "asking" ? "Asking BNB Chain…" : "Ask the contract"} <span aria-hidden className="pill-arrow">→</span>
          </button>
        </div>

        <div className="lg:col-span-6">
          <div aria-live="polite" className="flex min-h-[360px] flex-col justify-center rounded-[32px] border border-[var(--line-strong)] bg-slate-1/60 p-8 sm:min-h-[460px] sm:p-12">
            {phase.kind === "idle" && (
              <>
                <p className="q-h2 text-slate-2">?</p>
                <p className="mt-6 text-[16px] text-mute">The contract&apos;s answer appears here, with the block it was read at.</p>
              </>
            )}
            {phase.kind === "asking" && <p className="text-[18px] text-mute">Asking the contract on BNB Chain…</p>}
            {phase.kind === "failed" && (
              <p className="text-[18px] text-bone">BNB Chain could not be reached just now. Try again in a moment.</p>
            )}
            {answered && (
              <div key={`${answered.answer.block}-${answered.signal}-${answered.loss}`}>
                <p className="text-[13px] uppercase tracking-[0.16em] text-mute">
                  {TRADES.find((t) => t.id === answered.signal)?.label} at {answered.loss === 0 ? "0%" : `−${answered.loss}%`}
                </p>
                <p className={`ty-verdict mt-3 text-[clamp(64px,9vw,136px)] font-semibold uppercase leading-[0.9] tracking-[-0.04em] ${answered.answer.allowed ? "text-ok" : "text-veto"}`}>
                  {answered.answer.allowed ? "Allowed" : "Blocked"}
                </p>
                {explain && <p className="q-lead mt-6 max-w-[38ch] text-bone">{reason(answered.signal, answered.loss, rules?.regime ?? null)}</p>}
                <p className="mt-6 text-[14px] text-mute">
                  Answered by the live contract at block{" "}
                  <span className="font-mono text-chain-soft tnum">{answered.answer.block.toLocaleString("en-US")}</span>. A simulation:
                  nothing was signed or written.
                </p>
                <Link href="/macroguard#ask" className="mt-6 inline-block text-[15px] text-bone">
                  <span className="u-draw pb-0.5">See the full check and replay it →</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
