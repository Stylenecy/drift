import type { CSSProperties } from "react";
import Link from "next/link";
import { Lines } from "@/features/motion/Lines";
import { DEX_GUARD } from "@/features/guard/evidence";
import { LiveStatus } from "./LiveStatus";

// Hero: one promise, one sentence, one call to action, and the live state of the
// contract underneath. Behind it, a quiet dial of the rule itself: losses from 0 to
// 30%, the gold tick is the 20% limit stored in the contract (a rule, not data).

const LIMIT = DEX_GUARD.maxDrawdownBps / 100; // 20
const SCALE = 30;
const R = 460;
const C = { x: 500, y: 500 };
const pt = (pct: number, r = R) => {
  const a = Math.PI - (pct / SCALE) * Math.PI;
  return { x: C.x + r * Math.cos(a), y: C.y - r * Math.sin(a) };
};
const arc = (from: number, to: number) => {
  const a = pt(from);
  const b = pt(to);
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${R} ${R} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
};

function Dial() {
  const ticks = Array.from({ length: 13 }, (_, i) => i * 2.5);
  const lim0 = pt(LIMIT, R - 70);
  const lim1 = pt(LIMIT, R + 26);
  const label = pt(LIMIT, R + 52);
  return (
    <svg viewBox="0 0 1000 540" className="h-auto w-full" aria-hidden>
      <path d={arc(0, LIMIT)} fill="none" stroke="var(--line-strong)" strokeWidth="2" />
      <path d={arc(LIMIT, SCALE)} fill="none" stroke="var(--veto)" strokeOpacity="0.55" strokeWidth="2" />
      {ticks.map((t) => {
        const a = pt(t, R - 14);
        const b = pt(t, R);
        return <line key={t} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--line-strong)" strokeWidth="1.5" />;
      })}
      <line x1={lim0.x} y1={lim0.y} x2={lim1.x} y2={lim1.y} stroke="var(--chain)" strokeWidth="2.5" />
      <text x={label.x + 8} y={label.y} fill="var(--chain)" fontSize="15" letterSpacing="1.5" fontFamily="var(--font-geist-mono), monospace">
        LOSS LIMIT {LIMIT}%
      </text>
      <text x={pt(0).x} y={C.y + 30} fill="var(--mute)" fontSize="14" textAnchor="middle" fontFamily="var(--font-geist-mono), monospace">
        0%
      </text>
      <text x={pt(SCALE).x} y={C.y + 30} fill="var(--mute)" fontSize="14" textAnchor="middle" fontFamily="var(--font-geist-mono), monospace">
        −{SCALE}%
      </text>
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden px-4 pb-8 pt-[96px] sm:px-8 sm:pb-10">
      <div
        aria-hidden
        className="ld-fade pointer-events-none absolute -right-[18%] top-[14%] -z-10 w-[120vw] opacity-60 sm:-right-[6%] sm:top-[10%] sm:w-[72vw] sm:opacity-100 lg:w-[62vw]"
        style={{ "--d": "0.4s" } as CSSProperties}
      >
        <Dial />
      </div>

      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-end">
        <Lines
          as="h1"
          mode="settle"
          delay={0.05}
          label="Risk rules you can check."
          className="q-h1 max-w-[11ch] text-bone"
          lines={["Risk rules", <>you can <span key="c" className="text-chain">check.</span></>]}
        />

        <div className="mt-10 grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
          <p className="q-lead ld-settle-up max-w-[38ch] text-mute lg:col-span-6" style={{ "--d": "0.35s" } as CSSProperties}>
            DRIFT is a trading bot with a public referee. Its risk rules live in a contract on BNB Chain, so when losses reach{" "}
            {LIMIT}%, the contract stops the bot on its own. Not its owner. Not a settings page.
          </p>
          <div className="ld-up flex flex-wrap items-center gap-x-7 gap-y-4 lg:col-span-6 lg:justify-end" style={{ "--d": "0.7s" } as CSSProperties}>
            <Link href="/macroguard" className="pill">
              See the live guard <span aria-hidden className="pill-arrow">→</span>
            </Link>
            <Link href="/macroguard#ask" className="text-[15px] text-bone">
              <span className="u-draw pb-0.5">Ask the contract</span>
            </Link>
          </div>
        </div>

        <div className="ld-fade mt-14 sm:mt-16" style={{ "--d": "0.9s" } as CSSProperties}>
          <LiveStatus />
        </div>
      </div>
    </section>
  );
}
