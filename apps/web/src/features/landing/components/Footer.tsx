import Link from "next/link";
import Image from "next/image";
import { site } from "../site";
import { DEX_GUARD, addressUrl } from "@/features/guard/evidence";

// Closing statement, one call to action, three short link columns and one legal line.

const cols = [
  {
    title: "Product",
    links: [
      { label: "Live guard", href: "/macroguard", internal: true },
      { label: "Ask the contract", href: "/macroguard#ask", internal: true },
      { label: "Cockpit (runs on your machine)", href: "/login", internal: true },
      { label: "Blog", href: "/blog", internal: true },
    ],
  },
  {
    title: "Verify",
    links: [
      { label: "Contract on BscScan", href: addressUrl(DEX_GUARD.address) },
      { label: "Source on Sourcify", href: site.sourcify },
      { label: "Code on GitHub", href: site.repo },
    ],
  },
  {
    title: "Contact",
    links: [{ label: "Email", href: `mailto:${site.contact}` }],
  },
];

export default function Footer() {
  return (
    <footer className="cv-auto border-t border-[var(--line)] px-4 pb-10 pt-28 sm:px-8 sm:pt-40">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-end lg:justify-between">
          <p className="q-h2 max-w-[14ch] text-bone">Don&apos;t take the bot&apos;s word for it.</p>
          <Link href="/macroguard" className="pill shrink-0">
            Check the live bot <span aria-hidden className="pill-arrow">→</span>
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-2 gap-10 border-t border-[var(--line)] pt-12 sm:mt-32 md:grid-cols-12">
          <div className="col-span-2 md:col-span-5">
            <Link href="/" className="flex items-center gap-2.5" aria-label="DRIFT home">
              <Image src="/drift-logo.png" alt="" width={24} height={24} className="object-contain" />
              <span className="text-[15px] font-medium text-bone">DRIFT</span>
            </Link>
            <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-mute">{site.tagline}</p>
          </div>
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title} className="md:col-span-2">
              <h2 className="text-[13px] text-mute">{c.title}</h2>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {"internal" in l && l.internal ? (
                      <Link href={l.href} className="q-nav text-[15px]">
                        {l.label}
                      </Link>
                    ) : (
                      <a
                        href={l.href}
                        {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="q-nav text-[15px]"
                      >
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-16 border-t border-[var(--line)] pt-6 text-[13px] leading-relaxed text-mute">
          © {new Date().getFullYear()} DRIFT · Testnet only · Not financial advice. Trading involves risk; backtested results do
          not predict future results.
        </p>
      </div>
    </footer>
  );
}
