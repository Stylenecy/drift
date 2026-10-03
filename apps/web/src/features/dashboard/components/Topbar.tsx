"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navGroups, titleFor } from "./nav";

export function Topbar() {
  const pathname = usePathname();
  const title = titleFor(pathname);
  const items = navGroups.flatMap((g) => g.items);

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0c0f]/80 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/50">DRIFT</span>
          <span className="text-white/25">/</span>
          <span className="font-medium text-white">{title}</span>
          <span className="ml-1 rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-amber-300 md:hidden">
            testnet
          </span>
        </div>

        <Link
          href="/"
          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12.5px] text-white/60 transition hover:border-white/20 hover:text-white"
        >
          ← Home
        </Link>
      </div>

      {/* Mobile navigation — the sidebar is hidden below md */}
      <nav aria-label="Cockpit" className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
        {items.map((item) => {
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full px-3 py-1 text-[12.5px] transition ${
                active ? "bg-white/[0.1] text-white" : "text-white/55 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
