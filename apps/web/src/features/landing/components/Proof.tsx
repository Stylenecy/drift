import Link from "next/link";
import { Count, Reveal } from "@/features/motion/Motion";
import { ScrubWords } from "@/features/motion/Scrub";
import { Chapter } from "@/features/ui/hud";
import { DEX_GUARD, SMOKE_TEST, txUrl } from "@/features/guard/evidence";
import { site } from "../site";

// Numbers as the stage. Every figure is evidence with a source a judge can open:
// the constructor argument, the receipts, the test suite (README, Tests).

const TESTS_URL = "https://github.com/Stylenecy/seed-bnb/tree/dex/drift/drift#tests";

const figures = [
  {
    value: DEX_GUARD.maxDrawdownBps / 100,
    suffix: "%",
    label: "halt line",
    body: "2,000 bps, set in the constructor. A recorded decision at or past it halts the contract.",
    href: txUrl(DEX_GUARD.deployTx),
    link: "deploy tx ↗",
    chain: true,
  },
  {
    value: SMOKE_TEST.length,
    suffix: "",
    label: "receipts, status 1",
    body: "Deploy plus a five-call smoke test on 30 Sep 2026, every one on BscScan.",
    href: "/macroguard#trail",
    link: "decision trail →",
    chain: true,
  },
  {
    value: 30,
    suffix: "",
    label: "contract tests passing",
    body: "Unit, event, fuzz and invariant tests over random agent and stranger calls.",
    href: TESTS_URL,
    link: "tests ↗",
    chain: false,
  },
  {
    value: 100,
    suffix: "%",
    label: "line and branch coverage",
    body: "forge coverage of MacroGuard.sol. The contract itself is unchanged from upstream.",
    href: TESTS_URL,
    link: "coverage ↗",
    chain: false,
  },
];

export function Proof() {
  return (
    <section id="proof" className="cv-auto relative scroll-mt-20 px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-[1440px]">
        <Chapter index="02" label="proof" />
        <ScrubWords
          as="h2"
          className="mt-10 max-w-[30ch] text-[clamp(30px,4.2vw,64px)] font-medium leading-[1.08] tracking-[-0.03em] text-bone"
          segments={[
            { text: "Most trading bots" },
            { text: "ask for your trust.", className: "serif-i" },
            { text: "DRIFT puts its risk gate" },
            { text: "on BNB Chain,", className: "text-chain" },
            { text: "where anyone can read it, ask it a what-if and open every receipt." },
          ]}
        />

        <Reveal as="dl" kind="stagger" className="mt-16 grid grid-cols-1 border-t border-[var(--line-strong)] sm:grid-cols-2 lg:grid-cols-4">
          {figures.map((f, i) => (
            <div
              key={f.label}
              className={`flex flex-col border-b border-[var(--line)] py-8 sm:px-6 lg:border-b-0 ${i > 0 ? "lg:border-l" : ""} ${i % 2 ? "sm:border-l" : ""} border-[var(--line)] sm:first:pl-0`}
            >
              <dt className="meta order-2 mt-3 text-mute">{f.label}</dt>
              <dd className="order-1 font-mono text-[64px] leading-none tracking-[-0.05em] text-bone sm:text-[80px]">
                <Count value={f.value} suffix={f.suffix} />
              </dd>
              <dd className="order-3 mt-4 max-w-[30ch] text-[14px] leading-relaxed text-mute">{f.body}</dd>
              <dd className="order-4 mt-5">
                {f.href.startsWith("/") ? (
                  <Link href={f.href} className={`meta ${f.chain ? "text-chain" : "text-bone"}`}>
                    <span className="u-draw pb-0.5">{f.link}</span>
                  </Link>
                ) : (
                  <a href={f.href} target="_blank" rel="noopener noreferrer" className={`meta ${f.chain ? "text-chain" : "text-bone"}`}>
                    <span className="u-draw pb-0.5">{f.link}</span>
                  </a>
                )}
              </dd>
            </div>
          ))}
        </Reveal>
        <p className="meta mt-6 text-mute">
          Sources: <a className="text-bone underline-offset-2 hover:underline" href={site.repo} target="_blank" rel="noopener noreferrer">README · proof and tests ↗</a>
        </p>
      </div>
    </section>
  );
}
