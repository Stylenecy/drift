"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { site } from "../site";

// Quiet top bar: logo, four plain links, one call to action. Transparent over the
// hero, a solid hairline bar once scrolled.
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
      <div className="ld-fade mx-auto grid h-[68px] w-full max-w-[1440px] grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-8 md:grid-cols-[1fr_auto_1fr]" style={{ "--d": "0.1s" } as React.CSSProperties}>
        <Link href="/" className="flex items-center gap-2.5 justify-self-start" aria-label="DRIFT home">
          <Image src="/drift-logo.png" alt="" width={24} height={24} className="object-contain" priority />
          <span className="text-[15px] font-medium tracking-[-0.01em] text-bone">DRIFT</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {site.nav.map((l) => (
            <Link key={l.label} href={l.href} aria-current={l.href === pathname ? "page" : undefined} className="q-nav text-[14px]">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="justify-self-end">
          <Link href="/macroguard" className="pill px-5 py-2.5 text-[14px]">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-chain" />
            Live guard
          </Link>
        </div>
      </div>
    </header>
  );
}
