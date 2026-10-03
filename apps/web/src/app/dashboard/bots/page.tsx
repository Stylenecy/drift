import { LiveBots } from "@/features/trade/components/LiveBots";
import { PageHead } from "@/features/dashboard/components/primitives";

export default function BotsPage() {
  return (
    <div className="space-y-8">
      <PageHead index="02" label="trade" title="Bots," accent="on Bybit testnet.">
        Your live bots on Bybit testnet — chart with entries, equity, P&amp;L, and the drawdown stop, streaming in real time.
      </PageHead>
      <LiveBots />
    </div>
  );
}
