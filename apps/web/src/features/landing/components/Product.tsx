"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/features/motion/Motion";
import { useScrollProgress, usePlay } from "../motion";

// The product, shown as itself: real screenshots of the live guard page in a
// browser frame that straightens as it scrolls in, with what it does floating around.

const CHIPS = [
  { text: "Reads BNB Chain from your browser", dot: "bg-ok", pos: "left-[-2%] top-[12%]" },
  { text: "No login, no wallet", dot: "bg-bone", pos: "right-[-3%] top-[38%]" },
  { text: "Every receipt opens on BscScan", dot: "bg-chain", pos: "left-[6%] bottom-[-5%]" },
];

export function Product() {
  const scene = useScrollProgress<HTMLDivElement>(undefined, "enter");
  const play = usePlay<HTMLDivElement>();

  return (
    <section className="relative overflow-hidden px-4 py-28 sm:px-8 sm:py-40">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <Reveal as="h2" className="q-h2 text-bone lg:col-span-7">
            The live guard.
          </Reveal>
          <div className="self-end lg:col-span-5">
            <Reveal className="q-lead max-w-[40ch] text-mute" delay={0.1}>
              One page shows what the bot may do right now, straight from the contract. Open it on any phone.
            </Reveal>
            <Reveal className="mt-8" delay={0.2}>
              <Link href="/macroguard" className="pill">
                Check the live bot <span aria-hidden className="pill-arrow">→</span>
              </Link>
            </Reveal>
          </div>
        </div>

        <div ref={play} className="mo relative mx-auto mt-16 max-w-[1180px] sm:mt-24">
          <div ref={scene} className="sc-product">
            <div className="overflow-hidden rounded-[20px] border border-[var(--line-strong)] bg-slate-1">
              <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-slate-2" />
                <span className="h-3 w-3 rounded-full bg-slate-2" />
                <span className="h-3 w-3 rounded-full bg-slate-2" />
                <span className="ml-4 truncate rounded-full bg-ink px-4 py-1 font-mono text-[12px] text-mute">
                  drift-macroguard.vercel.app/macroguard
                </span>
              </div>
              <Image
                src="/landing/guard.webp"
                alt="The DRIFT live guard page: the bot is running, the market mood is neutral, the 20% limit and the contract address."
                width={1440}
                height={900}
                sizes="(min-width: 1180px) 1180px, 100vw"
                className="block h-auto w-full"
              />
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-[-10%] right-[-2%] hidden w-[46%] overflow-hidden rounded-[18px] border border-veto/50 bg-slate-1 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] md:block">
            <Image
              src="/landing/ask.webp"
              alt="Ask the contract: a sell at a 25% loss is blocked by the live contract."
              width={1600}
              height={730}
              sizes="560px"
              className="block h-auto w-full"
            />
          </div>

          {CHIPS.map((c, i) => (
            <span
              key={c.text}
              className={`mo-bob absolute hidden items-center gap-2 rounded-full border border-[var(--line-strong)] bg-ink/90 px-4 py-2.5 text-[14px] text-bone backdrop-blur md:inline-flex ${c.pos}`}
              style={{ "--i": i } as CSSProperties}
            >
              <span aria-hidden className={`h-2 w-2 rounded-full ${c.dot}`} />
              {c.text}
            </span>
          ))}
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-3 text-[15px] text-bone md:hidden">
          {CHIPS.map((c) => (
            <li key={c.text} className="flex items-center gap-3">
              <span aria-hidden className={`h-2 w-2 rounded-full ${c.dot}`} />
              {c.text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
