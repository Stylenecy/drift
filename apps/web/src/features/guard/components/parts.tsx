"use client";

import { useState, type ReactNode } from "react";
import { SMOKE_TEST, DEX_GUARD, txUrl, short, type TimelineStep } from "../evidence";

/* --------------------------------------------------------------- Shell -- */
export function Panel({
  children,
  className = "",
  chain,
}: {
  children: ReactNode;
  className?: string;
  // Gold hairline marks content a judge can verify on BscScan.
  chain?: boolean;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border bg-white/[0.03] ${
        chain ? "border-[#f0b90b]/30" : "border-white/10"
      } ${className}`}
    >
      {chain && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f0b90b]/80 to-transparent"
        />
      )}
      {children}
    </section>
  );
}

export function Eyebrow({ children, chain }: { children: ReactNode; chain?: boolean }) {
  return (
    <div
      className={`font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] ${
        chain ? "text-[#f0b90b]" : "text-white/50"
      }`}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- Copy -- */
export function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        });
      }}
      className="rounded-md border border-white/10 px-2 py-0.5 font-mono text-[10.5px] text-white/60 transition hover:border-white/25 hover:text-white"
      aria-label={`Copy ${label}`}
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}

/* ------------------------------------------------------- Regime stepper -- */
const REGIMES = [
  { label: "Risk off", hint: "Long vetoed", on: "bg-amber-400/20 text-amber-200 border-amber-300/50" },
  { label: "Neutral", hint: "All signals open", on: "bg-white/[0.12] text-white border-white/40" },
  { label: "Risk on", hint: "All signals open", on: "bg-emerald-400/15 text-emerald-200 border-emerald-300/50" },
];

export function RegimeStepper({ regime }: { regime: number | null }) {
  return (
    <div role="group" aria-label="Market regime stored on-chain" className="grid grid-cols-3 gap-1.5">
      {REGIMES.map((r, i) => {
        const active = regime === i;
        return (
          <div
            key={r.label}
            aria-current={active ? "true" : undefined}
            className={`rounded-lg border px-3 py-2 transition ${
              active ? r.on : "border-white/[0.07] text-white/45"
            }`}
          >
            <div className="text-[13px] font-semibold">
              {active && <span aria-hidden>● </span>}
              {r.label}
            </div>
            <div className={`text-[11px] ${active ? "opacity-80" : "text-white/40"}`}>{r.hint}</div>
          </div>
        );
      })}
    </div>
  );
}

export const regimeLabel = (regime: number | null) =>
  regime === null ? "Unknown" : (REGIMES[regime]?.label ?? "Unknown");

/* ------------------------------------------------------------ Halt chip -- */
export function HaltChip({ halted }: { halted: boolean | null }) {
  if (halted === null) {
    return <span className="text-sm text-white/50">Halt state unknown</span>;
  }
  return halted ? (
    <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/15 px-3 py-1 text-[12.5px] font-semibold text-rose-200">
      <span aria-hidden>■</span> Halted — only Flat allowed
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-[12.5px] font-semibold text-emerald-200">
      <span aria-hidden className="live-dot h-2 w-2 rounded-full bg-emerald-400" /> Running — no drawdown halt
    </span>
  );
}

/* -------------------------------------------------------- Signal verdict -- */
type Sig = "long" | "short" | "flat";

function reasonFor(sig: Sig, ok: boolean, regime: number | null, halted: boolean | null): string {
  if (halted) return ok ? "Flat always reduces exposure." : "Drawdown halt: only Flat may trade.";
  if (!ok) return regime === 0 && sig === "long" ? "Risk-off regime vetoes new Longs." : "Blocked by the contract.";
  if (sig === "long") return "Open while the regime is not Risk off.";
  if (sig === "short") return "Only a drawdown halt would block it.";
  return "Always allowed — it reduces exposure.";
}

export function SignalVerdicts({
  allowed,
  regime,
  halted,
}: {
  allowed: Record<Sig, boolean>;
  regime: number | null;
  halted: boolean | null;
}) {
  return (
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {(["long", "short", "flat"] as const).map((sig) => {
        const ok = allowed[sig];
        return (
          <li
            key={sig}
            className={`rounded-xl border p-4 ${
              ok ? "border-emerald-400/25 bg-emerald-500/[0.06]" : "border-rose-400/35 bg-rose-500/[0.08]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/60">{sig}</span>
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-[13px] font-bold ${
                  ok ? "bg-emerald-400/20 text-emerald-300" : "bg-rose-400/20 text-rose-300"
                }`}
                aria-hidden
              >
                {ok ? "✓" : "✕"}
              </span>
            </div>
            <div className={`mt-2 text-lg font-semibold ${ok ? "text-emerald-100" : "text-rose-100"}`}>
              {ok ? "Allowed" : "Blocked"}
            </div>
            <p className="mt-0.5 text-[12.5px] leading-snug text-white/65">{reasonFor(sig, ok, regime, halted)}</p>
          </li>
        );
      })}
    </ul>
  );
}

/* ----------------------------------------------------------- Halt gauge -- */
export function HaltGauge({ maxDrawdownBps }: { maxDrawdownBps: number }) {
  const limit = maxDrawdownBps / 100;
  const scale = Math.max(30, limit * 1.5);
  const at = (pct: number) => `${Math.min(100, (pct / scale) * 100)}%`;
  const dots = SMOKE_TEST.filter((s) => s.drawdownPct !== undefined);

  return (
    <div>
      <div className="relative mt-9 h-3 rounded-full bg-white/[0.06]">
        <div className="absolute inset-y-0 left-0 rounded-l-full bg-emerald-400/25" style={{ width: at(limit) }} />
        <div className="absolute inset-y-0 right-0 rounded-r-full bg-rose-500/25" style={{ left: at(limit) }} />
        {/* on-chain halt line */}
        <div className="absolute -top-7 bottom-[-6px] w-px bg-[#f0b90b]" style={{ left: at(limit) }}>
          <span className="absolute -top-0.5 right-1.5 whitespace-nowrap font-mono text-[10.5px] text-[#f0b90b]">
            halt line · {maxDrawdownBps} bps
          </span>
        </div>
        {dots.map((d) => (
          <span
            key={d.tx}
            className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0b0c0f] ${
              (d.drawdownPct ?? 0) > limit ? "bg-rose-400" : "bg-emerald-400"
            }`}
            style={{ left: at(d.drawdownPct ?? 0) }}
            title={`${d.action}: −${d.drawdownPct}%`}
          />
        ))}
      </div>
      {/* axis labels sit at their own positions, so −limit% lines up with the halt line */}
      <div className="relative mt-2 h-4 font-mono text-[10.5px] text-white/60">
        <span className="absolute left-0">0%</span>
        <span className="absolute -translate-x-1/2 text-[#f0b90b]" style={{ left: at(limit) }}>
          −{limit}%
        </span>
        <span className="absolute right-0">−{scale}%</span>
      </div>
      <ul className="mt-4 space-y-1.5 text-[12.5px] text-white/70">
        {dots.map((d) => (
          <li key={d.tx} className="flex items-center gap-2">
            <span
              aria-hidden
              className={`h-2 w-2 rounded-full ${(d.drawdownPct ?? 0) > limit ? "bg-rose-400" : "bg-emerald-400"}`}
            />
            <span>
              −{d.drawdownPct}% recorded → {(d.drawdownPct ?? 0) > limit ? "contract halted itself" : "inside the limit, kept running"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------- Timeline -- */
const toneDot: Record<TimelineStep["tone"], string> = {
  neutral: "bg-white/60",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
  green: "bg-emerald-400",
};

export function DecisionTimeline() {
  return (
    <ol className="relative space-y-1">
      <span aria-hidden className="absolute bottom-3 left-[7px] top-3 w-px bg-white/10" />
      {SMOKE_TEST.map((s, i) => (
        <li key={s.tx} className="step-in relative pl-7" style={{ animationDelay: `${i * 90}ms` }}>
          <span
            aria-hidden
            className={`absolute left-[3px] top-[18px] h-[9px] w-[9px] rounded-full ring-4 ring-[#0b0c0f] ${toneDot[s.tone]}`}
          />
          <div className="flex flex-col gap-1 rounded-xl px-3 py-2.5 transition hover:bg-white/[0.03] lg:flex-row lg:items-center lg:gap-4">
            <div className="min-w-0 lg:w-[38%]">
              <div className="text-[14px] font-semibold text-white">
                <span className="mr-2 font-mono text-[11px] text-white/40">{String(i + 1).padStart(2, "0")}</span>
                {s.action}
              </div>
              <div className="truncate font-mono text-[11.5px] text-white/55">{s.call}</div>
            </div>
            <div className="text-[13px] text-white/75 lg:flex-1">{s.outcome}</div>
            <a
              href={txUrl(s.tx)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[11.5px] text-[#f0b90b] underline-offset-2 hover:underline"
              aria-label={`${s.action} transaction on BscScan, block ${s.block}`}
            >
              <span className="rounded bg-emerald-500/15 px-1 text-[10px] text-emerald-300">status 1</span>
              <span className="whitespace-nowrap">#{s.block.toLocaleString("en-US")} · {short(s.tx, 8, 4)} ↗</span>
            </a>
          </div>
        </li>
      ))}
      <li className="pl-7 pt-2 text-[11.5px] text-white/45">
        Executed {DEX_GUARD.testedOn} from the agent wallet. Static record of verified receipts — not a live
        feed. Plus one simulated call from a random address: reverted with <span className="font-mono">NotAgent()</span>.
      </li>
    </ol>
  );
}
