"use client";

import { useCallback, useEffect, useState } from "react";
import { getGuardState } from "@/features/trade/api";
import type { GuardState } from "@/features/trade/types";
import { Badge, Button, Card, StatTile } from "@/features/dashboard/components/primitives";

const REGIMES = ["Risk off", "Neutral", "Risk on"];

export default function MacroGuardPage() {
  const [state, setState] = useState<GuardState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      setState(await getGuardState(signal));
    } catch (cause) {
      if (!signal?.aborted) setError((cause as Error).message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const explanation = state?.halted
    ? "Drawdown halt is active. The contract permits only Flat, which reduces exposure. The agent can explicitly resume after review."
    : state?.regime === 0
      ? "Risk off blocks new Long signals. Short and Flat remain permitted."
      : "The contract currently permits Long, Short, and Flat signals. The trading engine still applies its own checks before placing an order.";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">MacroGuard transparency</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/55">
            Public risk state on BSC Testnet. Refresh to read the contract again; this page does not place trades.
          </p>
        </div>
        <Button onClick={() => void refresh()} disabled={loading} aria-label="Refresh MacroGuard state">
          {loading ? "Reading…" : "Refresh state"}
        </Button>
      </header>

      <Card title="Contract" subtitle="Read directly from the configured BSC RPC on each refresh">
        {error && <p role="alert" className="text-sm text-rose-300">Engine error: {error}</p>}
        {state && !state.connected && (
          <p role="status" className="text-sm text-amber-300">
            On-chain state unavailable: {state.error ?? "unknown error"}. No live risk claim is shown.
          </p>
        )}
        {!state && !error && <p className="text-sm text-white/50">Reading contract state…</p>}
        {state && (
          <div className="mt-4 space-y-2 text-sm text-white/65">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={state.connected ? "green" : "amber"} dot>
                {state.connected ? "Live contract read" : "Unverified"}
              </Badge>
              <span>BNB Smart Chain Testnet · chain ID {state.chain_id}</span>
            </div>
            <p className="break-all font-mono text-xs">Address: {state.address ?? "Not configured"}</p>
            {state.agent && <p className="break-all font-mono text-xs">Agent: {state.agent}</p>}
            {state.explorer && (
              <a className="inline-block text-[#aeb9f4] underline underline-offset-2" href={state.explorer} target="_blank" rel="noopener noreferrer">
                Inspect contract on BscScan ↗
              </a>
            )}
          </div>
        )}
      </Card>

      {state?.connected && state.allowed && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Regime" value={REGIMES[state.regime ?? 1] ?? "Unknown"} />
            <StatTile label="Halted" value={state.halted ? "Yes" : "No"} />
            <StatTile label="Max drawdown" value={`${((state.max_drawdown_bps ?? 0) / 100).toFixed(2)}%`} hint="2,000 bps = 20%" />
            <StatTile label="Decisions logged" value={state.decision_count ?? 0} />
          </div>

          <Card title="Why a signal is allowed or blocked" subtitle="Contract response for each signal right now">
            <p className="mb-4 text-sm leading-relaxed text-white/65">{explanation}</p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(["long", "short", "flat"] as const).map((signal) => (
                <div key={signal} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <dt className="text-xs uppercase tracking-wide text-white/40">{signal}</dt>
                  <dd className="mt-1 text-sm font-semibold text-white">
                    {state.allowed?.[signal] ? "Allowed" : "Blocked"}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-white/40">
              MacroGuard records successful decisions sent by the agent. The off-chain Python runner checks this gate before Bybit orders, but currently falls back to its local stop if the RPC fails. The contract does not execute trades or guarantee profit.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
