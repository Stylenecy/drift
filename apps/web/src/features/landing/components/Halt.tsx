import type { CSSProperties } from "react";
import { Reveal, SplitWords } from "@/features/motion/Motion";
import { DEX_GUARD, SMOKE_TEST, txUrl } from "@/features/guard/evidence";

// The limit, told with the two decisions recorded on 30 Sep 2026: a 1% loss stays
// inside the line; a 25% loss crosses it and the contract halts the bot itself.
// Static, dated evidence: never animated as if it were live.

const SCALE = 30;
const LIMIT = DEX_GUARD.maxDrawdownBps / 100;
const pos = (pct: number) => (pct / SCALE) * 100;
const halt = SMOKE_TEST.find((s) => s.action.startsWith("Breach"))!;
const recorded = SMOKE_TEST.filter((s) => s.drawdownPct !== undefined);

function Gauge() {
  return (
    <Reveal
      kind="gauge"
      className="relative mt-20 select-none sm:mt-28"
      aria-label={`Loss scale from 0 to ${SCALE}%. The limit is ${LIMIT}%. A 1% loss kept running; a 25% loss stopped the bot.`}
      role="img"
    >
      <div className="gauge-track relative h-24">
        <div aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-[var(--line-strong)]" />
        <div aria-hidden className="absolute right-0 top-[calc(50%-1px)] h-[3px] bg-veto/60" style={{ left: `${pos(LIMIT)}%` }} />
        <div aria-hidden className="absolute -top-2 bottom-[-8px] w-0.5 bg-chain" style={{ left: `${pos(LIMIT)}%` }}>
          <span className="absolute -top-7 left-3 whitespace-nowrap text-[14px] text-chain-soft">{LIMIT}% limit</span>
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
              <span className={`absolute top-1/2 block h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink ${breach ? "bg-veto" : "bg-ok"}`} />
              <span
                className={`absolute top-[calc(50%+18px)] whitespace-nowrap text-[14px] ${pos(s.drawdownPct ?? 0) < 12 ? "-translate-x-2" : "-translate-x-1/2"} ${breach ? "text-veto" : "text-bone"}`}
              >
                {breach ? `−${s.drawdownPct}% · stopped` : `−${s.drawdownPct}% · kept running`}
              </span>
            </div>
          );
        })}
      </div>
      <div aria-hidden className="mt-2 flex justify-between text-[13px] text-mute">
        <span>0%</span>
        <span>−{SCALE}%</span>
      </div>
    </Reveal>
  );
}

export function Halt() {
  return (
    <section id="limit" className="cv-auto relative scroll-mt-16 px-4 py-28 sm:px-8 sm:py-40">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 lg:grid-cols-12">
        <SplitWords
          className="q-h2 text-bone lg:col-span-7"
          segments={[{ text: "One line it" }, { text: "cannot cross.", className: "text-chain" }]}
        />
        <Reveal className="q-lead max-w-[42ch] self-end text-mute lg:col-span-5" delay={0.15}>
          Every decision the bot makes is recorded with its current loss. At {LIMIT}%, the contract halts the bot and only
          closing positions is allowed. We tested it in public: a 1% loss kept running, a 25% loss stopped it.
        </Reveal>
      </div>
      <div className="mx-auto max-w-[1440px]">
        <Gauge />
        <Reveal className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-6" delay={0.1}>
          <span className="text-[15px] text-mute">Recorded on BNB Chain, 30 September 2026.</span>
          <a href={txUrl(halt.tx)} target="_blank" rel="noopener noreferrer" className="text-[15px] text-chain-soft">
            <span className="u-draw pb-0.5">Open the receipt ↗</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
