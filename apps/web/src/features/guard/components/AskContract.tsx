"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type { GuardState } from "@/features/trade/types";
import {
  askRecordDecision,
  castCommand,
  expectDecision,
  SIMULATED_PRICE,
  SIMULATED_SYMBOL,
  type DecisionAnswer,
  type DecisionQuestion,
  type GateRules,
  type SignalName,
} from "../chainRead";
import { DEX_GUARD, addressUrl, short } from "../evidence";
import { CopyValue, Eyebrow, Panel } from "./parts";

const SIGNALS: { id: SignalName; label: string; hint: string }[] = [
  { id: "long", label: "Long", hint: "buy" },
  { id: "short", label: "Short", hint: "sell short" },
  { id: "flat", label: "Flat", hint: "exit" },
];

// Slider: 0% to 30% drawdown in 0.5% steps, held as positive bps of loss.
const MAX_LOSS_BPS = 3000;
const STEP_BPS = 50;
const THUMB_PX = 18; // keep in sync with .ask-range in globals.css

const pct = (bps: number) => `${bps < 0 ? "−" : ""}${(Math.abs(bps) / 100).toFixed(1)}%`;
const bpsText = (bps: number) => `${bps < 0 ? "−" : ""}${Math.abs(bps).toLocaleString("en-US")} bps`;
const label = (signal: SignalName) => SIGNALS.find((s) => s.id === signal)?.label ?? signal;
const same = (a: DecisionQuestion, b: DecisionQuestion) => a.signal === b.signal && a.drawdownBps === b.drawdownBps;

type Phase =
  | { kind: "idle" }
  | { kind: "asking"; question: DecisionQuestion }
  | { kind: "answered"; question: DecisionQuestion; answer: DecisionAnswer }
  | { kind: "failed"; question: DecisionQuestion; error: string };

// Amber "!" for the failed and mismatch states: a state is always a word plus an icon.
function WarnIcon() {
  return (
    <span
      aria-hidden
      className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-400/20 text-[12px] font-bold text-amber-300"
    >
      !
    </span>
  );
}

// One sentence on why, from the published rules and the state this page read.
function reasonFor(question: DecisionQuestion, rules: GateRules | null, thresholdBps: number): string {
  const line = `${thresholdBps / 100}% halt line`;
  if (rules?.halted) {
    return question.signal === "flat"
      ? "The contract is halted right now. Flat still passes: it only reduces exposure."
      : "The contract is halted right now, so only Flat passes until the agent resumes.";
  }
  if (question.drawdownBps <= -thresholdBps) {
    return question.signal === "flat"
      ? `At ${pct(question.drawdownBps)} the contract halts itself, but Flat still passes: it only reduces exposure.`
      : `At ${pct(question.drawdownBps)} the drawdown is at or past the ${line}, so the contract halts itself first. After a halt only Flat passes.`;
  }
  if (rules?.regime === 0 && question.signal === "long") return "The live regime is Risk off, which vetoes new Longs.";
  if (!rules) return `Inside the ${line}. The regime could not be read just now, so the reason is incomplete.`;
  return `Inside the ${line}, and the live regime vetoes nothing for ${label(question.signal)}.`;
}

