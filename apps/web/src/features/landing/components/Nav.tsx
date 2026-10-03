"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { site } from "../site";

// Top HUD bar. Transparent over the hero, a solid hairline bar once scrolled.
export default function Nav({ solid = false }: { solid?: boolean }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(solid);
  useEffect(() => {
    if (solid) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [solid]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-500 ${
        scrolled ? "border-[var(--line)] bg-ink/85 backdrop-blur-md" : "border-transparent bg-transparent"
      }`}
    >
      <div className="ld-fade mx-auto flex h-[60px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6" style={{ "--d": "0.1s" } as React.CSSProperties}>
        <div className="flex min-w-0 items-center gap-6 lg:gap-10">
          <Link href="/" className="flex items-center gap-2.5" aria-label="DRIFT home">
            <Image src="/drift-logo.png" alt="" width={26} height={26} className="object-contain" priority />
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-bone">DRIFT</span>
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
            {site.nav.map((l, i) => {
              const active = l.href === pathname;
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-baseline gap-1.5 text-[13px] transition-colors hover:text-bone ${active ? "text-bone" : "text-mute"}`}
                >
                  <span className="font-mono text-[10px] text-mute tnum">{String(i + 1).padStart(2, "0")}</span>
                  <span className="u-draw pb-0.5">{l.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden px-2 py-1.5 text-[13px] text-mute transition-colors hover:text-bone sm:inline-block"
          >
            <span className="u-draw pb-0.5">Open the cockpit</span>
          </Link>
          <Link
            href="/macroguard"
            className="inline-flex items-center gap-2 border border-chain/50 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-chain-soft transition-colors hover:bg-chain hover:text-ink"
          >
            <span aria-hidden className="h-1.5 w-1.5 bg-chain" />
            Live guard
          </Link>
        </div>
      </div>
    </header>
  );
}
