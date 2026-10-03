"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navGroups } from "./nav";
import { ProfileMenu } from "./ProfileMenu";

// Position of each route in the cockpit, shown as a mono index (01–06).
const INDEX = new Map(navGroups.flatMap((g) => g.items).map((it, i) => [it.href, String(i + 1).padStart(2, "0")]));

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-[var(--line)] bg-ink md:flex">
      {/* brand → back to landing */}
      <div className="flex h-14 items-center justify-between gap-2.5 border-b border-[var(--line)] px-5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="DRIFT home">
          <Image src="/drift-logo.png" alt="" width={24} height={24} className="object-contain" />
          <span className="text-[14px] font-semibold tracking-[-0.02em] text-bone">DRIFT</span>
        </Link>
        <span className="meta border border-warn/35 px-1.5 py-0.5 text-[10px] text-warn">testnet</span>
      </div>

      {/* nav groups */}
      <nav aria-label="Cockpit" className="flex-1 overflow-y-auto px-3 py-5">
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-6" : ""}>
            {group.title && <div className="bracket px-2 pb-2">({group.title.toLowerCase()})</div>}
            <ul>
              {group.items.map((item) => {
                const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
                const Icon = item.icon;
                const index = INDEX.get(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex items-center gap-3 px-3 py-2 text-[13.5px] transition-colors ${
                        active ? "bg-bone/[0.06] text-bone" : "text-mute hover:bg-bone/[0.03] hover:text-bone"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`absolute inset-y-1 left-0 w-px origin-top transition-transform duration-500 ${
                          active ? "scale-y-100 bg-engine" : "scale-y-0 bg-bone/40"
                        }`}
                      />
                      <Icon className={active ? "text-engine" : "text-mute"} width={17} height={17} />
                      <span className="flex-1">{item.label}</span>
                      <span className="font-mono text-[10px] text-mute tnum">{index}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <ProfileMenu />
    </aside>
  );
}
