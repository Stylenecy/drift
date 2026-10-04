"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navGroups, titleFor } from "./nav";

export function Topbar() {
  const pathname = usePathname();
  const title = titleFor(pathname);
  const items = navGroups.flatMap((g) => g.items);

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-ink/85 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="meta flex items-center gap-2">
          <span className="text-mute">DRIFT</span>
          <span className="text-mute">/</span>
          <span className="text-bone">{title}</span>
          <span className="ml-1 border border-warn/35 px-1.5 py-0.5 text-[10px] text-warn md:hidden">testnet</span>
        </div>

        <Link href="/" className="meta text-mute transition-colors hover:text-bone">
          <span className="u-draw pb-0.5">← Home</span>
        </Link>
      </div>

      {/* Mobile navigation — the sidebar is hidden below md */}
      <nav
        aria-label="Cockpit"
        className="flex gap-1 overflow-x-auto px-3 pb-2 [mask-image:linear-gradient(to_right,black_82%,transparent)] md:hidden"
      >
        {items.map((item) => {
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 border px-3 py-1 text-[12.5px] transition-colors ${
                active ? "border-bone/40 bg-bone/[0.08] text-bone" : "border-transparent text-mute hover:text-bone"
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
