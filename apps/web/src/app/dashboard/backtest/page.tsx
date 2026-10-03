import { Research } from "@/features/trade/components/Research";

export default function BacktestPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Research</h1>
        <p className="mt-1 text-sm text-white/65">
          Let DRIFT find the best honest config for a market — optimised on past
          data, proven on data it never saw — then deploy it in one click.
        </p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/65">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#9aa8f0]" />
          Historical simulation on public Bybit data · research, not a profit claim
        </p>
      </div>
      <Research />
    </div>
  );
}
