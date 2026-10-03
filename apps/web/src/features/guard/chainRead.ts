// Reads Dex's MacroGuard contract straight from BNB Smart Chain Testnet over
// public JSON-RPC, so the hosted demo needs no engine, key or wallet.
//
// It can also ask the contract a what-if question: an `eth_call` of
// `recordDecision(...)` sent as if from the agent address. An eth_call is a
// simulation the node runs and throws away: nothing is signed, nothing is
// written, no transaction exists afterwards and no gas is spent.
//
// Integrity: the RPC URLs and the contract address are code constants. Nothing
// in the URL, hash or browser storage can point this module somewhere else, so
// a link to the demo cannot make it show another contract's state as "live".
//
// Kept free of path aliases and non-erasable TypeScript so `node --test` can
// import it directly (see chainRead.test.mjs).

import type { GuardState } from "../trade/types";

export const MACROGUARD_ADDRESS = "0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D";
export const MACROGUARD_AGENT = "0x2B07AfB54068042664074781Af36163aC6714b81";
export const CHAIN_ID = 97;
export const EXPLORER = "https://testnet.bscscan.com";

// Primary first; the second is only tried when the first fails or times out.
export const PUBLIC_RPCS = [
  "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
  "https://bsc-testnet-rpc.publicnode.com",
] as const;

const RPC_TIMEOUT_MS = 6000;

// Function selectors (`cast sig`). Enum order in MacroGuard.sol:
// Regime {RiskOff, Neutral, RiskOn} · Signal {Flat, Long, Short}.
const SELECTOR = {
  regime: "0xc70931d9",
  halted: "0xb9b8af0b",
  maxDrawdownBps: "0x5661d461",
  decisionCount: "0x100b63cb",
  agent: "0xf5ff5c76",
  allowed: "0xba795b85",
  recordDecision: "0x210f3f4f", // recordDecision(string,uint8,uint256,int256)
} as const;

// Custom errors MacroGuard can revert with (`cast sig "NotAgent()"`).
const CUSTOM_ERRORS: Record<string, string> = { "0x0d9ab13f": "NotAgent()" };

const SIGNAL = { flat: 0, long: 1, short: 2 } as const;

export type SignalName = keyof typeof SIGNAL;

export type ChainRead = {
  state: GuardState;
  block: number;
  // Host of the RPC that answered, for the "live read · public RPC" badge.
  rpc: string;
};

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

type RpcResponse = { result?: unknown; error?: { message?: string; data?: unknown } };

type Call = (method: string, params: unknown[]) => Promise<unknown>;

type RpcOptions = { signal?: AbortSignal; fetchImpl?: FetchLike };

function word(hex: unknown, what: string): bigint {
  if (typeof hex !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(`malformed ${what} result`);
  }
  return BigInt(hex);
}

function smallInt(hex: unknown, what: string): number {
  const value = word(hex, what);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`${what} out of range`);
  return Number(value);
}

function bool(hex: unknown, what: string): boolean {
  const value = word(hex, what);
  if (value > BigInt(1)) throw new Error(`${what} is not a bool`);
  return value === BigInt(1);
}

function address(hex: unknown, what: string): string {
  const value = word(hex, what).toString(16).padStart(40, "0");
  if (value.length > 40) throw new Error(`${what} is not an address`);
  const lower = `0x${value}`;
  // Keep the checksummed spelling for the agent we know; others stay lowercase.
  return lower === MACROGUARD_AGENT.toLowerCase() ? MACROGUARD_AGENT : lower;
}

function quantity(hex: unknown, what: string): number {
  if (typeof hex !== "string" || !/^0x[0-9a-fA-F]{1,16}$/.test(hex)) {
    throw new Error(`malformed ${what}`);
  }
  return Number.parseInt(hex.slice(2), 16);
}

function rpcErrorMessage(error: { message?: string; data?: unknown }): string {
  const message = error.message ?? "RPC error";
  const selector = typeof error.data === "string" ? error.data.slice(0, 10).toLowerCase() : "";
  const known = CUSTOM_ERRORS[selector];
  return known ? `${message}: ${known}` : message;
}

