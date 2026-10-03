import type {
  BacktestRequest,
  BacktestResponse,
  BotConfig,
  BotStatus,
  ChainInfo,
  GuardState,
  ConnectionStatus,
  KlinesResponse,
  Market,
  OptimizeResponse,
  RegimeInfo,
  StrategyInfo,
  TelegramStatus,
} from "./types";

// The Python engine (apps/trader). Override with NEXT_PUBLIC_TRADER_URL.
const CONFIGURED_TRADER_URL = process.env.NEXT_PUBLIC_TRADER_URL;
export const TRADER_URL = CONFIGURED_TRADER_URL ?? "http://localhost:8099";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

// The engine runs on the user's own machine. A page served from anywhere else
// (the hosted demo) never calls it: no request or websocket to localhost leaves
// a public origin. An explicit NEXT_PUBLIC_TRADER_URL always wins.
export function engineAvailable(): boolean {
  if (CONFIGURED_TRADER_URL) return true;
  if (typeof window === "undefined") return false;
  return LOCAL_HOSTS.has(window.location.hostname);
}

export const ENGINE_UNAVAILABLE = "The DRIFT engine is not called from this hosted demo.";

function engineFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!engineAvailable()) return Promise.reject(new Error(ENGINE_UNAVAILABLE));
  return fetch(`${TRADER_URL}${path}`, init);
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function fetchStrategies(signal?: AbortSignal): Promise<StrategyInfo[]> {
  return json(await engineFetch(`/strategies`, { signal }));
}

export async function getChain(signal?: AbortSignal): Promise<ChainInfo> {
  return json(await engineFetch(`/chain`, { signal }));
}

export async function getGuardState(signal?: AbortSignal): Promise<GuardState> {
  return json(await engineFetch(`/guard/state`, { signal }));
}

export async function getRegime(signal?: AbortSignal): Promise<RegimeInfo> {
  return json(await engineFetch(`/regime`, { signal }));
}

export async function getTelegram(signal?: AbortSignal): Promise<TelegramStatus> {
  return json(await engineFetch(`/telegram`, { signal }));
}

export async function connectTelegram(
  body: { token: string; chat_id?: string },
): Promise<TelegramStatus> {
  return json(
    await engineFetch(`/telegram`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function testTelegram(): Promise<{ sent: boolean }> {
  return json(await engineFetch(`/telegram/test`, { method: "POST" }));
}

export async function fetchMarkets(signal?: AbortSignal): Promise<Market[]> {
  return json(await engineFetch(`/markets`, { signal }));
}

export async function fetchKlines(
  symbol: string,
  timeframe: string,
  bars = 200,
  signal?: AbortSignal,
): Promise<KlinesResponse> {
  const q = new URLSearchParams({ symbol, timeframe, bars: String(bars) });
  return json(await engineFetch(`/klines?${q}`, { signal }));
}

export async function runOptimize(
  body: { symbol: string; timeframe: string; bars: number; train_frac: number },
  signal?: AbortSignal,
): Promise<OptimizeResponse> {
  return json(
    await engineFetch(`/optimize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    }),
  );
}

export async function runBacktest(
  req: BacktestRequest,
  signal?: AbortSignal,
): Promise<BacktestResponse> {
  return json(
    await engineFetch(`/backtest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
      signal,
    }),
  );
}

// ---- live trading ----

export async function getConnection(signal?: AbortSignal): Promise<ConnectionStatus> {
  return json(await engineFetch(`/connection`, { signal }));
}

export async function setConnection(
  body: { api_key: string; api_secret: string; testnet: boolean },
): Promise<ConnectionStatus> {
  return json(
    await engineFetch(`/connection`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function listBots(signal?: AbortSignal): Promise<BotStatus[]> {
  return json(await engineFetch(`/bots`, { signal }));
}

export async function startBot(config: BotConfig): Promise<BotStatus> {
  return json(
    await engineFetch(`/bots`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(config),
    }),
  );
}

export async function stopBot(botId: string): Promise<void> {
  const res = await engineFetch(`/bots/${botId}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json()).detail ?? res.statusText);
}

// ws:// URL for a bot's live status stream. Only reached for bots the engine
// listed, so never on the hosted demo (listBots is gated above).
export function botStreamUrl(botId: string): string {
  return `${TRADER_URL.replace(/^http/, "ws")}/bots/${botId}/stream`;
}
