// Reads Dex's MacroGuard contract straight from BNB Smart Chain Testnet over
// public JSON-RPC, so the hosted demo needs no engine, key or wallet.
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
} as const;

const SIGNAL = { flat: 0, long: 1, short: 2 } as const;

export type ChainRead = {
  state: GuardState;
  block: number;
  // Host of the RPC that answered, for the "live read · public RPC" badge.
  rpc: string;
};

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

type RpcResponse = { result?: unknown; error?: { message?: string } };

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

async function readFrom(rpc: string, fetchImpl: FetchLike, signal: AbortSignal): Promise<ChainRead> {
  let id = 0;
  const call = async (method: string, params: unknown[]): Promise<unknown> => {
    const res = await fetchImpl(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
      signal,
    });
    if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
    const body = (await res.json()) as RpcResponse;
    if (body.error) throw new Error(body.error.message ?? "RPC error");
    return body.result;
  };
  const view = (data: string) => call("eth_call", [{ to: MACROGUARD_ADDRESS, data }, "latest"]);
  const allowedArg = (sig: number) => `${SELECTOR.allowed}${sig.toString(16).padStart(64, "0")}`;

  const chainId = quantity(await call("eth_chainId", []), "chain id");
  if (chainId !== CHAIN_ID) throw new Error(`wrong chain ${chainId}, expected ${CHAIN_ID}`);

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

// Tries each public RPC in order. Throws only when every RPC failed (or the
// caller aborted); the message lists why each one failed.
export async function readGuardFromChain(
  options: { signal?: AbortSignal; fetchImpl?: FetchLike } = {},
): Promise<ChainRead> {
  const fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));
  const failures: string[] = [];
  for (const rpc of PUBLIC_RPCS) {
    if (options.signal?.aborted) throw options.signal.reason ?? new Error("aborted");
    const timeout = withTimeout(options.signal);
    try {
      return await readFrom(rpc, fetchImpl, timeout.signal);
    } catch (cause) {
      if (options.signal?.aborted) throw cause;
      failures.push(`${new URL(rpc).host}: ${cause instanceof Error ? cause.message : String(cause)}`);
    } finally {
      timeout.done();
    }
  }
  throw new Error(`public RPC read failed (${failures.join("; ")})`);
}
