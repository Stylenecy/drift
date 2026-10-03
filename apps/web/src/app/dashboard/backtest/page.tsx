import { Research } from "@/features/trade/components/Research";
import { PageHead } from "@/features/dashboard/components/primitives";

export default function BacktestPage() {
  return (
    <div className="space-y-8">
      <PageHead index="04" label="research" title="Research," accent="scored on unseen data.">
        <p>
          Let DRIFT find the best honest config for a market — optimised on past data, proven on data it never saw — then
          deploy it in one click.
        </p>
        <p className="meta mt-4 inline-flex items-center gap-2 border border-[var(--line-strong)] px-3 py-1.5 text-mute">
          <span aria-hidden className="h-1.5 w-1.5 bg-engine" />
          Historical simulation on public market data (Bybit, or Binance when labelled) · research, not a profit claim
        </p>
      </PageHead>
      <Research />
    </div>
  );
}
