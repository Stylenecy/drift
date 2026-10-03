import Link from "next/link";
import { Reveal } from "@/features/motion/Motion";
import { site } from "../site";
import { DEX_GUARD, addressUrl, short } from "@/features/guard/evidence";

// End card: wordmark, serif-italic tagline, one line of mono metadata, links,
// and the provenance note. The same end card closes the DRIFT videos.

const BUILD = process.env.NEXT_PUBLIC_BUILD_SHA ?? "local";

const cols = [
  {
    title: "Check",
    links: [
      { label: "Live guard", href: "/macroguard", internal: true },
      { label: "Contract on BscScan ↗", href: addressUrl(DEX_GUARD.address) },
      { label: "Source on Sourcify ↗", href: site.sourcify },
    ],
  },
  {
    title: "Build",
    links: [
      { label: "Cockpit (local engine)", href: "/login", internal: true },
      { label: "Source on GitHub ↗", href: site.repo },
      { label: "Contact", href: `mailto:${site.contact}` },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--line)] px-4 pb-10 pt-20 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <p className="serif-i text-[30px] leading-[1.1] text-bone sm:text-[40px]">Don&apos;t take the bot&apos;s word for it.</p>
            <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed text-mute">{site.tagline}</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 lg:col-span-4 lg:col-start-9">
            {cols.map((c) => (
              <div key={c.title}>
                <h2 className="meta text-mute">({c.title.toLowerCase()})</h2>
                <ul className="mt-4 space-y-3">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      {l.internal ? (
                        <Link href={l.href} className="text-[14px] text-bone">
                          <span className="u-draw pb-0.5">{l.label}</span>
                        </Link>
                      ) : (
                        <a
                          href={l.href}
                          {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          className="text-[14px] text-bone"
                        >
                          <span className="u-draw pb-0.5">{l.label}</span>
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <Reveal kind="clip" className="mt-20 sm:mt-28">
          <div
            aria-hidden
            className="select-none font-semibold leading-[0.8] tracking-[-0.06em] text-bone"
            style={{ fontSize: "clamp(96px, 27vw, 420px)" }}
          >
            DRIFT
          </div>
        </Reveal>

        <div className="mt-8 flex flex-col gap-3 border-t border-[var(--line)] pt-5 lg:flex-row lg:items-center lg:justify-between">
          <p className="meta text-mute [overflow-wrap:anywhere]">
            <span className="text-chain">MacroGuard {short(DEX_GUARD.address, 6, 4)}</span> · chain {DEX_GUARD.chainId} · Sourcify
            exact match · build {BUILD.slice(0, 7)}
          </p>
          <p className="meta text-mute">drift-macroguard.vercel.app</p>
        </div>

        <div className="mt-8 space-y-2 text-[12.5px] leading-relaxed text-mute">
          <p className="max-w-[110ch]">
            DRIFT&apos;s core (engine, cockpit, MacroGuard contract) comes from the upstream DRIFT project, built for a Mantle
            hackathon track in June 2026 and migrated to BNB Chain in bcc-ukdw/seed-bnb. This fork, by Dex Bennett, adds the
            MacroGuard transparency layer and Dex&apos;s own BSC Testnet deployment.
          </p>
          <p>
            © {new Date().getFullYear()} DRIFT. Testnet only. Trading involves risk; backtested performance is not indicative of
            future results.
          </p>
        </div>
      </div>
    </footer>
  );
}
