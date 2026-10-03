// Verified, static on-chain evidence for Dex's MacroGuard deployment.
// Source: docs/deployment-dex.md (receipts checked 2026-09-30, all status 1).
// This is a dated record, not a live feed — the UI labels it that way.

import { CHAIN_ID, EXPLORER, MACROGUARD_ADDRESS, MACROGUARD_AGENT } from "./chainRead";

export { EXPLORER };

export const DEX_GUARD = {
  address: MACROGUARD_ADDRESS,
  agent: MACROGUARD_AGENT,
  chainId: CHAIN_ID,
  maxDrawdownBps: 2000,
  deployTx: "0x2d8cce2de583424a45e8de176c1b79438cdf54f7a016ae0cfc6c4ca86078c044",
  deployBlock: 133995398,
  testedOn: "2026-09-30",
} as const;

export type TimelineStep = {
  action: string;
  call: string;
  outcome: string;
  tone: "neutral" | "amber" | "rose" | "green";
  tx: string;
  block: number;
  gas: number;
  // Recorded drawdown in percent, for decisions only.
  drawdownPct?: number;
};

export const SMOKE_TEST: TimelineStep[] = [
  {
    action: "Deploy",
    call: "constructor(maxDrawdownBps = 2000)",
    outcome: "Neutral · not halted · 0 decisions",
    tone: "neutral",
    tx: DEX_GUARD.deployTx,
    block: DEX_GUARD.deployBlock,
    gas: 449207,
  },
  {
    action: "Risk off",
    call: "setRegime(RiskOff)",
    outcome: "Long blocked · Short and Flat allowed",
    tone: "amber",
    tx: "0x563f1eee78fee6a0b532c6ae50ab5de05667e7d64bb573ddc21596b9d2376858",
    block: 134042196,
    gas: 27790,
  },
  {
    action: "Safe decision",
    call: "recordDecision(BNB, Short, drawdown −1%)",
    outcome: "Decision #1 recorded · within the 20% limit",
    tone: "green",
    tx: "0x7a5185e4beb1c51f6c1fcaeb7614df88a5dd72357caa38ab7e15956500ab4810",
    block: 134042256,
    gas: 33189,
    drawdownPct: 1,
  },
  {
    action: "Breach → halt",
    call: "recordDecision(BNB, Short, drawdown −25%)",
    outcome: "Halted event · only Flat allowed",
    tone: "rose",
    tx: "0x8e346d74c06c53f2f8914c86c4be9e45c49ea99a54e41ece6fc53a018e3b62ef",
    block: 134042283,
    gas: 34323,
    drawdownPct: 25,
  },
  {
    action: "Resume",
    call: "resume()",
    outcome: "Resumed event · agent-only, on the record",
    tone: "neutral",
    tx: "0xda579ebbf2969b855fe50b4520593fb267e33f4db062e0c71c48ca64b18d18ae",
    block: 134042318,
    gas: 27030,
  },
  {
    action: "Back to neutral",
    call: "setRegime(Neutral)",
    outcome: "Long allowed again · 2 decisions on chain",
    tone: "green",
    tx: "0xa846652354020a77b8c24ef8bb3e088ccecb63f4c2c3267c0a4377c57a39486b",
    block: 134042328,
    gas: 27802,
  },
];

export const txUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const addressUrl = (address: string) => `${EXPLORER}/address/${address}`;
export const short = (hex: string, head = 6, tail = 4) =>
  hex.length > head + tail + 1 ? `${hex.slice(0, head)}…${hex.slice(-tail)}` : hex;
