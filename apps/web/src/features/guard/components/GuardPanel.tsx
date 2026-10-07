"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { engineAvailable, getGuardState } from "@/features/trade/api";
import type { GuardState } from "@/features/trade/types";
import { readGuardFromChain } from "../chainRead";
import { Button, Skeleton } from "@/features/dashboard/components/primitives";
import { Count } from "@/features/motion/Motion";
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

const LIMITS = [
  "The contract does not execute Bybit orders. Execution stays off-chain.",
  "The drawdown is reported by the agent, not measured by the contract.",
  "The agent can call resume() — a halt is a recorded pause, not a lock.",
  "No live bot tick or profit is claimed. Backtests are research only.",
];

export function GuardPanel({ variant = "cockpit" }: { variant?: "public" | "cockpit" }) {
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

  const head =
    variant === "public" ? (
      <h1 className="display-2 ld-lines mt-6 max-w-[14ch] text-bone" aria-label="What may the bot do right now?">
        <span className="ln">
          <span className="ln-i" style={{ "--i": 0 } as CSSProperties}>
            What may the bot do
          </span>
        </span>
        <span className="ln">
          <span className="ln-i serif-i text-chain" style={{ "--i": 1 } as CSSProperties}>
            right now?
          </span>
        </span>
      </h1>
    ) : (
      <h1 className="display-3 mt-4 text-bone">
        What may the bot do <span className="serif-i text-chain">right now?</span>
      </h1>
    );

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------- header */}
      <header className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <div className="ld-fade flex flex-wrap items-center gap-x-4 gap-y-1" style={{ "--d": "0.05s" } as CSSProperties}>
            <span className="meta text-chain">MacroGuard</span>
            <span className="meta text-mute">BNB Smart Chain Testnet · chain {DEX_GUARD.chainId}</span>
          </div>
          {head}
          <p className="ld-up mt-5 max-w-[60ch] text-[15px] leading-relaxed text-mute" style={{ "--d": "0.45s" } as CSSProperties}>
            DRIFT&apos;s quant engine runs off-chain. Its risk gate lives in a public contract. This page shows the
            contract&apos;s state as read from BNB Chain by your browser. It never signs or sends a transaction.
          </p>
        </div>
        <div className="ld-up flex flex-wrap items-center gap-3 lg:col-span-4 lg:justify-end" style={{ "--d": "0.55s" } as CSSProperties}>
          {readAt && !error && (
            <span className="meta text-mute [overflow-wrap:anywhere]">
              read {readAt}
              {source?.kind === "rpc" ? ` via ${source.rpc}` : " via local engine"}
            </span>
          )}
          <Button onClick={refresh} disabled={loading} aria-label="Read MacroGuard state again">
            {loading ? "Reading…" : "↻ Refresh"}
          </Button>
        </div>
      </header>

      <p className="no-js-note border border-[var(--line-strong)] px-4 py-3 text-sm leading-relaxed text-bone/85">
        This page reads the contract from your browser, and JavaScript is off, so no live state is shown. The verified
        receipts below are static evidence; the contract itself is public on{" "}
        <a className="text-chain-soft underline underline-offset-2" href={addressUrl(DEX_GUARD.address)} target="_blank" rel="noopener noreferrer">
          BscScan ↗
        </a>
        .
      </p>

      {/* --------------------------------------------------- status banners */}
      {status === "offline" && (
        <div role="alert" className="hud hud-veto flex items-start gap-3 bg-veto/[0.06] px-4 py-4 text-sm text-bone">
          <span aria-hidden className="mt-px grid h-5 w-5 shrink-0 place-items-center border border-warn/60 text-[12px] font-bold text-warn">
            !
          </span>
          <p className="min-w-0 leading-relaxed [overflow-wrap:anywhere]">
            <strong className="font-semibold">Live read unavailable.</strong> The live read failed ({error ?? "no response"}), so no
            live risk claim is shown. A trading runner that cannot reach BNB Chain takes no new risk: only exits pass. The contract is still
            public:{" "}
            <a className="text-chain-soft underline underline-offset-2" href={addressUrl(DEX_GUARD.address)} target="_blank" rel="noopener noreferrer">
              check it on BscScan ↗
            </a>
            . Verified receipts are below.
          </p>
        </div>
      )}
      {state && !isDexContract && (
        <p role="status" className="border border-[var(--line-strong)] bg-bone/[0.04] px-4 py-3 text-sm text-bone/85">
          This engine is configured for <span className="font-mono">{short(address, 8, 6)}</span>, not Dex&apos;s
          deployment. The timeline below belongs to <span className="font-mono">{short(DEX_GUARD.address, 8, 6)}</span>.
        </p>
      )}

      {/* ------------------------------------------------ state + proof row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Panel
          reveal="load"
          delay={0.5}
          className="flex flex-col p-5 pt-6 sm:p-7 lg:col-span-7"
          label={<Eyebrow>Right now</Eyebrow>}
          aside={status === "loading" ? <Skeleton className="h-7 w-48" /> : live ? <HaltChip halted={live.halted} /> : null}
        >
          <p className="mt-5 text-[20px] font-medium leading-snug tracking-[-0.01em] text-bone sm:text-[24px]" aria-live="polite">
            {headline(state, status)}
          </p>
          <div className="mt-6">
            <div className="meta mb-2 text-mute">Market regime stored on-chain{live ? `: ${regimeLabel(live.regime)}` : ""}</div>
            {status === "loading" ? <Skeleton className="h-[62px] w-full" /> : <RegimeStepper regime={live?.regime ?? null} />}
          </div>
          <div className="flex-1" />
          <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-[var(--line)] pt-5 text-[13px] leading-relaxed sm:grid-cols-2">
            <div>
              <dt className="font-medium text-bone">Who changes the regime?</dt>
              <dd className="mt-1 text-mute">
                Only the agent key, via <span className="font-mono">setRegime</span>, from the engine&apos;s macro classifier.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-bone">What triggers a halt?</dt>
              <dd className="mt-1 text-mute">A recorded decision with drawdown at or past the threshold. The contract flips it itself.</dd>
            </div>
          </dl>
        </Panel>

        <Panel
          chain
          reveal="load"
          delay={0.62}
          className="p-5 pt-6 sm:p-7 lg:col-span-5"
          label={<Eyebrow chain>The contract</Eyebrow>}
          aside={
            live ? (
              <span className="meta inline-flex items-center gap-1.5 text-ok">
                <span aria-hidden className="live-dot h-1.5 w-1.5 rounded-full bg-ok" />
                {source?.kind === "rpc" ? `live read · public RPC · block ${source.block.toLocaleString("en-US")}` : "live read · DRIFT engine"}
              </span>
            ) : (
              <span className="meta text-mute">{status === "loading" ? "reading" : "not live"}</span>
            )
          }
        >
          <dl className="mt-6 space-y-4 text-[13px]">
            <div>
              <dt className="meta text-mute">Contract</dt>
              <dd className="mt-1 flex items-center gap-2">
                <span className="font-mono text-bone" title={address}>
                  {short(address, 10, 8)}
                </span>
                <CopyValue value={address} label="contract address" />
              </dd>
            </div>
            <div>
              <dt className="meta text-mute">Agent · the only key that can write</dt>
              <dd className="mt-1 font-mono text-bone/85" title={live?.agent ?? DEX_GUARD.agent}>
                {short(live?.agent ?? DEX_GUARD.agent, 10, 8)}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-[var(--line)] pt-4">
              <div>
                <dt className="meta text-mute">Halt threshold</dt>
                <dd className="mt-1 font-mono text-[28px] leading-none tracking-[-0.03em] text-bone tnum">
                  {(thresholdBps / 100).toFixed(0)}%
                </dd>
                <dd className="meta mt-1 text-mute">{thresholdBps.toLocaleString("en-US")} bps</dd>
              </div>
              <div>
                <dt className="meta text-mute">Decisions logged</dt>
                <dd className="mt-1 font-mono text-[28px] leading-none tracking-[-0.03em] text-bone tnum">
                  {live && live.decision_count !== null ? <Count value={live.decision_count} /> : status === "loading" ? "…" : "—"}
                </dd>
                <dd className="meta mt-1 text-mute">on chain</dd>
              </div>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={addressUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-chain px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-chain-soft"
            >
              Open on BscScan ↗
            </a>
            <a
              href={txUrl(DEX_GUARD.deployTx)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center border border-chain/45 px-3.5 py-2 text-[13px] text-chain-soft transition-colors hover:bg-chain/10"
            >
              Deploy tx ↗
            </a>
          </div>
        </Panel>
      </div>

      {/* ---------------------------------------------------- signal verdicts */}
      <Panel
        className="p-5 pt-6 sm:p-7"
        label={<Eyebrow>Why each trade is allowed or blocked</Eyebrow>}
        aside={
          <span className="meta text-mute">
            contract call <span className="text-bone">allowed(signal)</span>
          </span>
        }
      >
        <div className="mt-5">
          {live?.allowed ? (
            <SignalVerdicts allowed={live.allowed} regime={live.regime} halted={live.halted} />
          ) : status === "loading" ? (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[132px]" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-mute">
              No live verdict without a chain read. The rules themselves are public: Risk off blocks Long; a drawdown halt
              allows only Flat.
            </p>
          )}
        </div>
      </Panel>

      {/* --------------------------------- what-if: ask the live contract */}
      <AskContract live={live} thresholdBps={thresholdBps} />

      {/* ----------------------------------------------- decision timeline */}
      <Panel
        chain
        id="trail"
        className="p-5 pt-6 sm:p-7"
        label={<Eyebrow chain>Public receipts</Eyebrow>}
        aside={<span className="meta text-mute">smoke test {DEX_GUARD.testedOn} · every row opens BscScan</span>}
      >
        <div className="mt-4">
          <DecisionTimeline />
        </div>
      </Panel>

      {/* ------------------------------------------- gauge + honest limits */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel className="p-5 pt-6 sm:p-7" label={<Eyebrow>The 20% limit</Eyebrow>}>
          <p className="mt-4 text-[14px] leading-relaxed text-mute">
            Each decision carries its drawdown. At or past {(thresholdBps / 100).toFixed(0)}%, the contract flips{" "}
            <span className="font-mono text-bone">halted = true</span> by itself. The runner records each decision here before it
            orders and acts on the answer; with no confirmed answer it takes no new risk (fail-closed).
          </p>
          <HaltGauge maxDrawdownBps={thresholdBps} />
        </Panel>

        <Panel className="p-5 pt-6 sm:p-7" label={<Eyebrow>What this does not prove</Eyebrow>}>
          <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-mute">
            {LIMITS.map((l) => (
              <li key={l} className="flex gap-3">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-mute" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