// One abortable timeout per RPC, chained to the caller's signal.
function withTimeout(signal: AbortSignal | undefined): { signal: AbortSignal; done: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("RPC timed out")), RPC_TIMEOUT_MS);
  const onAbort = () => controller.abort(signal?.reason);
  if (signal?.aborted) controller.abort(signal.reason);
  else signal?.addEventListener("abort", onAbort, { once: true });
  return {
    signal: controller.signal,
    done: () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    },
  };
}

function rpcCaller(rpc: string, fetchImpl: FetchLike, signal: AbortSignal): Call {
  let id = 0;
  return async (method, params) => {
    const res = await fetchImpl(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
      signal,
    });
    if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
    const body = (await res.json()) as RpcResponse;
    if (body.error) throw new Error(rpcErrorMessage(body.error));
    return body.result;
  };
}

async function assertChain(call: Call): Promise<void> {
  const chainId = quantity(await call("eth_chainId", []), "chain id");
  if (chainId !== CHAIN_ID) throw new Error(`wrong chain ${chainId}, expected ${CHAIN_ID}`);
}

// Tries each public RPC in order. Throws only when every RPC failed (or the
// caller aborted); the message lists why each one failed.
async function eachRpc<T>(what: string, options: RpcOptions, run: (rpc: string, call: Call) => Promise<T>): Promise<T> {
  const fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));
  const failures: string[] = [];
  for (const rpc of PUBLIC_RPCS) {
    if (options.signal?.aborted) throw options.signal.reason ?? new Error("aborted");
    const timeout = withTimeout(options.signal);
    try {
      return await run(rpc, rpcCaller(rpc, fetchImpl, timeout.signal));
    } catch (cause) {
      if (options.signal?.aborted) throw cause;
      failures.push(`${new URL(rpc).host}: ${cause instanceof Error ? cause.message : String(cause)}`);
    } finally {
      timeout.done();
    }
  }
  throw new Error(`public RPC ${what} failed (${failures.join("; ")})`);
}

async function readFrom(rpc: string, call: Call): Promise<ChainRead> {
  const view = (data: string) => call("eth_call", [{ to: MACROGUARD_ADDRESS, data }, "latest"]);
  const allowedArg = (sig: number) => `${SELECTOR.allowed}${sig.toString(16).padStart(64, "0")}`;

  await assertChain(call);

  const code = await call("eth_getCode", [MACROGUARD_ADDRESS, "latest"]);
  if (typeof code !== "string" || !/^0x[0-9a-fA-F]+$/.test(code) || code.length <= 2) {
    throw new Error("no contract code at the MacroGuard address");
  }

  const [block, regime, halted, maxDrawdownBps, decisionCount, agent, flat, long, short] = await Promise.all([
    call("eth_blockNumber", []),
    view(SELECTOR.regime),
    view(SELECTOR.halted),
    view(SELECTOR.maxDrawdownBps),
    view(SELECTOR.decisionCount),
    view(SELECTOR.agent),
    view(allowedArg(SIGNAL.flat)),
    view(allowedArg(SIGNAL.long)),
    view(allowedArg(SIGNAL.short)),
  ]);

  const regimeValue = smallInt(regime, "regime");
  if (regimeValue > 2) throw new Error(`unknown regime ${regimeValue}`);

  return {
    block: quantity(block, "block number"),
    rpc: new URL(rpc).host,
    state: {
      connected: true,
      address: MACROGUARD_ADDRESS,
      chain_id: CHAIN_ID,
      explorer: EXPLORER,
      agent: address(agent, "agent"),
      regime: regimeValue,
      halted: bool(halted, "halted"),
      max_drawdown_bps: smallInt(maxDrawdownBps, "maxDrawdownBps"),
      decision_count: smallInt(decisionCount, "decisionCount"),
      allowed: {
        flat: bool(flat, "allowed(Flat)"),
        long: bool(long, "allowed(Long)"),
        short: bool(short, "allowed(Short)"),
      },
      error: null,
    },
  };
}

export function readGuardFromChain(options: RpcOptions = {}): Promise<ChainRead> {
  return eachRpc("read", options, readFrom);
}

/* ------------------------------------------------- what-if simulation -- */

// Symbol and price sent with a simulated decision. The gate reads neither:
// only the signal, the drawdown and the stored regime/halt state decide.
export const SIMULATED_SYMBOL = "BTCUSDT";
export const SIMULATED_PRICE = 0;

const TWO_POW_255 = BigInt(2) ** BigInt(255);
const TWO_POW_256 = BigInt(2) ** BigInt(256);

