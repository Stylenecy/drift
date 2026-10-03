import Link from "next/link";
import { Container } from "./Container";
import { Reveal } from "./primitives";

type Step = { where: "off" | "on"; title: string; body: string; code: string };

const steps: Step[] = [
  {
    where: "off",
    title: "Engine proposes a signal",
    body: "Python strategies read Bybit market data and choose Long, Short or Flat.",
    code: "signal = rsi.next(bar)",
  },
  {
    where: "on",
    title: "MacroGuard says yes or no",
    body: "The contract checks the stored regime and the halt flag. Reading it is free.",
    code: "allowed(signal) → bool",
  },
  {
    where: "off",
    title: "Runner trades on testnet",
    body: "The runner sends an order to Bybit testnet only when the gate allows it — unless the chain is unreachable (fail-open). Execution stays off-chain.",
    code: "bybit.order(…)",
  },
  {
    where: "on",
    title: "Decision goes on the record",
    body: "Each decision becomes a public receipt. A drawdown past 20% halts the guard.",
    code: "recordDecision(…) → tx",
  },
];

const tone = {
  off: { ring: "border-[#9aa8f0]/30", tag: "text-[#aeb9f4] bg-[#9aa8f0]/10", label: "off-chain engine" },
  on: { ring: "border-[#f0b90b]/40", tag: "text-[#f8d36a] bg-[#f0b90b]/10", label: "on BNB Chain" },
};

export function GuardStory() {
  return (
    <section id="how" className="relative scroll-mt-20 py-24">
      <Container>
        <Reveal>
          <div className="max-w-2xl">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#f0b90b]">How DRIFT stays honest</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-[42px] sm:leading-[1.1]">
              Heavy maths off-chain. The rules that matter on-chain.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/65">
              Anything in gold can be checked on BscScan without trusting DRIFT&apos;s servers. Anything in
              periwinkle runs in DRIFT&apos;s own engine.
            </p>
          </div>
        </Reveal>

        <ol className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title}>
            <Reveal delay={i * 90} className="h-full">
              <div className={`flex h-full flex-col rounded-2xl border bg-white/[0.03] p-5 ${tone[s.where].ring}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] text-white/45">{String(i + 1).padStart(2, "0")}</span>
                  <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${tone[s.where].tag}`}>
                    {tone[s.where].label}
                  </span>
                </div>
                <h3 className="mt-4 text-[16px] font-semibold text-white">{s.title}</h3>
                <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-white/65">{s.body}</p>
                <code className="mt-4 block rounded-lg bg-black/40 px-3 py-2 font-mono text-[12px] text-white/75">{s.code}</code>
              </div>
            </Reveal>
            </li>
          ))}
        </ol>

        <Reveal delay={200}>
          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center">
            <p className="max-w-2xl text-[13.5px] leading-relaxed text-white/65">
              <span className="font-semibold text-white">What it does not do:</span> the contract never places
              orders, and if the chain is unreachable the runner falls back to its local stop. The live guard page says so too.
            </p>
            <Link
              href="/macroguard"
              className="shrink-0 rounded-full border border-[#f0b90b]/45 px-4 py-2 text-sm text-[#f8d36a] transition hover:bg-[#f0b90b]/10"
            >
              See the live guard →
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
