import { MarketsView } from "@/features/trade/components/MarketsView";
import { PageHead } from "@/features/dashboard/components/primitives";

export default function MarketsPage() {
  return (
    <div className="space-y-8">
      <PageHead index="01" label="trade" title="Markets," accent="live from Bybit.">
        Live Bybit perpetuals. Pick a market, read the chart, and deploy a bot — all in one place.
      </PageHead>
      <MarketsView />
    </div>
  );
}
