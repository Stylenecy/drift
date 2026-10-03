"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchKlines,
  fetchMarkets,
  fetchStrategies,
  getConnection,
  startBot,
} from "../api";
import type { Candle, Market, StrategyInfo } from "../types";
import { Card, Button, Badge } from "@/features/dashboard/components/primitives";
import { CandleChart } from "./CandleChart";

const TIMEFRAMES = ["15m", "1h", "4h", "1d"];

const fmt = (v: number) =>
  v >= 1000 ? v.toLocaleString("en-US", { maximumFractionDigits: 0 }) : v >= 1 ? v.toFixed(2) : v.toPrecision(4);

export function MarketsView() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // live market prices (poll)
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetchMarkets()
        .then((m) => alive && setMarkets(m))
        .catch((e) => alive && setError(e.message));
    load();
    const id = setInterval(load, 10_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // candles for the selected symbol/timeframe
  useEffect(() => {
    const ac = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- existing upstream behaviour, kept unchanged
    setLoadingChart(true);
    fetchKlines(symbol, timeframe, 160, ac.signal)
      .then((r) => setCandles(r.candles))
      .catch(() => {})
      .finally(() => setLoadingChart(false));
    return () => ac.abort();
  }, [symbol, timeframe]);

  const active = markets.find((m) => m.symbol === symbol);

  if (error && markets.length === 0) {
    return (
      <Card title="Engine offline">
        <p className="py-4 text-sm text-mute">
          Could not reach the DRIFT engine. Start it on{" "}
          <span className="font-mono text-bone/85">:8099</span> and reload.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* market list */}
      <Card
        title="Markets"
        subtitle={markets[0]?.source === "binance" ? "Binance spot · public-data fallback" : "Live · Bybit perpetuals"}
        bodyClassName="!p-1.5"
      >
        <ul className="space-y-0.5">
          {markets.length === 0 && (
            <li className="px-2 py-6 text-center text-sm text-mute">Loading…</li>
          )}
          {markets.map((m) => {
            const up = m.change24h >= 0;
            return (
              <li key={m.symbol}>
                <button
                  onClick={() => setSymbol(m.symbol)}
                  className={`flex w-full items-center justify-between px-2.5 py-2 text-left transition ${
                    m.symbol === symbol ? "bg-bone/[0.07]" : "hover:bg-bone/[0.04]"
                  }`}
                >
                  <span className="font-mono text-[13px] text-bone">
                    {m.symbol.replace("USDT", "")}
                    <span className="text-mute">/USDT</span>
                  </span>
                  <span className="text-right">
                    <span className="block font-mono text-[12px] tabular-nums text-bone/85">{fmt(m.last)}</span>
                    <span className={`block font-mono text-[10px] tabular-nums ${up ? "text-ok" : "text-veto-soft"}`}>
                      {up ? "+" : ""}{(m.change24h * 100).toFixed(2)}%
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* chart + deploy */}
      <div className="space-y-4">
        <Card
          title={
            <span className="flex items-center gap-2">
              <span className="font-mono">{symbol}</span>
              {active && (
                <Badge tone={active.change24h >= 0 ? "green" : "rose"}>
                  {active.change24h >= 0 ? "+" : ""}{(active.change24h * 100).toFixed(2)}% · 24h
                </Badge>
              )}
            </span>
          }
          subtitle={active ? `Last ${fmt(active.last)} · H ${fmt(active.high24h)} · L ${fmt(active.low24h)}` : undefined}
          action={
            <div className="flex gap-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={` px-2 py-1 font-mono text-[11px] transition ${
                    tf === timeframe ? "bg-engine text-ink" : "text-mute hover:bg-bone/[0.06] hover:text-bone"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          }
        >
          <div className={loadingChart ? "opacity-50 transition" : "transition"}>
            <CandleChart candles={candles} height={340} />
          </div>
        </Card>

        <DeployPanel symbol={symbol} timeframe={timeframe} />
      </div>
    </div>
  );
}

function DeployPanel({ symbol, timeframe }: { symbol: string; timeframe: string }) {
  const [strategies, setStrategies] = useState<StrategyInfo[]>([]);
  const [strategy, setStrategy] = useState("");
  const [qty, setQty] = useState(0.001);
  const [maxDd, setMaxDd] = useState(0.2);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [deployed, setDeployed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetchStrategies(ac.signal).then((s) => {
      setStrategies(s);
      if (s.length) setStrategy(s[0].id);
    }).catch(() => {});
    getConnection(ac.signal).then((c) => setConnected(c.connected)).catch(() => setConnected(false));
    return () => ac.abort();
  }, []);

  const selected = strategies.find((s) => s.id === strategy);

  const deploy = async () => {
    if (!selected) return;
    setError(null);
    setDeployed(null);
    try {
      const params = Object.fromEntries(selected.params.map((p) => [p.key, p.default]));
      const bot = await startBot({ strategy, symbol, timeframe, params, qty, max_drawdown: maxDd });
      setDeployed(bot.id);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Card title="Deploy a bot here" subtitle={`${symbol} · ${timeframe} · Bybit testnet`}>
      {connected === false && (
        <div className="mb-3 border border-warn/25 bg-warn/10 px-3 py-2 text-[12px] text-warn">
          Not connected — add Bybit keys on the{" "}
          <Link href="/dashboard/connection" className="underline">Connection</Link> tab to deploy.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Strategy">
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full border border-[var(--line-strong)] bg-bone/[0.04] px-2 py-1.5 text-[13px] text-bone outline-none focus:border-engine"
          >
            {strategies.map((s) => (
              <option key={s.id} value={s.id} className="bg-ink">{s.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Quantity">
          <input type="number" value={qty} step={0.001} min={0.001} onChange={(e) => setQty(Number(e.target.value))}
            className="w-full border border-[var(--line-strong)] bg-bone/[0.04] px-2 py-1.5 font-mono text-[13px] text-bone outline-none focus:border-engine" />
        </Field>
        <Field label="Max drawdown">
          <input type="number" value={maxDd} step={0.05} min={0.05} max={1} onChange={(e) => setMaxDd(Number(e.target.value))}
            className="w-full border border-[var(--line-strong)] bg-bone/[0.04] px-2 py-1.5 font-mono text-[13px] text-bone outline-none focus:border-engine" />
        </Field>
        <div className="flex items-end">
          <Button variant="primary" className="w-full" onClick={deploy} disabled={!strategy || connected === false}>
            Deploy
          </Button>
        </div>
      </div>
      {deployed && (
        <p className="mt-3 text-[12px] text-ok">
          Bot <span className="font-mono">{deployed}</span> deployed.{" "}
          <Link href="/dashboard/bots" className="underline">Open the bot console →</Link>
        </p>
      )}
      {error && <p className="mt-3 font-mono text-[11px] text-veto-soft">{error}</p>}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-mute">{label}</span>
      {children}
    </label>
  );
}
