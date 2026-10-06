"use client";

import { useEffect, useRef } from "react";
import { Reveal } from "@/features/motion/Motion";
import { motionOn, observe } from "@/features/motion/runtime";

// How it works, as five numbered rows on the light block. The row in the middle of
// the screen is lit; the others rest at 40%. Without motion every row is lit.

const STEPS = [
  { title: "The bot suggests a trade.", body: "DRIFT's engine reads the market and proposes: buy, sell, or stay out.", chain: false },
  { title: "The contract says yes or no.", body: "A public contract on BNB Chain checks the market mood and the 20% loss limit. Anyone can ask it the same question.", chain: true },
  { title: "Only allowed trades happen.", body: "If the answer is no, the bot stays out. Trading runs on an exchange testnet: no real money moves.", chain: false },
  { title: "Every decision becomes a receipt.", body: "The decision and the loss at that moment are written to BNB Chain, where anyone can open them on BscScan.", chain: true },
  { title: "An AI analyst explains. It never trades.", body: "Ask why the bot is cautious today and get a plain answer. The rules decide; the AI only explains.", chain: false },
];

export function HowItWorks() {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = ref.current;
    if (!list || !motionOn()) return;
    list.setAttribute("data-tracking", "");
    const rows = Array.from(list.children) as HTMLElement[];
    const stops = rows.map((row) =>
      observe(
        row,
        (e) => {
          if (e.isIntersecting) {
            rows.forEach((r) => r.removeAttribute("data-active"));
            row.setAttribute("data-active", "");
          }
        },
        "-45% 0px -45% 0px",
      ),
    );
    rows[0]?.setAttribute("data-active", "");
    return () => stops.forEach((stop) => stop());
  }, []);

  return (
    <section id="how" className="cv-auto scroll-mt-16 bg-paper px-4 py-28 text-ink sm:px-8 sm:py-40">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <Reveal as="h2" className="q-h2 lg:col-span-8">
            How it works
          </Reveal>
          <Reveal className="q-lead max-w-[36ch] self-end text-paper-mute lg:col-span-4" delay={0.1}>
            Every trade asks permission first. Two of the five steps happen in public, on BNB Chain.
          </Reveal>
        </div>

        <ol ref={ref} className="q-rows mt-16 border-t border-ink/15 sm:mt-24">
          {STEPS.map((s, i) => (
            <li key={s.title} className="q-row grid grid-cols-[3rem_1fr] gap-x-4 gap-y-3 border-b border-ink/15 py-8 sm:grid-cols-12 sm:gap-x-8 sm:py-10">
              <span className="font-mono text-[14px] text-paper-mute tnum sm:col-span-1 sm:pt-2">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="q-h3 sm:col-span-6">{s.title}</h3>
              <div className="col-start-2 sm:col-span-5 sm:col-start-auto">
                <p className="max-w-[46ch] text-[16px] leading-relaxed text-paper-mute sm:text-[17px]">{s.body}</p>
                {s.chain && (
                  <p className="mt-3 flex items-center gap-2 text-[13px] font-medium text-ink">
                    <span aria-hidden className="h-2 w-2 rounded-full bg-chain" />
                    On BNB Chain
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
