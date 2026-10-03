"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConnection, listBots } from "../api";
import type { BotStatus, ConnectionStatus } from "../types";
import { pct } from "@/lib/format";
import { Card, StatTile, Badge, Button } from "@/features/dashboard/components/primitives";

export function Portfolio() {
  const [conn, setConn] = useState<ConnectionStatus | null>(null);
  const [bots, setBots] = useState<BotStatus[]>([]);

  useEffect(() => {
    let alive = true;
    const load = () =>
      Promise.all([getConnection().catch(() => null), listBots().catch(() => [])]).then(
        ([c, b]) => {
          if (!alive) return;
          setConn(c);
          setBots(b ?? []);
        },
      );
    load();
    const id = setInterval(load, 5_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const running = bots.filter((b) => b.running);
  const exposure = bots.filter((b) => b.position !== 0).length;

  return (
    <div className="space-y-4">
      {/* top stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Account equity"
          value={conn?.connected ? `${(conn.balance ?? 0).toFixed(2)}` : "—"}
          hint={conn?.connected ? (conn.testnet ? "testnet USDT" : "live USDT") : "not connected"}
        />
        <StatTile label="Running bots" value={running.length} hint={`${bots.length} total`} />
        <StatTile label="Open positions" value={exposure} hint="bots in market" />
        <StatTile
          label="Connection"
          value={conn?.connected ? (conn.testnet ? "Testnet" : "Live") : "Off"}
          accent={!!conn?.connected}
        />
      </div>

      {!conn?.connected && (
        <Card title="Connect to start">
          <div className="flex flex-col items-start gap-3 py-2">
            <Badge tone="amber" dot>Bybit keys required</Badge>
            <p className="text-sm text-mute">
              Add Bybit testnet keys to fund your account and deploy bots.
            </p>
            <Link href="/dashboard/connection">
              <Button variant="primary">Go to Connection</Button>
            </Link>
          </div>
        </Card>
      )}

      <Card title="Your bots" subtitle="Live positions and P&L">
        {bots.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-mute">No bots yet.</p>
            <Link href="/dashboard">
              <Button variant="primary">Browse markets</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-left font-mono text-[10px] uppercase tracking-wide text-mute">
                  <th className="py-2 pr-3 font-medium">Market</th>
                  <th className="py-2 pr-3 font-medium">Strategy</th>
                  <th className="py-2 pr-3 font-medium">Position</th>
                  <th className="py-2 pr-3 font-medium">Signal</th>
                  <th className="py-2 pr-3 text-right font-medium">Equity</th>
                  <th className="py-2 pr-3 text-right font-medium">P&amp;L</th>
                  <th className="py-2 text-right font-medium">Drawdown</th>
                </tr>
              </thead>
              <tbody>
                {bots.map((b) => {
                  const pnl = b.peak_equity > 0 ? b.equity / b.peak_equity - 1 : 0;
                  const pos = b.position > 0 ? "Long" : b.position < 0 ? "Short" : "Flat";
                  return (
                    <tr key={b.id} className="border-b border-[var(--line)]">
                      <td className="py-2.5 pr-3 font-mono text-bone">{b.config.symbol}</td>
                      <td className="py-2.5 pr-3 text-bone/70">{b.config.strategy}</td>
                      <td className="py-2.5 pr-3">
                        <span className={b.position > 0 ? "text-ok" : b.position < 0 ? "text-veto-soft" : "text-mute"}>
                          {pos}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-bone/70">{b.last_signal ?? "—"}</td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-bone">{b.equity.toFixed(2)}</td>
                      <td className={`py-2.5 pr-3 text-right font-mono tabular-nums ${pnl >= 0 ? "text-ok" : "text-veto-soft"}`}>
                        {pct(pnl)}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-bone/70">{pct(b.drawdown)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
