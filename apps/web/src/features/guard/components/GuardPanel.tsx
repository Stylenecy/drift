"use client";

import { useCallback, useEffect, useState } from "react";
import { engineAvailable, getGuardState } from "@/features/trade/api";
import type { GuardState } from "@/features/trade/types";
import { readGuardFromChain } from "../chainRead";
import { Button, Skeleton } from "@/features/dashboard/components/primitives";
import { DEX_GUARD, addressUrl, short, txUrl } from "../evidence";
import { AskContract } from "./AskContract";
import {
  CopyValue,
  DecisionTimeline,
  Eyebrow,
  HaltChip,
  HaltGauge,
  Panel,
  RegimeStepper,
  SignalVerdicts,
  regimeLabel,
} from "./parts";

type Status = "loading" | "live" | "offline";

// Where the live numbers came from; named on the badge (VISUAL-DIRECTION.md).
type Source = { kind: "rpc"; block: number; rpc: string } | { kind: "engine" };

// Local cockpit: ask the engine first. Hosted demo, or engine down: read the
// contract from the browser over a public RPC. Both down: throw, and the panel
// shows the offline state with the static evidence.
async function readGuard(signal?: AbortSignal): Promise<{ state: GuardState; source: Source }> {
  const engineTried = engineAvailable();
  if (engineTried) {
    try {
      const state = await getGuardState(signal);
      if (state.connected) return { state, source: { kind: "engine" } };
    } catch (cause) {
      if (signal?.aborted) throw cause;
    }
  }
  try {
    const read = await readGuardFromChain({ signal });
    return { state: read.state, source: { kind: "rpc", block: read.block, rpc: read.rpc } };
  } catch (cause) {
    if (signal?.aborted || !engineTried) throw cause;
    throw new Error(`DRIFT engine unavailable; ${cause instanceof Error ? cause.message : String(cause)}`);
  }
}

function headline(state: GuardState | null, status: Status): string {
  if (status === "loading") return "Reading the contract…";
  if (status !== "live" || !state) return "Live state unavailable — showing verified evidence only.";
  if (state.halted) return "Halted. The bot may only go Flat until the agent resumes on the record.";
  if (state.regime === 0) return "Risk off. New Longs are vetoed; Short and Flat are open.";
  return "Open. The contract allows Long, Short and Flat right now.";
}