function uintWord(value: bigint): string {
  if (value < BigInt(0) || value >= TWO_POW_256) throw new Error("value out of uint256 range");
  return value.toString(16).padStart(64, "0");
}

function intWord(value: bigint): string {
  if (value < -TWO_POW_255 || value >= TWO_POW_255) throw new Error("value out of int256 range");
  return uintWord(value < BigInt(0) ? TWO_POW_256 + value : value);
}

// ABI-encodes recordDecision(symbol, signal, price, drawdownBps), byte for byte
// what `cast calldata "recordDecision(string,uint8,uint256,int256)" ...` prints.
export function encodeRecordDecision(symbol: string, signal: SignalName, price: bigint, drawdownBps: number): string {
  if (!/^[A-Z0-9]{1,32}$/.test(symbol)) throw new Error("symbol must be 1 to 32 capital letters or digits");
  if (!Object.prototype.hasOwnProperty.call(SIGNAL, signal)) throw new Error(`unknown signal ${String(signal)}`);
  if (!Number.isInteger(drawdownBps) || drawdownBps < -10000 || drawdownBps > 10000) {
    throw new Error("drawdown must be a whole number of bps between -10000 and 10000");
  }
  let text = "";
  for (let i = 0; i < symbol.length; i += 1) text += symbol.charCodeAt(i).toString(16).padStart(2, "0");
  return (
    SELECTOR.recordDecision +
    uintWord(BigInt(128)) + // offset of the string: four head words
    uintWord(BigInt(SIGNAL[signal])) +
    uintWord(price) +
    intWord(BigInt(drawdownBps)) +
    uintWord(BigInt(symbol.length)) +
    text.padEnd(64, "0")
  );
}

export type DecisionQuestion = { signal: SignalName; drawdownBps: number };

export type DecisionAnswer = {
  allowed: boolean;
  block: number;
  rpc: string;
  // The exact call that was simulated, so anyone can replay it with `cast call`.
  call: { from: string; to: string; data: string };
};

// Asks the live contract what recordDecision would return for this question,
// via eth_call from the agent address. Read-only: never signs or sends.
export function askRecordDecision(question: DecisionQuestion, options: RpcOptions = {}): Promise<DecisionAnswer> {
  let data: string;
  try {
    data = encodeRecordDecision(SIMULATED_SYMBOL, question.signal, BigInt(SIMULATED_PRICE), question.drawdownBps);
  } catch (cause) {
    return Promise.reject(cause);
  }
  const tx = { from: MACROGUARD_AGENT, to: MACROGUARD_ADDRESS, data };
  return eachRpc("call", options, async (rpc, call) => {
    await assertChain(call);
    const [block, result] = await Promise.all([call("eth_blockNumber", []), call("eth_call", [tx, "latest"])]);
    return {
      allowed: bool(result, "recordDecision"),
      block: quantity(block, "block number"),
      rpc: new URL(rpc).host,
      call: tx,
    };
  });
}

export type GateRules = { regime: number; halted: boolean; maxDrawdownBps: number };

// The published rules of MacroGuard.sol, applied in the order the contract
// applies them: a drawdown at or past the limit halts first; a halt allows only
// Flat; Risk off vetoes new Longs. Used to explain an answer, never to replace it.
export function expectDecision(rules: GateRules, question: DecisionQuestion): { allowed: boolean; haltsNow: boolean } {
  const haltsNow = !rules.halted && question.drawdownBps <= -rules.maxDrawdownBps;
  let allowed = true;
  if (rules.halted || haltsNow) allowed = question.signal === "flat";
  else if (rules.regime === 0) allowed = question.signal !== "long";
  return { allowed, haltsNow };
}

// The same question as a `cast call` command, for anyone who wants to replay it.
export function castCommand(question: DecisionQuestion, rpc: string = PUBLIC_RPCS[1]): string {
  return [
    `cast call ${MACROGUARD_ADDRESS}`,
    `"recordDecision(string,uint8,uint256,int256)(bool)"`,
    `--from ${MACROGUARD_AGENT} --rpc-url ${rpc}`,
    `-- ${SIMULATED_SYMBOL} ${SIGNAL[question.signal]} ${SIMULATED_PRICE} ${question.drawdownBps}`,
  ].join(" ");
}