export function AskContract({ live, thresholdBps }: { live: GuardState | null; thresholdBps: number }) {
  const [signal, setSignal] = useState<SignalName>("long");
  const [lossBps, setLossBps] = useState(500);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const inFlight = useRef<AbortController | null>(null);
  const radioName = useId();
  const sliderId = useId();

  useEffect(() => () => inFlight.current?.abort(), []);

  const question: DecisionQuestion = { signal, drawdownBps: -lossBps };
  const rules: GateRules | null =
    live && live.regime !== null && live.halted !== null
      ? { regime: live.regime, halted: live.halted, maxDrawdownBps: live.max_drawdown_bps ?? thresholdBps }
      : null;
  const haltAt = Math.min(1, thresholdBps / MAX_LOSS_BPS);
  const haltPos = `calc(${THUMB_PX / 2}px + (100% - ${THUMB_PX}px) * ${haltAt.toFixed(4)})`;

  const ask = () => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    const asked = { ...question };
    setPhase({ kind: "asking", question: asked });
    askRecordDecision(asked, { signal: controller.signal })
      .then((answer) => {
        if (!controller.signal.aborted) setPhase({ kind: "answered", question: asked, answer });
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setPhase({ kind: "failed", question: asked, error: cause instanceof Error ? cause.message : String(cause) });
        }
      });
  };

  const answered = phase.kind === "answered" ? phase : null;
  const stale = answered !== null && !same(answered.question, question);
  const expected = answered && rules ? expectDecision(rules, answered.question) : null;
  const mismatch = answered !== null && expected !== null && expected.allowed !== answered.answer.allowed;

  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Eyebrow>Ask the contract · simulation</Eyebrow>
        <span className="text-[11px] text-white/60">
          <span className="font-mono">eth_call</span> · nothing signed, nothing written
        </span>
      </div>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
        What would MacroGuard decide if the bot reported this?
      </h2>
      <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-white/70">
        Pick a signal and the drawdown the bot would report. Your browser sends one <span className="font-mono">eth_call</span> of{" "}
        <span className="font-mono">recordDecision</span> to the live contract, as if from the agent address. It is a simulation:
        nothing is signed or written, no transaction is created and no gas is spent. The answer comes from the contract on BSC
        Testnet, not from this page.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            ask();
          }}
        >
          <fieldset>
            <legend className="text-[12px] font-medium text-white/85">Signal the bot wants</legend>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {SIGNALS.map((s) => (
                <label
                  key={s.id}
                  className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-white/70 transition hover:border-white/25 has-[:checked]:border-white/40 has-[:checked]:bg-white/[0.10] has-[:checked]:text-white has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#f0b90b]"
                >
                  <input
                    type="radio"
                    name={radioName}
                    value={s.id}
                    checked={signal === s.id}
                    onChange={() => setSignal(s.id)}
                    className="sr-only"
                  />
                  <span className="block text-[13px] font-semibold">
                    {signal === s.id && <span aria-hidden>● </span>}
                    {s.label}
                  </span>
                  <span className="block text-[11px] text-white/60">{s.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <label htmlFor={sliderId} className="text-[12px] font-medium text-white/85">
                Drawdown it reports
              </label>
              <output htmlFor={sliderId} className="font-mono text-[13px] tabular-nums text-white">
                {pct(-lossBps)} <span className="text-white/60">({bpsText(-lossBps)})</span>
              </output>
            </div>
            <input
              id={sliderId}
              type="range"
              min={0}
              max={MAX_LOSS_BPS}
              step={STEP_BPS}
              value={lossBps}
              onChange={(event) => setLossBps(Number(event.target.value))}
              aria-valuetext={`minus ${(lossBps / 100).toFixed(1)} percent`}
              className="ask-range mt-2"
              style={{ "--halt": haltPos } as CSSProperties}
            />
            <div className="relative mt-1 h-4 font-mono text-[10.5px] text-white/60" aria-hidden>
              <span className="absolute left-0">0%</span>
              <span className="absolute -translate-x-1/2 whitespace-nowrap text-[#f0b90b]" style={{ left: haltPos }}>
                −{thresholdBps / 100}% halt line
              </span>
              <span className="absolute right-0">−{MAX_LOSS_BPS / 100}%</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={phase.kind === "asking"}
            className="inline-flex items-center gap-2 rounded-lg bg-[#f0b90b] px-4 py-2 text-[13px] font-semibold text-[#1a1405] transition hover:bg-[#f8d36a] disabled:cursor-wait disabled:opacity-70"
          >
            {phase.kind === "asking" ? "Asking BSC Testnet…" : stale ? "Ask again" : "Ask the live contract"}
          </button>
        </form>

        <div aria-live="polite" className="min-w-0">
          {phase.kind === "idle" && (
            <div className="flex h-full min-h-[148px] items-center rounded-xl border border-dashed border-white/15 px-4 py-4 text-[13px] leading-relaxed text-white/65">
              No question asked yet. The contract&apos;s answer appears here, with the block it was read at.
            </div>
          )}

          {phase.kind === "asking" && (
            <div className="flex h-full min-h-[148px] items-center rounded-xl border border-white/10 px-4 py-4 text-[13px] text-white/70">
              Asking the contract: {label(phase.question.signal)} at {pct(phase.question.drawdownBps)}…
            </div>
          )}

          {phase.kind === "failed" && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-[13px] leading-relaxed text-amber-100"
            >
              <WarnIcon />
              <p className="min-w-0 [overflow-wrap:anywhere]">
                <strong className="font-semibold">The contract could not be asked.</strong> {phase.error}. No transaction
                was involved. Try again in a moment.
              </p>
            </div>
          )}

          {answered && (
            <div
              className={`rounded-xl border p-4 ${
                answered.answer.allowed ? "border-emerald-400/25 bg-emerald-500/[0.06]" : "border-rose-400/35 bg-rose-500/[0.08]"
              }`}
            >
              {stale && (
                <p className="mb-2 text-[11.5px] text-white/65">
                  Answer for {label(answered.question.signal)} at {pct(answered.question.drawdownBps)}. Ask again for your new
                  choice.
                </p>
              )}
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className={`grid h-7 w-7 place-items-center rounded-full text-[14px] font-bold ${
                    answered.answer.allowed ? "bg-emerald-400/20 text-emerald-300" : "bg-rose-400/20 text-rose-300"
                  }`}
                >
                  {answered.answer.allowed ? "✓" : "✕"}
                </span>
                <span className={`text-xl font-semibold ${answered.answer.allowed ? "text-emerald-100" : "text-rose-100"}`}>
                  {answered.answer.allowed ? "Allowed" : "Blocked"}
                </span>
                <span className="text-[12px] text-white/60">
                  {label(answered.question.signal)} at {pct(answered.question.drawdownBps)}
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-white/80">
                {reasonFor(answered.question, rules, thresholdBps)}
              </p>
              {mismatch && (
                <div className="mt-2 flex items-start gap-2 text-[12px] leading-relaxed text-amber-200">
                  <WarnIcon />
                  <p>
                    This answer differs from the published rules applied to the state this page read, so the state may
                    have changed since. Refresh the panel; the contract&apos;s answer is the one that counts.
                  </p>
                </div>
              )}

              <dl className="mt-3 space-y-1 border-t border-white/10 pt-3 font-mono text-[11px] leading-relaxed text-white/60 [overflow-wrap:anywhere]">
                <div>
                  <dt className="inline">call </dt>
                  <dd className="inline text-white/85">
                    recordDecision(&quot;{SIMULATED_SYMBOL}&quot;, {label(answered.question.signal)}, {SIMULATED_PRICE},{" "}
                    {answered.question.drawdownBps})
                  </dd>
                </div>
                <div>
                  <dt className="inline">from </dt>
                  <dd className="inline">agent {short(DEX_GUARD.agent, 6, 4)} · unsigned</dd>
                </div>
                <div>
                  <dt className="inline">to </dt>
                  <dd className="inline">
                    <a
                      href={addressUrl(DEX_GUARD.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#f8d36a] underline-offset-2 hover:underline"
                    >
                      MacroGuard {short(DEX_GUARD.address, 6, 4)} ↗
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="inline">read at </dt>
                  <dd className="inline">
                    block {answered.answer.block.toLocaleString("en-US")} via {answered.answer.rpc}
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-[11.5px] leading-relaxed text-white/60">
                Simulation only: the node ran the call and discarded the result. The on-chain decision count is unchanged.
              </p>
              <details className="mt-2 text-[11.5px] text-white/65">
                <summary className="cursor-pointer select-none">Replay it with Foundry&apos;s cast</summary>
                <div className="mt-2 flex items-start gap-2">
                  <code className="min-w-0 flex-1 whitespace-pre-wrap rounded-md bg-black/40 px-2 py-1.5 font-mono text-[10.5px] text-white/80 [overflow-wrap:anywhere]">
                    {castCommand(answered.question)}
                  </code>
                  <CopyValue value={castCommand(answered.question)} label="cast command" />
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
