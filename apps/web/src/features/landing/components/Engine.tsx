import Image from "next/image";
import Link from "next/link";
import { Reveal, SplitWords } from "@/features/motion/Motion";
import { Chapter } from "@/features/ui/hud";

// The off-chain half, told plainly: four classical strategies (ported from
// je-suis-tm/quant-trading, see apps/trader/app/strategies), a backtester that
// refuses look-ahead, an optimizer scored on data it never saw. The picture is a
// real terminal recording (docs/screens/cli, 3 Oct 2026), labelled with its data source.

const strategies = [
  { name: "MACD", note: "fast / slow moving-average cross" },
  { name: "RSI", note: "long when oversold, flat when overbought" },
  { name: "Bollinger", note: "long below the lower band" },
  { name: "Dual Thrust", note: "breakout of close ± k · range" },
];

const rules = [
  { k: "t → t+1", v: "A signal computed on bar t only trades on bar t+1. Tested as a property for every strategy." },
  { k: "70 / 30", v: "The optimizer tunes on the first 70% of history and is scored on the 30% it never saw." },
  { k: "−20%", v: "Each bot carries its own drawdown stop (20% by default): past it the runner flattens and halts the bot." },
];

export function Engine() {
  return (
    <section id="engine" className="cv-auto relative scroll-mt-16 border-t border-[var(--line)] px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-[1440px]">
        <Chapter index="05" label="the engine" />
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          <SplitWords
            className="display-2 text-bone lg:col-span-7"
            segments={[{ text: "Research that" }, { text: "refuses to look ahead.", className: "serif-i" }]}
          />
          <Reveal className="max-w-[40ch] text-[15px] leading-relaxed text-mute lg:col-span-4 lg:col-start-9 lg:self-end" delay={0.15}>
            The quant engine runs off-chain, on your own machine: strategies, an honest backtester, an optimizer and the live
            runner. Backtests are research, never a profit claim.
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <Reveal as="ol" kind="stagger" className="border-t border-[var(--line-strong)] lg:col-span-5">
            {strategies.map((s, i) => (
              <li key={s.name} className="group flex items-baseline gap-5 border-b border-[var(--line)] py-5">
                <span className="font-mono text-[12px] text-mute tnum">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[28px] font-semibold tracking-[-0.03em] text-bone sm:text-[34px]">{s.name}</span>
                <span className="meta ml-auto hidden text-right text-mute sm:inline">{s.note}</span>
              </li>
            ))}
          </Reveal>

          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal kind="clip">
              <figure className="hud relative bg-slate-1 p-2 sm:p-3">
                <Image
                  src="/screens/cli-research-btc-1h.png"
                  alt="DRIFT terminal, research btc 1h: four strategies optimised on 70% of history and scored on the held-out 30%, run on Binance public-data fallback, 1000 candles from 22 Aug to 3 Oct 2026"
                  width={1238}
                  height={368}
                  sizes="(min-width: 1024px) 46vw, 92vw"
                  className="h-auto w-full"
                />
              </figure>
            </Reveal>
            <p className="meta mt-3 text-mute">
              Recorded 3 Oct 2026 · <span className="text-bone">./drift research btc 1h</span> · Binance public-data fallback ·
              research, not a profit claim
            </p>

            <Reveal as="dl" kind="stagger" className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {rules.map((r) => (
                <div key={r.k} className="border-t border-[var(--line-strong)] pt-4">
                  <dt className="font-mono text-[22px] tracking-[-0.03em] text-engine">{r.k}</dt>
                  <dd className="mt-2 text-[13.5px] leading-relaxed text-mute">{r.v}</dd>
                </div>
              ))}
            </Reveal>
            <p className="mt-8 text-[14px] text-mute">
              Run it yourself:{" "}
              <Link href="/login" className="text-bone">
                <span className="u-draw pb-0.5">open the cockpit</span>
              </Link>{" "}
              (needs the engine on your machine) or read the{" "}
              <a href="https://github.com/Stylenecy/seed-bnb/tree/dex/drift/drift#quick-start" target="_blank" rel="noopener noreferrer" className="text-bone">
                <span className="u-draw pb-0.5">quick start ↗</span>
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
