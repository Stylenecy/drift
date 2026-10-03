import { Portfolio } from "@/features/trade/components/Portfolio";
import { PageHead } from "@/features/dashboard/components/primitives";

export default function PortfolioPage() {
  return (
    <div className="space-y-8">
      <PageHead index="03" label="trade" title="Portfolio," accent="at a glance.">
        Your account, running bots, open positions, and live P&amp;L at a glance.
      </PageHead>
      <Portfolio />
    </div>
  );
}
