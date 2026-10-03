import type { Metadata } from "next";
import Nav from "@/features/landing/components/Nav";
import Footer from "@/features/landing/components/Footer";
import { Container } from "@/features/landing/components/Container";
import { GuardPanel } from "@/features/guard/components/GuardPanel";

const TITLE = "MacroGuard — DRIFT's public risk gate on BNB Chain";
const DESCRIPTION =
  "Read DRIFT's MacroGuard contract on BSC Testnet: regime, drawdown halt, allowed signals and verified decision receipts. Ask the live contract a what-if (eth_call, nothing signed). No login, no wallet.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { type: "website", url: "/macroguard", siteName: "DRIFT", title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

// Public, login-free view of the same panel the cockpit shows — for judges and auditors.
export default function PublicMacroGuardPage() {
  return (
    <div className="min-h-screen bg-[#0b0c0f] text-white">
      <Nav solid />
      <main className="pb-16 pt-[92px]">
        <Container>
          <GuardPanel />
        </Container>
      </main>
      <Footer />
    </div>
  );
}
