import Link from "next/link";
import { Reveal } from "@/features/motion/Motion";
import { DEX_GUARD, SMOKE_TEST, addressUrl } from "@/features/guard/evidence";
import { site } from "../site";

// Proof as four plain sentences, each one link away from its source. Facts only:
// 6 receipts from the 30 Sep 2026 test, the contract test suite, the Sourcify match,
// and the contract address itself (gold: it is checkable on BNB Chain).

const ROWS = [
  {
    claim: `${SMOKE_TEST.length} of ${SMOKE_TEST.length} public transactions succeeded.`,
    sub: "The deploy and a five-step test of the brake, 30 September 2026.",
    link: { label: "See the receipts", href: "/macroguard#trail", internal: true },
  },
  {
    claim: "30 of 30 contract tests pass.",
    sub: "Including random sequences from the bot and from strangers. Every line of the contract is covered.",
    link: { label: "Read the tests", href: site.repo, internal: false },
  },
  {
    claim: "The source code is verified.",
    sub: "What runs on BNB Chain is exactly the code anyone can read.",
    link: { label: "Open on Sourcify", href: site.sourcify, internal: false },
  },
];

export function Proof() {
  return (
    <section id="proof" className="cv-auto scroll-mt-16 px-4 py-28 sm:px-8 sm:py-40">
      <div className="mx-auto max-w-[1440px]">
        <Reveal as="h2" className="q-h2 max-w-[12ch] text-bone">
          Proof, not promises.
        </Reveal>

        <ul className="mt-16 border-t border-[var(--line-strong)] sm:mt-24">
          {ROWS.map((r) => (
            <Reveal as="li" key={r.claim} className="grid grid-cols-1 gap-4 border-b border-[var(--line-strong)] py-9 sm:grid-cols-12 sm:items-baseline sm:gap-8 sm:py-11">
              <p className="q-h3 text-bone sm:col-span-6">{r.claim}</p>
              <p className="max-w-[44ch] text-[16px] leading-relaxed text-mute sm:col-span-4">{r.sub}</p>
              <div className="sm:col-span-2 sm:text-right">
                {r.link.internal ? (
                  <Link href={r.link.href} className="text-[15px] text-bone">
                    <span className="u-draw pb-0.5">{r.link.label} →</span>
                  </Link>
                ) : (
                  <a href={r.link.href} target="_blank" rel="noopener noreferrer" className="text-[15px] text-bone">
                    <span className="u-draw pb-0.5">{r.link.label} ↗</span>
                  </a>
                )}
              </div>
            </Reveal>
          ))}
          <Reveal as="li" className="grid grid-cols-1 gap-4 border-b border-[var(--line-strong)] py-9 sm:grid-cols-12 sm:items-baseline sm:gap-8 sm:py-11">
            <p className="q-h3 text-bone sm:col-span-6">The contract, in public.</p>
            <p className="font-mono text-[14px] text-chain-soft [overflow-wrap:anywhere] sm:col-span-4">{DEX_GUARD.address}</p>
            <div className="sm:col-span-2 sm:text-right">
              <a href={addressUrl(DEX_GUARD.address)} target="_blank" rel="noopener noreferrer" className="text-[15px] text-chain-soft">
                <span className="u-draw pb-0.5">BscScan ↗</span>
              </a>
            </div>
          </Reveal>
        </ul>
      </div>
    </section>
  );
}
