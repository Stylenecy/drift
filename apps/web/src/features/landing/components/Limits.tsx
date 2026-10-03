import { Reveal, SplitWords } from "@/features/motion/Motion";
import { Chapter } from "@/features/ui/hud";

// The one light block of the page: what the proof does not cover, said before
// anyone has to ask (README "What this does not prove", docs/THREAT-MODEL.md).

const limits = [
  { k: "Execution", v: "The contract never places exchange orders. Execution stays off-chain, in the runner." },
  { k: "Fail-open", v: "If the RPC is unreachable, the runner falls back to its local drawdown stop instead of the chain." },
  { k: "Resume", v: "The agent can call resume() at any time. A halt is a recorded pause, not a lock." },
  { k: "Drawdown", v: "The drawdown is reported by the agent, not measured by the contract." },
  { k: "Profit", v: "No live bot tick and no profit are claimed. Backtests are research only." },
];

export function Limits() {
  return (
    <section id="limits" className="relative scroll-mt-16 bg-paper px-4 py-24 text-ink sm:px-6 sm:py-32">
      <div className="mx-auto max-w-[1440px]">
        <Chapter index="06" label="limits" tone="ink" />
        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <SplitWords as="h2" className="display-2 text-ink" segments={[{ text: "What this does", className: "" }, { text: "not prove.", className: "serif-i" }]} />
            <Reveal className="mt-8 max-w-[38ch] text-[15px] leading-relaxed text-paper-mute" delay={0.15}>
              Four limits of the design and one of the evidence. The roadmap answers each: a multisig or timelock for resume, a
              fail-closed mode, proven equity.
            </Reveal>
          </div>
          <Reveal as="dl" kind="stagger" className="border-t border-ink/20 lg:col-span-7">
            {limits.map((l, i) => (
              <div key={l.k} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-ink/15 py-5 sm:grid-cols-[2.5rem_9rem_1fr]">
                <span aria-hidden className="font-mono text-[12px] leading-7 text-paper-mute tnum">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <dt className="text-[17px] font-semibold leading-7 tracking-[-0.01em] text-ink">{l.k}</dt>
                <dd className="col-start-2 mt-1 text-[15px] leading-relaxed text-paper-mute sm:col-start-3 sm:mt-0 sm:leading-7">{l.v}</dd>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