export function GuardPanel() {
  const [state, setState] = useState<GuardState | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [readAt, setReadAt] = useState<string | null>(null);

  // Settles one read; all state updates happen after the network call.
  const read = useCallback((signal?: AbortSignal) => {
    return readGuard(signal)
      .then((next) => {
        setState(next.state);
        setSource(next.source);
        setError(null);
        setReadAt(new Date().toLocaleTimeString("en-GB"));
      })
      .catch((cause: Error) => {
        if (!signal?.aborted) setError(cause.message);
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false);
      });
  }, []);

  const refresh = () => {
    setLoading(true);
    void read();
  };

  useEffect(() => {
    const controller = new AbortController();
    void read(controller.signal);
    return () => controller.abort();
  }, [read]);

  const status: Status = loading && !state ? "loading" : error || !state?.connected ? "offline" : "live";
  const live = status === "live" && state ? state : null;
  const address = state?.address ?? DEX_GUARD.address;
  const isDexContract = address.toLowerCase() === DEX_GUARD.address.toLowerCase();
  const thresholdBps = live?.max_drawdown_bps ?? DEX_GUARD.maxDrawdownBps;

  return (
    <div className="space-y-5">
      {/* ---------------------------------------------------------- header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <Eyebrow chain>MacroGuard · BNB Smart Chain Testnet · chain 97</Eyebrow>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-[30px] sm:leading-tight">
            What is the bot allowed to do right now?
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            DRIFT&apos;s quant engine runs off-chain. Its risk gate lives in a public contract. This page shows
            the contract&apos;s state as read from BNB Chain. It never signs or sends a transaction.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {readAt && !error && (
            <span className="font-mono text-[11px] text-white/60 [overflow-wrap:anywhere]">
              read at {readAt}
              {source?.kind === "rpc" ? ` via ${source.rpc}` : " via local engine"}
            </span>
          )}
          <Button onClick={refresh} disabled={loading} aria-label="Read MacroGuard state again">
            {loading ? "Reading…" : "↻ Refresh"}
          </Button>
        </div>
      </header>

      {/* --------------------------------------------------- status banners */}
      {status === "offline" && (
        <p role="alert" className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <strong className="font-semibold">Live read unavailable.</strong> The live read failed (
          {error ?? "no response"}), so no live risk claim is shown. In this state the trading runner fails open to
          its local stop. The contract is still public:{" "}
          <a className="underline underline-offset-2" href={addressUrl(DEX_GUARD.address)} target="_blank" rel="noopener noreferrer">
            check it on BscScan ↗
          </a>
          . Verified receipts are below.
        </p>
      )}
      {state && !isDexContract && (
        <p role="status" className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          This engine is configured for <span className="font-mono">{short(address, 8, 6)}</span>, not Dex&apos;s
          deployment. The timeline below belongs to <span className="font-mono">{short(DEX_GUARD.address, 8, 6)}</span>.
        </p>
      )}

      {/* ------------------------------------------------ state + proof row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Panel className="flex flex-col p-5 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow>Live risk state</Eyebrow>
            {status === "loading" ? <Skeleton className="h-7 w-48 rounded-full" /> : live ? <HaltChip halted={live.halted} /> : null}
          </div>
          <p className="mt-3 text-[17px] font-medium leading-snug text-white sm:text-lg" aria-live="polite">
            {headline(state, status)}
          </p>
          <div className="mt-5">
            <div className="mb-2 text-[11px] text-white/50">
              Market regime stored on-chain{live ? `: ${regimeLabel(live.regime)}` : ""}
            </div>
            {status === "loading" ? <Skeleton className="h-[58px] w-full" /> : <RegimeStepper regime={live?.regime ?? null} />}
          </div>
          <div className="flex-1" />
          <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-white/10 pt-4 text-[12px] leading-relaxed sm:grid-cols-2">
            <div>
              <dt className="font-medium text-white/85">Who changes the regime?</dt>
              <dd className="text-white/60">Only the agent key, via <span className="font-mono">setRegime</span>, from the engine&apos;s macro classifier.</dd>
            </div>
            <div>
              <dt className="font-medium text-white/85">What triggers a halt?</dt>
              <dd className="text-white/60">A recorded decision with drawdown past the threshold. The contract flips it itself.</dd>
            </div>
          </dl>
        </Panel>

        <Panel chain className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow chain>On-chain proof</Eyebrow>
            {live ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-emerald-300">
                <span aria-hidden className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {source?.kind === "rpc"
                  ? `live read · public RPC · block ${source.block.toLocaleString("en-US")}`
                  : "live read · DRIFT engine"}
              </span>
            ) : (
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10.5px] uppercase tracking-wide text-white/55">
                {status === "loading" ? "reading" : "not live"}
              </span>
            )}
          </div>
          <dl className="mt-4 space-y-3 text-[12.5px]">
            <div>
              <dt className="text-white/50">Contract</dt>
              <dd className="mt-0.5 flex items-center gap-2">
                <span className="font-mono text-white" title={address}>{short(address, 10, 8)}</span>
                <CopyValue value={address} label="contract address" />
              </dd>
            </div>
            <div>
              <dt className="text-white/50">Agent (only key that can write)</dt>
              <dd className="mt-0.5 font-mono text-white/85" title={live?.agent ?? DEX_GUARD.agent}>
                {short(live?.agent ?? DEX_GUARD.agent, 10, 8)}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-white/50">Halt threshold</dt>
                <dd className="mt-0.5 font-mono text-white">
                  {(thresholdBps / 100).toFixed(0)}% <span className="text-white/45">({thresholdBps} bps)</span>
                </dd>
              </div>
              <div>
                <dt className="text-white/50">Decisions logged</dt>
                <dd className="mt-0.5 font-mono text-white">
                  {live ? live.decision_count : status === "loading" ? "…" : "—"}
                </dd>
              </div>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={addressUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#f0b90b] px-3 py-1.5 text-[12.5px] font-semibold text-[#1a1405] transition hover:bg-[#f8d36a]"
            >
              Open on BscScan ↗
            </a>
            <a
              href={txUrl(DEX_GUARD.deployTx)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-[#f0b90b]/35 px-3 py-1.5 text-[12.5px] text-[#f8d36a] transition hover:bg-[#f0b90b]/10"
            >
              Deploy tx ↗
            </a>
          </div>
        </Panel>
      </div>

      {/* ---------------------------------------------------- signal verdicts */}
      <Panel className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Eyebrow>Why a signal is allowed or blocked</Eyebrow>
          <span className="text-[11px] text-white/50">contract call <span className="font-mono">allowed(signal)</span></span>
        </div>
        <div className="mt-4">
          {live?.allowed ? (
            <SignalVerdicts allowed={live.allowed} regime={live.regime} halted={live.halted} />
          ) : status === "loading" ? (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[112px] rounded-xl" />)}
            </div>
          ) : (
            <p className="text-sm text-white/65">
              No live verdict without a chain read. The rules themselves are public: Risk off blocks Long; a
              drawdown halt allows only Flat.
            </p>
          )}
        </div>
      </Panel>

      {/* --------------------------------- what-if: ask the live contract */}
      <AskContract live={live} thresholdBps={thresholdBps} />

      {/* ----------------------------------------------- decision timeline */}
      <Panel chain className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Eyebrow chain>Decision trail · verified receipts</Eyebrow>
          <span className="text-[11px] text-white/50">smoke test {DEX_GUARD.testedOn} · every row opens BscScan</span>
        </div>
        <div className="mt-3">
          <DecisionTimeline />
        </div>
      </Panel>

      {/* ------------------------------------------- gauge + honest limits */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <Eyebrow>The halt line</Eyebrow>
          <p className="mt-2 text-[13px] leading-relaxed text-white/70">
            Each decision carries its drawdown. Past {(thresholdBps / 100).toFixed(0)}%, the contract flips{" "}
            <span className="font-mono">halted = true</span> by itself. The runner checks this gate before every
            order. If the RPC is unreachable it falls back to its local stop (fail-open).
          </p>
          <HaltGauge maxDrawdownBps={thresholdBps} />
        </Panel>

        <Panel className="p-5">
          <Eyebrow>What this does not prove</Eyebrow>
          <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-white/70">
            <li>• The contract does not execute Bybit orders. Execution stays off-chain.</li>
            <li>• If the RPC is down, the runner fails open to its local drawdown stop.</li>
            <li>• The agent can call <span className="font-mono">resume()</span> — a halt is a recorded pause, not a lock.</li>
            <li>• No live bot tick or profit is claimed. Backtests are research only.</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
