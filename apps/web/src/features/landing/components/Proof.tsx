"use client";

import Link from "next/link";
import { Count, Reveal } from "@/features/motion/Motion";
import { DEX_GUARD, SMOKE_TEST, addressUrl } from "@/features/guard/evidence";
import { site } from "../site";
import { usePlay } from "../motion";

// Proof as three big numbers, each one link from its source, over a slow texture of
// the real transaction hashes from the 30 Sep 2026 public test.

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const STATS = [
  {
    value: SMOKE_TEST.length,
    suffix: `/${SMOKE_TEST.length}`,
    label: "public transactions succeeded",
    sub: "The deploy and a five-step test of the brake, 30 Sep 2026.",
    link: { label: "See the receipts", href: "/macroguard#trail", internal: true },
    icon: (
      <svg viewBox="0 0 24 24" className="h-10 w-10" {...ic}>
        <path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </svg>
    ),
  },
  {
    value: 30,
    suffix: "/30",
    label: "contract tests pass",
    sub: "Including random sequences from the bot and from strangers.",
    link: { label: "Read the tests", href: site.repo, internal: false },
    icon: (
      <svg viewBox="0 0 24 24" className="h-10 w-10" {...ic}>
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        <path d="M8.5 12l2.5 2.5 4.5-5" />
      </svg>
    ),
  },
  {
    value: 100,
    suffix: "%",
    label: "of the contract covered",
    sub: "Every line, branch and function. Source verified on Sourcify.",
    link: { label: "Open on Sourcify", href: site.sourcify, internal: false },
    icon: (
      <svg viewBox="0 0 24 24" className="h-10 w-10" {...ic}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16 16l4.5 4.5" />
        <path d="M8.5 11l1.8 1.8 3.2-3.6" />
      </svg>
    ),
  },
];

export function Proof() {
  const play = usePlay<HTMLDivElement>();
  const hashes = SMOKE_TEST.map((s) => s.tx).join("   ·   ");

  return (
    <section id="proof" className="relative scroll-mt-16 overflow-hidden px-4 py-28 sm:px-8 sm:py-40">
      <div ref={play} aria-hidden className="mo pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 select-none space-y-6 font-mono text-[22px] text-bone/[0.06]">
        <div className="mo-drift flex w-max whitespace-nowrap">
          <span className="pr-12">{hashes}</span>
          <span className="pr-12">{hashes}</span>
        </div>
        <div className="mo-drift-rev flex w-max whitespace-nowrap">
          <span className="pr-12">{hashes}</span>
          <span className="pr-12">{hashes}</span>
        </div>
        <div className="mo-drift flex w-max whitespace-nowrap">
          <span className="pr-12">{hashes}</span>
          <span className="pr-12">{hashes}</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px]">
        <Reveal as="h2" className="q-h2 max-w-[12ch] text-bone">
          Proof, not promises.
        </Reveal>

        <Reveal kind="stagger" className="mt-16 grid grid-cols-1 gap-4 sm:mt-24 md:grid-cols-3">
          {STATS.map((s) => (
            <article key={s.label} className="flex flex-col rounded-[28px] border border-[var(--line-strong)] bg-ink/80 p-8 backdrop-blur-sm sm:p-10">
              <span className="text-bone">{s.icon}</span>
              <p className="mt-10 font-semibold leading-none tracking-[-0.05em] text-bone tnum" style={{ fontSize: "clamp(64px, 7vw, 112px)" }}>
                <Count value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-4 text-[18px] font-medium text-bone">{s.label}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-mute">{s.sub}</p>
              <div className="mt-auto pt-8">
                {s.link.internal ? (
                  <Link href={s.link.href} className="text-[15px] text-bone">
                    <span className="u-draw pb-0.5">{s.link.label} →</span>
                  </Link>
                ) : (
                  <a href={s.link.href} target="_blank" rel="noopener noreferrer" className="text-[15px] text-bone">
                    <span className="u-draw pb-0.5">{s.link.label} ↗</span>
                  </a>
                )}
              </div>
            </article>
          ))}
        </Reveal>

        <Reveal className="mt-4 flex flex-col gap-4 rounded-[28px] border border-chain/40 bg-ink/80 p-8 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <p className="text-[18px] font-medium text-bone">The contract, in public</p>
            <p className="mt-2 font-mono text-[15px] text-chain-soft [overflow-wrap:anywhere]">{DEX_GUARD.address}</p>
          </div>
          <a href={addressUrl(DEX_GUARD.address)} target="_blank" rel="noopener noreferrer" className="pill shrink-0">
            Open on BscScan <span aria-hidden className="pill-arrow">↗</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
