import Link from "next/link";
import { Reveal } from "@/features/motion/Motion";

// One invitation, centred: try the live contract yourself.
export function Ask() {
  return (
    <section className="cv-auto border-t border-[var(--line)] px-4 py-28 text-center sm:px-8 sm:py-40">
      <div className="mx-auto flex max-w-[1000px] flex-col items-center">
        <Reveal as="h2" className="q-h2 text-bone">
          Ask it yourself.
        </Reveal>
        <Reveal className="q-lead mt-8 max-w-[44ch] text-mute" delay={0.1}>
          Pick a trade and a loss. The live contract tells you whether it would allow it. Nothing is signed, nothing is sent,
          nothing costs a cent.
        </Reveal>
        <Reveal className="mt-12" delay={0.2}>
          <Link href="/macroguard#ask" className="pill">
            Ask the contract <span aria-hidden className="pill-arrow">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
