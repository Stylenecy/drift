import Link from "next/link";
import { Container } from "./Container";
import { site } from "../site";
import { DEX_GUARD, addressUrl } from "@/features/guard/evidence";

const linkCls = "text-sm text-white/55 transition-colors hover:text-white";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-16">
      <Container className="flex flex-col gap-10 px-0 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-lg font-bold tracking-tight text-white">DRIFT</div>
          <p className="mt-2 max-w-xs text-sm text-white/55">{site.tagline}</p>
        </div>
        <div className="flex flex-wrap gap-12 sm:gap-16">
          <div>
            <h4 className="text-sm font-medium text-white">Product</h4>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/login" className={linkCls}>Cockpit</Link>
              </li>
              <li>
                <Link href="/#strategies" className={linkCls}>Strategies</Link>
              </li>
              <li>
                <Link href="/macroguard" className={linkCls}>MacroGuard</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">Verify</h4>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a href={addressUrl(DEX_GUARD.address)} target="_blank" rel="noopener noreferrer" className={linkCls}>
                  Contract on BscScan ↗
                </a>
              </li>
              <li>
                <a href={site.repo} target="_blank" rel="noopener noreferrer" className={linkCls}>
                  Source on GitHub ↗
                </a>
              </li>
              <li>
                <a href={`mailto:${site.contact}`} className={linkCls}>Contact</a>
              </li>
            </ul>
          </div>
        </div>
      </Container>
      <Container className="mt-12 px-0">
        <div className="space-y-1.5 border-t border-white/5 pt-6 text-xs leading-relaxed text-white/45">
          <p>
            DRIFT&apos;s core (engine, cockpit, MacroGuard contract) comes from the upstream DRIFT project, built for a
            Mantle hackathon track in June 2026 and migrated to BNB Chain in bcc-ukdw/seed-bnb. This fork, by Dex
            Bennett, adds the MacroGuard transparency layer and Dex&apos;s own BSC Testnet deployment.
          </p>
          <p>
            © {new Date().getFullYear()} DRIFT. Testnet only. Trading involves risk; backtested performance is not
            indicative of future results.
          </p>
        </div>
      </Container>
    </footer>
  );
}
