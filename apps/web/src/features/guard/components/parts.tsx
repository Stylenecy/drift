"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { Reveal } from "@/features/motion/Motion";
import { SMOKE_TEST, DEX_GUARD, txUrl, short, type TimelineStep } from "../evidence";

/* --------------------------------------------------------------- Shell -- */
// A HUD-framed surface. Gold corners mark content a judge can verify on BscScan.
export function Panel({
  children,
  className = "",
  chain,
  label,
  aside,
  id,
  reveal = true,
  delay,
}: {
  children: ReactNode;
  className?: string;
  chain?: boolean;
  label?: ReactNode;
  aside?: ReactNode;
  id?: string;
  /** true: opens when scrolled into view · "load": opens on first paint (above the fold) · false: static. */
  reveal?: boolean | "load";
  delay?: number;
}) {
  const cls = `hud ${chain ? "hud-chain" : ""} relative scroll-mt-24 bg-slate-1/35 ${className}`;
  const inner = (
    <>
      {(label || aside) && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          {label && <div>{label}</div>}
          {aside && <div className="min-w-0">{aside}</div>}
        </div>
      )}
      {children}
    </>
  );
  // One element, so grid placement classes (lg:col-span-*) land on the grid item.
  if (reveal === true) {
    return (
      <Reveal as="section" kind="clip" id={id} className={cls} delay={delay}>
        {inner}
      </Reveal>
    );
  }
  return (
    <section
      id={id}
      className={`${cls} ${reveal === "load" ? "ld-clip" : ""}`}
      style={reveal === "load" ? ({ "--d": `${delay ?? 0.5}s` } as CSSProperties) : undefined}
    >
      {inner}
    </section>
  );
}

export function Eyebrow({ children, chain }: { children: ReactNode; chain?: boolean }) {
  return <div className={`meta ${chain ? "text-chain" : "text-mute"}`}>{children}</div>;
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
      className="meta border border-[var(--line-strong)] px-2 py-0.5 text-mute transition-colors hover:border-bone/40 hover:text-bone"
      aria-label={`Copy ${label}`}
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}

/* ------------------------------------------------------- Regime stepper -- */
const REGIMES = [
  { label: "Risk off", hint: "Long vetoed", on: "border-warn/60 bg-warn/10 text-warn" },
  { label: "Neutral", hint: "All signals open", on: "border-bone/50 bg-bone/[0.08] text-bone" },
  { label: "Risk on", hint: "All signals open", on: "border-ok/50 bg-ok/10 text-ok" },
];

