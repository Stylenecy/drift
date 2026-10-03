import { ConnectionPanel } from "@/features/trade/components/ConnectionPanel";
import { PageHead } from "@/features/dashboard/components/primitives";

export default function ConnectionPage() {
  return (
    <div className="space-y-8">
      <PageHead index="06" label="account" title="Connection," accent="keys in memory only.">
        Connect a Bybit account to run live bots. Testnet is the default; keys stay in memory for this session only.
      </PageHead>
      <ConnectionPanel />
    </div>
  );
}
