import type { CSSProperties } from "react";
import Link from "next/link";
import { Lines } from "@/features/motion/Lines";
import { DEX_GUARD } from "@/features/guard/evidence";
import { LiveStatus } from "./LiveStatus";
import { HeroDial } from "./HeroDial";

// Hero: one promise and the instrument that proves it. The dial plays how the brake
// works; the line underneath is the contract's state right now, read live.

const LIMIT = DEX_GUARD.maxDrawdownBps / 100;

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-4 pb-8 pt-[92px] sm:px-8 sm:pb-10">
      <div className="mx-auto grid min-h-[calc(100svh-210px)] w-full max-w-[1440px] grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-4">
        <div className="order-2 lg:order-1 lg:col-span-6">
          <Lines
            as="h1"
            mode="settle"
            delay={0.05}
            label="Risk rules you can check."
            className="q-h1 max-w-[11ch] text-bone"
            lines={["Risk rules", "you can", <span key="c" className="text-chain">check.</span>]}
          />
          <p className="q-lead ld-settle-up mt-8 max-w-[38ch] text-mute" style={{ "--d": "0.35s" } as CSSProperties}>
            DRIFT is a trading bot with a public referee. If a recorded loss reaches {LIMIT}%, a contract on BNB Chain halts
            the bot by itself. Restarting it takes the owner&apos;s key, in public.
          </p>
          <div className="ld-up mt-10 flex flex-wrap items-center gap-x-7 gap-y-4" style={{ "--d": "0.7s" } as CSSProperties}>
            <Link href="/macroguard" className="pill">
              Check the live brake <span aria-hidden className="pill-arrow">→</span>
            </Link>
            <Link href="/#try" className="text-[15px] text-bone">
              <span className="u-draw pb-0.5">Try the brake yourself</span>
            </Link>
          </div>
        </div>
        <div className="ld-fade order-1 lg:order-2 lg:col-span-6" style={{ "--d": "0.3s" } as CSSProperties}>
          <HeroDial />
        </div>
      </div>
      <div className="ld-fade mx-auto mt-10 w-full max-w-[1440px]" style={{ "--d": "0.9s" } as CSSProperties}>
        <LiveStatus />
      </div>
    </section>
  );
}
