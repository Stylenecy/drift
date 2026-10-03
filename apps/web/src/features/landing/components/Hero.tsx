"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Container } from "./Container";
import { useReducedMotion } from "@/hooks/useScrollReveal";
import { DEX_GUARD, SMOKE_TEST, addressUrl, short } from "@/features/guard/evidence";
import { readGuardFromChain } from "@/features/guard/chainRead";

const springConfig = { stiffness: 60, damping: 22, mass: 0.6 };

const proof = [
  { k: "contract", v: short(DEX_GUARD.address, 6, 4), href: addressUrl(DEX_GUARD.address) },
  { k: "halt line", v: `${DEX_GUARD.maxDrawdownBps / 100}% · ${DEX_GUARD.maxDrawdownBps} bps` },
  { k: "receipts", v: `${SMOKE_TEST.length} · status 1` },
  { k: "contract tests", v: "30/30 passing" },
];

function Content() {
  // The live dot only appears after this page load read the contract from the chain.
  const [liveBlock, setLiveBlock] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    readGuardFromChain({ signal: controller.signal })
      .then((read) => setLiveBlock(read.block))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <div className="flex flex-col items-center text-center">
      <span
        className="mb-6 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[#f0b90b]/35 bg-black/40 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[#f8d36a] backdrop-blur-sm sm:tracking-[0.18em]"
        title={liveBlock ? `Contract read live from BSC Testnet at block ${liveBlock}` : undefined}
      >
        {liveBlock && <span aria-hidden className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />}
        {liveBlock ? "Live read · BSC Testnet · chain 97" : "Deployed on BSC Testnet · chain 97"}
      </span>

      <h1 className="max-w-4xl text-[40px] font-bold leading-[1.05] tracking-tight text-white sm:text-[64px]">
        A trading bot whose risk rules{" "}
        <span className="bg-gradient-to-r from-[#f8d36a] to-[#f0b90b] bg-clip-text text-transparent">you can verify.</span>
      </h1>

      <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75 sm:text-xl">
        Quant research runs off-chain. The risk gate lives in a public BNB Chain contract — read it yourself.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/macroguard"
          className="rounded-full bg-[#f0b90b] px-5 py-2.5 text-sm font-semibold text-[#1a1405] transition hover:bg-[#f8d36a]"
        >
          Inspect the live guard →
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm text-white/90 backdrop-blur-sm transition hover:border-white/40"
        >
          Open cockpit
        </Link>
      </div>
    </div>
  );
}

// Static, dated evidence. Kept out of the scroll-driven motion so data never moves with the page.
function ProofStrip() {
  return (
    <div className="flex justify-center">
      <dl className="grid w-full max-w-2xl grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-black/45 backdrop-blur-md sm:grid-cols-4">
        {proof.map((p, i) => (
          <div key={p.k} className={`px-4 py-3 text-left ${i > 0 ? "sm:border-l" : ""} ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t sm:border-t-0" : ""} border-white/10`}>
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">{p.k}</dt>
            <dd className="mt-0.5 font-mono text-[13px] text-white">
              {p.href ? (
                <a href={p.href} target="_blank" rel="noopener noreferrer" className="text-[#f8d36a] underline-offset-2 hover:underline">
                  {p.v} ↗
                </a>
              ) : (
                p.v
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  const contentY = useSpring(useTransform(scrollYProgress, [0, 0.7], [0, -100]), springConfig);
  const contentScale = useSpring(useTransform(scrollYProgress, [0, 0.7], [1, 0.95]), springConfig);
  const contentOpacity = useSpring(useTransform(scrollYProgress, [0, 0.6], [1, 0]), springConfig);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.02, 1.15]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [0.4, 0.85]);
  const arrowOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  if (reduced) {
    return (
      <section className="relative flex h-screen items-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/hero-stars.jpg)" }} />
        <div className="absolute inset-0 bg-black/50" />
        <Container className="relative">
          <Content />
          <div className="mt-10">
            <ProofStrip />
          </div>
        </Container>
      </section>
    );
  }

  return (
    <div ref={heroRef} className="relative h-[200vh]">
      <section className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/hero-stars.jpg)", scale: bgScale }}
        />
        <motion.div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />

        <div className="relative w-full">
          <motion.div style={{ y: contentY, scale: contentScale, opacity: contentOpacity }}>
            <Container>
              <Content />
            </Container>
          </motion.div>
          <motion.div style={{ opacity: contentOpacity }} className="mt-10">
            <Container>
              <ProofStrip />
            </Container>
          </motion.div>
        </div>

        <motion.div
          style={{ opacity: arrowOpacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 animate-bounce">
            <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </section>
    </div>
  );
}