export function RegimeStepper({ regime }: { regime: number | null }) {
  return (
    <div role="group" aria-label="Market regime stored on-chain" className="grid grid-cols-3">
      {REGIMES.map((r, i) => {
        const active = regime === i;
        return (
          <div
            key={r.label}
            aria-current={active ? "true" : undefined}
            className={`border px-3 py-2.5 transition-colors duration-500 ${i > 0 ? "-ml-px" : ""} ${
              active ? `relative z-10 ${r.on}` : "border-[var(--line-strong)] text-mute"
            }`}
          >
            <div className="text-[13px] font-semibold">
              {active && <span aria-hidden>● </span>}
              {r.label}
            </div>
            <div className={`meta mt-0.5 ${active ? "" : "text-mute"}`}>{r.hint}</div>
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
    return <span className="meta text-mute">Halt state unknown</span>;
  }
  return halted ? (
    <span className="meta inline-flex items-center gap-2 border border-veto/60 bg-veto/15 px-3 py-1 text-veto-soft">
      <span aria-hidden>■</span> Halted — only Flat allowed
    </span>
  ) : (
    <span className="meta inline-flex items-center gap-2 border border-ok/40 bg-ok/10 px-3 py-1 text-ok">
      <span aria-hidden className="live-dot h-2 w-2 rounded-full bg-ok" /> Running — no drawdown halt
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
    <ul className="grid grid-cols-1 sm:grid-cols-3">
      {(["long", "short", "flat"] as const).map((sig, i) => {
        const ok = allowed[sig];
        return (
          <li
            key={sig}
            className={`step-in border p-5 ${i > 0 ? "sm:-ml-px" : ""} ${i > 0 ? "-mt-px sm:mt-0" : ""} ${
              ok ? "border-[var(--line-strong)]" : "relative z-10 border-veto/70 bg-veto/[0.08]"
            }`}
            style={{ animationDelay: `${i * 90}ms` } as CSSProperties}
          >
            <div className="flex items-center justify-between">
              <span className="meta text-mute">{sig}</span>
              <span
                className={`grid h-7 w-7 place-items-center border text-[13px] font-bold ${
                  ok ? "border-ok/50 text-ok" : "border-veto/70 text-veto-soft"
                }`}
                aria-hidden
              >
                {ok ? "✓" : "✕"}
              </span>
            </div>
            <div className={`mt-4 text-[28px] font-semibold leading-none tracking-[-0.03em] ${ok ? "text-bone" : "text-veto-soft"}`}>
              {ok ? "Allowed" : "Blocked"}
            </div>
            <p className="mt-2 text-[13px] leading-snug text-mute">{reasonFor(sig, ok, regime, halted)}</p>
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
  const pos = (pct: number) => Math.min(100, (pct / scale) * 100);
  const dots = SMOKE_TEST.filter((s) => s.drawdownPct !== undefined);

  return (
    <Reveal kind="gauge" className="mt-10">
      <div className="gauge-track relative h-8">
        <div aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-[var(--line-strong)]" />
        <div aria-hidden className="absolute left-0 top-[calc(50%-1px)] h-[3px] bg-ok/45" style={{ width: `${pos(limit)}%` }} />
        <div aria-hidden className="absolute right-0 top-[calc(50%-1px)] h-[3px] bg-veto/55" style={{ left: `${pos(limit)}%` }} />
        {/* on-chain halt line */}
        <div className="absolute -top-6 bottom-[-6px] w-px bg-chain" style={{ left: `${pos(limit)}%` }}>
          <span className="meta absolute -top-0.5 right-1.5 whitespace-nowrap text-chain">halt line · {maxDrawdownBps.toLocaleString("en-US")} bps</span>
        </div>
        {dots.map((d, i) => (
          <div
            key={d.tx}
            className="gauge-mark absolute inset-y-0 left-0 w-0"
            style={{ "--to": pos(d.drawdownPct ?? 0).toFixed(3), "--d": `${0.2 + i * 0.15}s` } as CSSProperties}
          >
            <span
              className={`absolute top-1/2 block h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-ink ${
                (d.drawdownPct ?? 0) >= limit ? "bg-veto" : "bg-ok"
              }`}
              title={`${d.action}: −${d.drawdownPct}%`}
            />
          </div>
        ))}
      </div>
      {/* axis labels sit at their own positions, so −limit% lines up with the halt line */}
      <div className="meta relative mt-2 h-4 text-mute">
        <span className="absolute left-0">0%</span>
        <span className="absolute -translate-x-1/2 text-chain" style={{ left: `${pos(limit)}%` }}>
          −{limit}%
        </span>
        <span className="absolute right-0">−{scale}%</span>
      </div>
      <ul className="mt-5 space-y-1.5 text-[13px] text-mute">
        {dots.map((d) => (
          <li key={d.tx} className="flex items-center gap-2">
            <span aria-hidden className={`h-2 w-2 rotate-45 ${(d.drawdownPct ?? 0) >= limit ? "bg-veto" : "bg-ok"}`} />
            <span>
              −{d.drawdownPct}% recorded → {(d.drawdownPct ?? 0) >= limit ? "contract halted itself" : "inside the limit, kept running"}
            </span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

/* ------------------------------------------------------------- Timeline -- */
const toneDot: Record<TimelineStep["tone"], string> = {
  neutral: "bg-bone/70",
  amber: "bg-warn",
  rose: "bg-veto",
  green: "bg-ok",
};

export function DecisionTimeline() {
  return (
    <div className="relative">
      <span aria-hidden className="absolute bottom-16 left-[7px] top-6 w-px bg-[var(--line-strong)]" />
      <Reveal as="ol" kind="stagger">
        {SMOKE_TEST.map((s, i) => (
          <li key={s.tx} className="relative pl-7">
            <span aria-hidden className={`absolute left-[3px] top-[20px] h-[9px] w-[9px] rotate-45 ${toneDot[s.tone]}`} />
            <div
              className={`flex flex-col gap-1 border-b border-[var(--line)] px-3 py-3 transition-colors hover:bg-bone/[0.03] lg:flex-row lg:items-center lg:gap-4 ${
                s.tone === "rose" ? "bg-veto/[0.06]" : ""
              }`}
            >
              <div className="min-w-0 lg:w-[38%]">
                <div className="text-[14px] font-semibold text-bone">
                  <span className="mr-2 font-mono text-[11px] text-mute tnum">{String(i + 1).padStart(2, "0")}</span>
                  {s.action}
                </div>
                <div className="truncate font-mono text-[11.5px] text-mute">{s.call}</div>
              </div>
              <div className={`text-[13px] lg:flex-1 ${s.tone === "rose" ? "text-veto-soft" : "text-bone/85"}`}>{s.outcome}</div>
              <a
                href={txUrl(s.tx)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 font-mono text-[11.5px] text-chain underline-offset-2 hover:underline"
                aria-label={`${s.action} transaction on BscScan, block ${s.block}`}
              >
                <span className="meta border border-ok/40 px-1 text-[10px] text-ok">status 1</span>
                <span className="whitespace-nowrap tnum">
                  #{s.block.toLocaleString("en-US")} · {short(s.tx, 8, 4)} ↗
                </span>
              </a>
            </div>
          </li>
        ))}
      </Reveal>
      <p className="pl-7 pt-4 text-[12px] leading-relaxed text-mute">
        Executed {DEX_GUARD.testedOn} from the agent wallet. Static record of verified receipts — not a live feed. Plus one
        simulated call from a random address: reverted with <span className="font-mono">NotAgent()</span>.
      </p>
    </div>
  );
}
