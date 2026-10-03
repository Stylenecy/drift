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
      className="mt-px grid h-5 w-5 shrink-0 place-items-center border border-warn/60 text-[12px] font-bold text-warn"
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
    <Panel
      id="ask"
      className="p-5 pt-6 sm:p-7"
      label={<Eyebrow>(ask the contract · simulation)</Eyebrow>}
      aside={
        <span className="meta text-mute">
          <span className="text-bone">eth_call</span> · nothing signed, nothing written
        </span>
      }
    >
      <h2 className="display-3 mt-5 max-w-[22ch] text-bone">
        What would MacroGuard decide <span className="serif-i">if the bot reported this?</span>
      </h2>
      <p className="mt-4 max-w-3xl text-[14px] leading-relaxed text-mute">
        Pick a signal and the drawdown the bot would report. Your browser sends one <span className="font-mono text-bone">eth_call</span> of{" "}
        <span className="font-mono text-bone">recordDecision</span> to the live contract, as if from the agent address. It is a simulation:
        nothing is signed or written, no transaction is created and no gas is spent. The answer comes from the contract on BSC
        Testnet, not from this page.
      </p>

      <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            ask();
          }}
        >
          <fieldset>
            <legend className="meta text-bone">Signal the bot wants</legend>
            <div className="mt-3 grid grid-cols-3">
              {SIGNALS.map((s, i) => (
                <label
                  key={s.id}
                  className={`cursor-pointer border border-[var(--line-strong)] px-3 py-2.5 text-mute transition-colors hover:border-bone/40 has-[:checked]:relative has-[:checked]:z-10 has-[:checked]:border-bone/70 has-[:checked]:bg-bone/[0.08] has-[:checked]:text-bone has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-chain ${
                    i > 0 ? "-ml-px" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name={radioName}
                    value={s.id}
                    checked={signal === s.id}
                    onChange={() => setSignal(s.id)}
                    className="sr-only"
                  />
                  <span className="block text-[14px] font-semibold">
                    {signal === s.id && <span aria-hidden>● </span>}
                    {s.label}
                  </span>
                  <span className="meta block text-mute">{s.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <label htmlFor={sliderId} className="meta text-bone">
                Drawdown it reports
              </label>
              <output htmlFor={sliderId} className="font-mono text-[15px] text-bone tnum">
                {pct(-lossBps)} <span className="text-mute">({bpsText(-lossBps)})</span>
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
            <div className="meta relative mt-1 h-4 text-mute" aria-hidden>
              <span className="absolute left-0">0%</span>
              <span className="absolute -translate-x-1/2 whitespace-nowrap text-chain" style={{ left: haltPos }}>
                −{thresholdBps / 100}% halt line
              </span>
              <span className="absolute right-0">−{MAX_LOSS_BPS / 100}%</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={phase.kind === "asking"}
            className="inline-flex items-center gap-3 bg-chain px-5 py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-chain-soft disabled:cursor-wait disabled:opacity-70"
          >
            {phase.kind === "asking" ? "Asking BSC Testnet…" : stale ? "Ask again" : "Ask the live contract"}
            <span aria-hidden>→</span>
          </button>
        </form>

        <div aria-live="polite" className="min-w-0">
          {phase.kind === "idle" && (
            <div className="flex h-full min-h-[168px] items-center border border-dashed border-[var(--line-strong)] px-5 py-5 text-[14px] leading-relaxed text-mute">
              No question asked yet. The contract&apos;s answer appears here, with the block it was read at.
            </div>
          )}

          {phase.kind === "asking" && (
            <div className="flex h-full min-h-[168px] items-center gap-3 border border-[var(--line-strong)] px-5 py-5 text-[14px] text-bone/85">
              <span aria-hidden className="live-dot h-2 w-2 shrink-0 rounded-full bg-chain" />
              Asking the contract: {label(phase.question.signal)} at {pct(phase.question.drawdownBps)}…
            </div>
          )}

          {phase.kind === "failed" && (
            <div role="alert" className="flex items-start gap-3 border border-warn/40 bg-warn/[0.08] px-5 py-4 text-[14px] leading-relaxed text-bone">
              <WarnIcon />
              <p className="min-w-0 [overflow-wrap:anywhere]">
                <strong className="font-semibold">The contract could not be asked.</strong> Reason: {phase.error}. No
                transaction was involved. Try again in a moment.
              </p>
            </div>
          )}

          {answered && (
            <div
              key={`${answered.answer.block}-${answered.question.signal}-${answered.question.drawdownBps}`}
              className={`ld-clip hud border p-5 ${answered.answer.allowed ? "border-[var(--line-strong)]" : "hud-veto border-veto/50 bg-veto/[0.07]"}`}
              style={{ "--d": "0s" } as CSSProperties}
            >
              {stale && (
                <p className="meta mb-3 text-mute">
                  Answer for {label(answered.question.signal)} at {pct(answered.question.drawdownBps)}. Ask again for your new choice.
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <span
                  aria-hidden
                  className={`grid h-9 w-9 place-items-center border text-[16px] font-bold ${
                    answered.answer.allowed ? "border-ok/60 text-ok" : "border-veto/70 text-veto-soft"
                  }`}
                >
                  {answered.answer.allowed ? "✓" : "✕"}
                </span>
                <span className={`text-[34px] font-semibold leading-none tracking-[-0.03em] ${answered.answer.allowed ? "text-bone" : "text-veto-soft"}`}>
                  {answered.answer.allowed ? "Allowed" : "Blocked"}
                </span>
                <span className="meta text-mute">
                  {label(answered.question.signal)} at {pct(answered.question.drawdownBps)}
                </span>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-bone/85">{reasonFor(answered.question, rules, thresholdBps)}</p>
              {mismatch && (
                <div className="mt-2 flex items-start gap-2 text-[13px] leading-relaxed text-warn">
                  <WarnIcon />
                  <p>
                    This answer differs from the published rules applied to the state this page read, so the state may
                    have changed since. Refresh the panel; the contract&apos;s answer is the one that counts.
                  </p>
                </div>
              )}

              <dl className="mt-4 space-y-1 border-t border-[var(--line)] pt-3 font-mono text-[11.5px] leading-relaxed text-mute [overflow-wrap:anywhere]">
                <div>
                  <dt className="inline">call </dt>
                  <dd className="inline text-bone/90">
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
                      className="text-chain-soft underline-offset-2 hover:underline"
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
              <p className="mt-3 text-[12.5px] leading-relaxed text-mute">
                Simulation only: the node ran the call and discarded the result. The on-chain decision count is unchanged.
              </p>
              <details className="mt-3 text-[12.5px] text-mute">
                <summary className="cursor-pointer select-none text-bone/85">Replay it with Foundry&apos;s cast</summary>
                <div className="mt-2 flex items-start gap-2">
                  <code className="min-w-0 flex-1 whitespace-pre-wrap bg-ink/70 px-2 py-1.5 font-mono text-[11px] text-bone/85 [overflow-wrap:anywhere]">
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
