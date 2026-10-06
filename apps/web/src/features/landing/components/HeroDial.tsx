"use client";

import { DEX_GUARD, SMOKE_TEST, txUrl } from "@/features/guard/evidence";
import { usePlay } from "../motion";

// The hero instrument: an 11 s loop of how the brake works. The loss wanders, spikes
// past the 20% line, the contract halts the bot, the REAL halt receipt from the
// 30 Sep 2026 public test slides in, then the owner resumes it on the record.
// The wandering values are an illustration; the receipt and the limit are real.

const LIMIT = DEX_GUARD.maxDrawdownBps / 100; // 20
const SCALE = 30;
const R = 420;
const C = { x: 500, y: 500 };
const halt = SMOKE_TEST.find((s) => s.action.startsWith("Breach"))!;

const pt = (pct: number, r = R) => {
  const a = Math.PI - (pct / SCALE) * Math.PI;
  return { x: C.x + r * Math.cos(a), y: C.y - r * Math.sin(a) };
};
const arc = (from: number, to: number, r = R) => {
  const a = pt(from, r);
  const b = pt(to, r);
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${r} ${r} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
};

export function HeroDial() {
  const ref = usePlay<HTMLDivElement>();
  const ticks = Array.from({ length: 31 }, (_, i) => i);
  const lim0 = pt(LIMIT, R - 64);
  const lim1 = pt(LIMIT, R + 24);
  const limLabel = pt(LIMIT, R + 48);

  return (
    <div ref={ref} className="mo relative">
      <div className="relative" role="img" aria-label={`An animated loss dial. The loss moves, crosses the ${LIMIT}% limit and the contract halts the bot.`}>
      {/* flash on the halt */}
      <div aria-hidden className="mo-flash pointer-events-none absolute inset-[8%] rounded-full bg-veto/30 blur-3xl" />

      <svg viewBox="0 0 1000 560" className="relative h-auto w-full" aria-hidden>
        {/* scale */}
        <path d={arc(0, SCALE)} fill="none" stroke="var(--line-strong)" strokeWidth="2" />
        <path d={arc(LIMIT, SCALE, R - 18)} fill="none" stroke="var(--veto)" strokeOpacity="0.45" strokeWidth="10" />
        {ticks.map((t) => {
          const major = t % 5 === 0;
          const a = pt(t, R - (major ? 30 : 16));
          const b = pt(t, R);
          return (
            <line
              key={t}
              className="mo-tick"
              style={{ "--i": t } as React.CSSProperties}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="var(--bone)"
              strokeWidth={major ? 2.5 : 1.5}
            />
          );
        })}
        {[0, 10, SCALE].map((t) => {
          const p = pt(t, R + 34);
          return (
            <text key={t} x={p.x} y={p.y + 6} fill="var(--mute)" fontSize="20" textAnchor="middle" fontFamily="var(--font-geist-mono), monospace">
              {t === 0 ? "0%" : `−${t}%`}
            </text>
          );
        })}

        {/* the on-chain limit */}
        <line x1={lim0.x} y1={lim0.y} x2={lim1.x} y2={lim1.y} stroke="var(--chain)" strokeWidth="5" strokeLinecap="round" />
        <text x={limLabel.x + 14} y={limLabel.y} fill="var(--chain)" fontSize="20" letterSpacing="2" fontFamily="var(--font-geist-mono), monospace">
          LIMIT {LIMIT}%
        </text>

        {/* halted layer */}
        <g className="mo-halt">
          <path d={arc(LIMIT, SCALE, R - 18)} fill="none" stroke="var(--veto)" strokeWidth="14" />
        </g>

        {/* needles: bone while running, vermilion once halted */}
        <g className="mo-run">
          <line className="mo-needle" x1={C.x - 300} y1={C.y} x2={C.x - R + 6} y2={C.y} stroke="var(--bone)" strokeWidth="8" strokeLinecap="round" />
        </g>
        <g className="mo-halt">
          <line className="mo-needle-halt" x1={C.x - 300} y1={C.y} x2={C.x - R + 6} y2={C.y} stroke="var(--veto)" strokeWidth="8" strokeLinecap="round" />
        </g>
      </svg>

      {/* readout */}
      <div className="pointer-events-none absolute inset-x-0 top-[47%] flex flex-col items-center text-center">
        <span className="mo-run text-[13px] font-medium uppercase tracking-[0.16em] text-ok">● Bot running</span>
        <span className="mo-halt -mt-[1.2em] text-[13px] font-medium uppercase tracking-[0.16em] text-veto">■ Halted · exits only</span>
        <span className="mo-loss mt-2 font-mono text-[clamp(40px,6vw,88px)] leading-none tracking-[-0.04em] text-bone tnum" />
        <span className="mt-2 text-[13px] uppercase tracking-[0.14em] text-mute">Loss right now</span>
      </div>

      </div>

      {/* the real receipt: its own slot under the dial on phones, over the dial from sm */}
      <div className="relative mt-3 h-[104px] sm:pointer-events-none sm:absolute sm:inset-0 sm:mt-0 sm:h-auto">
        <a
          href={txUrl(halt.tx)}
          target="_blank"
          rel="noopener noreferrer"
          aria-hidden
          tabIndex={-1}
          className="mo-receipt absolute inset-x-0 top-0 rounded-2xl border border-chain/50 bg-slate-1/90 p-4 text-left backdrop-blur-sm sm:pointer-events-auto sm:inset-x-auto sm:bottom-[-4%] sm:right-[6%] sm:top-auto sm:w-[300px]"
        >
          <span className="block text-[11px] uppercase tracking-[0.14em] text-mute">Real receipt · 30 Sep 2026</span>
          <span className="mt-1.5 block text-[16px] font-medium text-bone">Contract halted the bot</span>
          <span className="mt-1 block font-mono text-[13px] text-chain-soft tnum">block {halt.block.toLocaleString("en-US")} ↗</span>
        </a>
        <span className="mo-resume absolute left-0 top-4 rounded-full border border-[var(--line-strong)] bg-ink/80 px-4 py-2 text-[13px] text-bone sm:bottom-[2%] sm:left-[4%] sm:top-auto">
          Resumed by the owner&apos;s key · on the record
        </span>
      </div>
    </div>
  );
}
