"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Container } from "./Container";
import { site } from "../site";

export default function Nav({ solid = false }: { solid?: boolean }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(solid);
  useEffect(() => {
    if (solid) return;
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [solid]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-white/10 bg-black/75 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <Container className="flex h-[60px] items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center" aria-label="DRIFT home">
            <Image src="/drift-logo.png" alt="DRIFT" width={32} height={32} className="object-contain" />
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {site.nav.map((l) => {
              const active = l.href === pathname;
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`text-[13px] transition-colors hover:text-white ${active ? "text-white" : "text-white/60"}`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/macroguard"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#f0b90b]/40 px-3.5 py-1.5 text-[13px] text-[#f8d36a] transition-colors hover:bg-[#f0b90b]/10 md:hidden"
          >
            Live proof
          </Link>
          <a
            href={`mailto:${site.contact}`}
            className="hidden rounded-full border border-white/25 px-4 py-1.5 text-[13px] text-white transition-colors hover:bg-white/10 sm:inline-block"
          >
            Contact
          </a>
          <Link
            href="/login"
            className="rounded-full bg-[#9aa8f0] px-4 py-1.5 text-[13px] font-medium text-[#14152b] transition hover:bg-[#aeb9f4]"
          >
            Open cockpit
          </Link>
        </div>
      </Container>
    </header>
  );
}
