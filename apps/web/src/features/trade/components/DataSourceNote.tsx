// Names where the engine's market data came from. When Bybit is unreachable the
// engine falls back to Binance public market data; that is labelled, never silent.
export function DataSourceNote({ source }: { source?: string | null }) {
  if (source === "binance") {
    return (
      <p className=" border border-warn/25 bg-warn/10 px-3 py-2 text-[12px] leading-relaxed text-warn">
        <span aria-hidden>⚠ </span>Data: Binance public market data (fallback, Bybit was unreachable). Spot candles, so
        prices differ slightly from Bybit perpetuals. Orders still go to Bybit testnet.
      </p>
    );
  }
  if (source === "bybit") {
    return <p className="text-[11px] text-bone/70">Data: Bybit V5 public market data.</p>;
  }
  return null;
}
