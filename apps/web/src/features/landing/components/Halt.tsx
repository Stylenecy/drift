import type { CSSProperties } from "react";
import Link from "next/link";
import { Reveal, SplitWords } from "@/features/motion/Motion";
import { Chapter } from "@/features/ui/hud";
import { DEX_GUARD, SMOKE_TEST, short, txUrl } from "@/features/guard/evidence";

// The halt, told with the receipts of the 30 Sep 2026 smoke test: a −1% decision
// stays inside the line; a −25% decision crosses it and the contract halts itself.
// Static, dated evidence: labelled as such, never animated as if it were live.

const SCALE = 30;
const LIMIT = DEX_GUARD.maxDrawdownBps / 100;
const pos = (pct: number) => (pct / SCALE) * 100;
const halt = SMOKE_TEST.find((s) => s.action.startsWith("Breach"))!;
const resume = SMOKE_TEST.find((s) => s.action === "Resume")!;
const recorded = SMOKE_TEST.filter((s) => s.drawdownPct !== undefined);

function Gauge() {
  return (
    <Reveal kind="gauge" className="relative mt-16 select-none sm:mt-20" aria-label={`Drawdown gauge: halt line at ${LIMIT}%, recorded decisions at −1% and −25%`} role="img">
      <div className="meta flex justify-between text-mute">
        <span>0%</span>
        <span>−{SCALE}%</span>
      </div>
      <div className="gauge-track relative mt-4 h-16">
        <div aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-[var(--line-strong)]" />
        <div aria-hidden className="absolute inset-x-0 top-[calc(50%-6px)] h-3 grid-12" />
        <div aria-hidden className="absolute left-0 top-[calc(50%-1px)] h-[3px] bg-ok/50" style={{ width: `${pos(LIMIT)}%` }} />
        <div aria-hidden className="absolute right-0 top-[calc(50%-1px)] h-[3px] bg-veto/60" style={{ left: `${pos(LIMIT)}%` }} />
        {/* the on-chain halt line */}
        <div aria-hidden className="absolute -top-3 bottom-[-12px] w-px bg-chain" style={{ left: `${pos(LIMIT)}%` }}>
          <span className="meta absolute -top-5 right-2 whitespace-nowrap text-chain">halt line · {DEX_GUARD.maxDrawdownBps.toLocaleString("en-US")} bps</span>
        </div>
        {recorded.map((s, i) => {
          const breach = (s.drawdownPct ?? 0) >= LIMIT;
          return (
            <div
              key={s.tx}
              aria-hidden
              className="gauge-mark absolute inset-y-0 left-0 w-0"
              style={{ "--to": pos(s.drawdownPct ?? 0).toFixed(3), "--from": 0, "--d": `${0.3 + i * 0.15}s` } as CSSProperties}
            >
              <span className={`absolute top-1/2 block h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-ink ${breach ? "bg-veto" : "bg-ok"}`} />
              <span className={`meta absolute top-[calc(50%+16px)] -translate-x-1/2 whitespace-nowrap ${breach ? "text-veto" : "text-bone"}`}>
                −{s.drawdownPct}%
              </span>
            </div>
          );
        })}
        {/* the flag appears once the −25% marker has crossed */}
        <div aria-hidden className="gauge-flag absolute -top-10 -translate-x-1/2" style={{ left: `${pos(halt.drawdownPct ?? 25)}%` }}>
          <span className="block bg-veto px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">Halted</span>
        </div>
      </div>
    </Reveal>
  );
}

export function Halt() {
  return (
    <section id="halt" className="cv-auto relative scroll-mt-16 overflow-hidden border-t border-[var(--line)] px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-[1440px]">
        <Chapter index="04" label="the halt" />
        <SplitWords
          className="display-2 mt-10 max-w-[14ch] text-bone"
          segments={[{ text: `Past ${LIMIT}%, the contract` }, { text: "halts itself.", className: "text-veto" }]}
        />
        <Reveal className="mt-8 max-w-[52ch] text-[16px] leading-relaxed text-mute" delay={0.15}>
          Each decision the agent records carries its drawdown. At or past the line, MacroGuard flips{" "}
          <code className="font-mono text-[14px] text-bone">halted = true</code> by itself, and from then on only Flat is
          allowed. These are the two decisions recorded on {DEX_GUARD.testedOn}.
        </Reveal>

        <Gauge />

        <div className="mt-24 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <Reveal kind="clip" className="lg:col-span-6">
            <article className="hud hud-chain relative bg-slate-1/40 px-5 pb-6 pt-10 sm:px-7">
              <span className="meta absolute left-4 top-3 text-chain">(receipt)</span>
              <span className="meta absolute right-4 top-3 text-mute">status 1 · {DEX_GUARD.testedOn}</span>
              <h3 className="font-mono text-[15px] text-bone [overflow-wrap:anywhere] sm:text-[17px]">{halt.call}</h3>
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="meta text-mute">Block</dt>
                  <dd className="mt-1 font-mono text-[20px] text-bone tnum">{halt.block.toLocaleString("en-US")}</dd>
                </div>
                <div>
                  <dt className="meta text-mute">Gas used</dt>
                  <dd className="mt-1 font-mono text-[20px] text-bone tnum">{halt.gas.toLocaleString("en-US")}</dd>
                </div>
                <div>
                  <dt className="meta text-mute">Event</dt>
                  <dd className="mt-1 font-mono text-[20px] text-veto">Halted</dd>
                </div>
                <div>
                  <dt className="meta text-mute">After it</dt>
                  <dd className="mt-1 text-[15px] text-bone">only Flat allowed</dd>
                </div>
              </dl>
              <a
                href={txUrl(halt.tx)}
                target="_blank"
                rel="noopener noreferrer"
                className="meta mt-8 inline-flex items-center gap-2 border-t border-[var(--line)] pt-4 text-chain"
              >
                <span className="u-draw pb-0.5">Open {short(halt.tx, 8, 4)} on BscScan ↗</span>
              </a>
              <p className="mt-4 text-[13px] leading-relaxed text-mute">
                A halt is a recorded pause, not a lock: the agent resumed it in block{" "}
                <a href={txUrl(resume.tx)} target="_blank" rel="noopener noreferrer" className="text-bone underline underline-offset-2">
                  {resume.block.toLocaleString("en-US")}
                </a>
                , also on the record.
              </p>
            </article>
          </Reveal>

          <Reveal className="flex flex-col justify-between gap-10 lg:col-span-5 lg:col-start-8" delay={0.15}>
            <div>
              <span className="bracket">(ask it yourself)</span>
              <p className="display-3 mt-5 text-bone">
                Long at −25%? <span className="serif-i text-chain">Ask the live contract.</span>
              </p>
              <p className="mt-5 max-w-[42ch] text-[15px] leading-relaxed text-mute">
                The guard page sends one <code className="font-mono text-[13px] text-bone">eth_call</code> of{" "}
                <code className="font-mono text-[13px] text-bone">recordDecision</code> from the agent address. Nothing is signed or
                written, and the answer comes from BSC Testnet with the block it was read at.
              </p>
            </div>
            <Link
              href="/macroguard#ask"
              className="group inline-flex w-fit items-center gap-3 bg-chain px-5 py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-chain-soft"
            >
              Ask the contract
              <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">→</span>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
