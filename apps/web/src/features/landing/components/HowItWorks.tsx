"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/features/motion/Motion";
import { motionOn, observe } from "@/features/motion/runtime";
import { StepArt } from "./StepArt";

// How it works on the light block: five numbered rows; the row in the middle of the
// screen is lit and its artwork plays in the sticky panel (desktop) or inline (phone).

const STEPS = [
  { title: "The bot suggests a trade.", body: "DRIFT's engine reads the market and proposes: buy, sell, or stay out.", chain: false },
  { title: "The contract says yes or no.", body: "A public contract on BNB Chain checks the market mood and the 20% loss limit. Anyone can ask it the same question.", chain: true },
  { title: "Only allowed trades happen.", body: "If the answer is no, the bot stays out. Trading runs on an exchange testnet: no real money moves.", chain: false },
  { title: "Every decision becomes a receipt.", body: "The decision and the loss at that moment are written to BNB Chain, where anyone can open them.", chain: true },
  { title: "An AI analyst explains. It never trades.", body: "Ask why the bot stayed out and get a plain answer. The rules decide; the AI only explains.", chain: false },
];

export function HowItWorks() {
  const ref = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const list = ref.current;
    if (!list || !motionOn()) return;
    list.setAttribute("data-tracking", "");
    const rows = Array.from(list.children) as HTMLElement[];
    const stops = rows.map((row, i) =>
      observe(
        row,
        (e) => {
          if (!e.isIntersecting) return;
          rows.forEach((r) => r.removeAttribute("data-active"));
          row.setAttribute("data-active", "");
          setActive(i);
        },
        "-45% 0px -45% 0px",
      ),
    );
    rows[0]?.setAttribute("data-active", "");
    return () => stops.forEach((stop) => stop());
  }, []);

  return (
    <section id="how" className="scroll-mt-16 bg-paper px-4 py-28 text-ink sm:px-8 sm:py-40">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <Reveal as="h2" className="q-h2 lg:col-span-8">
            How it works
          </Reveal>
          <Reveal className="q-lead max-w-[36ch] self-end text-paper-mute lg:col-span-4" delay={0.1}>
            Every trade asks permission first. Two of the five steps happen in public, on BNB Chain.
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 sm:mt-24 lg:grid-cols-12">
          <ol ref={ref} className="q-rows border-t border-ink/15 lg:col-span-7">
            {STEPS.map((s, i) => (
              <li key={s.title} className="q-row border-b border-ink/15 py-8 sm:py-10">
                <div className="grid grid-cols-[3rem_1fr] gap-x-4 gap-y-3">
                  <span className="font-mono text-[14px] text-paper-mute tnum sm:pt-1.5">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="q-h3">{s.title}</h3>
                    <p className="mt-3 max-w-[46ch] text-[16px] leading-relaxed text-paper-mute sm:text-[17px]">{s.body}</p>
                    {s.chain && (
                      <p className="mt-3 flex items-center gap-2 text-[13px] font-medium text-ink">
                        <span aria-hidden className="h-2 w-2 rounded-full bg-chain" />
                        On BNB Chain
                      </p>
                    )}
                    <div className="mt-6 aspect-[16/11] max-w-[420px] rounded-3xl bg-ink p-6 lg:hidden">
                      <StepArt index={i} className="h-full w-full" />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-[18vh] aspect-[16/12] rounded-[32px] bg-ink p-10">
              <p className="text-[13px] uppercase tracking-[0.16em] text-mute">
                Step {String(active + 1).padStart(2, "0")} / 05
              </p>
              <StepArt index={active} className="mt-4 h-[calc(100%-2rem)] w-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
