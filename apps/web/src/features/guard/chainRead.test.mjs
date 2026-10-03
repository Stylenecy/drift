// node --test src/features/guard/chainRead.test.mjs
// Fixtures are the raw `cast call` results for Dex's MacroGuard on 2026-10-02
// (Neutral, not halted, 2000 bps, 2 decisions, Long/Short/Flat allowed).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readGuardFromChain,
  askRecordDecision,
  encodeRecordDecision,
  expectDecision,
  castCommand,
  PUBLIC_RPCS,
  MACROGUARD_ADDRESS,
  MACROGUARD_AGENT,
} from "./chainRead.ts";

const pad = (n) => `0x${n.toString(16).padStart(64, "0")}`;

const CALLS = {
  "0xc70931d9": pad(1), // regime() -> Neutral
  "0xb9b8af0b": pad(0), // halted() -> false
  "0x5661d461": pad(2000), // maxDrawdownBps()
  "0x100b63cb": pad(2), // decisionCount()
  "0xf5ff5c76": "0x0000000000000000000000002b07afb54068042664074781af36163ac6714b81", // agent()
  [`0xba795b85${"0".repeat(64)}`]: pad(1), // allowed(Flat)
  [`0xba795b85${"0".repeat(63)}1`]: pad(1), // allowed(Long)
  [`0xba795b85${"0".repeat(63)}2`]: pad(1), // allowed(Short)
};

// A fake JSON-RPC endpoint. `overrides` swaps the answer for one method or call data.
function rpc(overrides = {}) {
  return (body) => {
    const { method, params } = body;
    const key = method === "eth_call" ? params[0].data : method;
    if (key in overrides) return overrides[key];
    switch (method) {
      case "eth_chainId":
        return { result: "0x61" };
      case "eth_getCode":
        return { result: "0x6080604052" };
      case "eth_blockNumber":
        return { result: "0x802a7bd" };
      case "eth_call":
        assert.equal(params[0].to, MACROGUARD_ADDRESS);
        return { result: CALLS[params[0].data] };
      default:
        return { error: { message: `unexpected ${method}` } };
    }
  };
}

function fakeFetch(byUrl) {
  const seen = [];
  const fetchImpl = async (url, init) => {
    seen.push(url);
    const handler = byUrl[url];
    if (!handler) throw new TypeError(`network error: ${url}`);
    const body = JSON.parse(init.body);
    const reply = handler(body);
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, ...reply }), { status: 200 });
  };
  return { fetchImpl, seen };
}

const [PRIMARY, BACKUP] = PUBLIC_RPCS;

test("maps the 2 Oct contract state from the primary RPC", async () => {
  const { fetchImpl, seen } = fakeFetch({ [PRIMARY]: rpc() });
  const read = await readGuardFromChain({ fetchImpl });
  assert.equal(read.block, 0x802a7bd);
  assert.equal(read.rpc, new URL(PRIMARY).host);
  assert.deepEqual(read.state, {
    connected: true,
    address: MACROGUARD_ADDRESS,
    chain_id: 97,
    explorer: "https://testnet.bscscan.com",
    agent: MACROGUARD_AGENT,
    regime: 1,
    halted: false,
    max_drawdown_bps: 2000,
    decision_count: 2,
    allowed: { flat: true, long: true, short: true },
    error: null,
  });
  assert.ok(seen.every((url) => url === PRIMARY), "backup RPC is not touched when the primary answers");
});

test("falls back to the backup RPC when the primary returns malformed hex", async () => {
  const { fetchImpl, seen } = fakeFetch({
    [PRIMARY]: rpc({ "0x5661d461": { result: "0x7d0" } }),
    [BACKUP]: rpc(),
  });
  const read = await readGuardFromChain({ fetchImpl });
  assert.equal(read.rpc, new URL(BACKUP).host);
  assert.equal(read.state.max_drawdown_bps, 2000);
  assert.ok(seen.includes(PRIMARY) && seen.includes(BACKUP));
});

test("rejects when every RPC reverts the call", async () => {
  const revert = { "0xc70931d9": { error: { message: "execution reverted" } } };
  const { fetchImpl } = fakeFetch({ [PRIMARY]: rpc(revert), [BACKUP]: rpc(revert) });
  await assert.rejects(readGuardFromChain({ fetchImpl }), /execution reverted/);
});

test("rejects a node on the wrong chain", async () => {
  const wrongChain = { eth_chainId: { result: "0x38" } };
  const { fetchImpl, seen } = fakeFetch({ [PRIMARY]: rpc(wrongChain), [BACKUP]: rpc(wrongChain) });
  await assert.rejects(readGuardFromChain({ fetchImpl }), /wrong chain 56, expected 97/);
  // Nothing past eth_chainId is asked of a node on the wrong chain.
  assert.equal(seen.length, 2);
});

test("rejects when there is no code at the address", async () => {
  const empty = { eth_getCode: { result: "0x" } };
  const { fetchImpl } = fakeFetch({ [PRIMARY]: rpc(empty), [BACKUP]: rpc(empty) });
  await assert.rejects(readGuardFromChain({ fetchImpl }), /no contract code/);
});

test("rejects a bool that is neither 0 nor 1", async () => {
  const bad = { "0xb9b8af0b": { result: pad(7) } };
  const { fetchImpl } = fakeFetch({ [PRIMARY]: rpc(bad), [BACKUP]: rpc(bad) });
  await assert.rejects(readGuardFromChain({ fetchImpl }), /halted is not a bool/);
});

test("reports both failures when both RPCs are unreachable", async () => {
  const { fetchImpl } = fakeFetch({});
  await assert.rejects(readGuardFromChain({ fetchImpl }), (error) => {
    assert.match(error.message, /public RPC read failed/);
    assert.match(error.message, new RegExp(new URL(PRIMARY).host.replace(/\./g, "\\.")));
    assert.match(error.message, new RegExp(new URL(BACKUP).host.replace(/\./g, "\\.")));
    return true;
  });
});

/* ------------------------------------------- "Ask the contract" (eth_call) -- */

// `cast calldata "recordDecision(string,uint8,uint256,int256)" -- BTCUSDT 1 0 -2500` (cast 1.5.1)
const CALLDATA_LONG_2500 =
  "0x210f3f4f" +
  "0000000000000000000000000000000000000000000000000000000000000080" +
  "0000000000000000000000000000000000000000000000000000000000000001" +
  "0000000000000000000000000000000000000000000000000000000000000000" +
  "fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff63c" +
  "0000000000000000000000000000000000000000000000000000000000000007" +
  "4254435553445400000000000000000000000000000000000000000000000000";
// `... -- BTCUSDT 2 0 -1999`
const CALLDATA_SHORT_1999 =
  "0x210f3f4f" +
  "0000000000000000000000000000000000000000000000000000000000000080" +
  "0000000000000000000000000000000000000000000000000000000000000002" +
  "0000000000000000000000000000000000000000000000000000000000000000" +
  "fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff831" +
  "0000000000000000000000000000000000000000000000000000000000000007" +
  "4254435553445400000000000000000000000000000000000000000000000000";
// `... -- BTCUSDT 0 0 0`
const CALLDATA_FLAT_0 =
  "0x210f3f4f" +
  "0000000000000000000000000000000000000000000000000000000000000080" +
  "0".repeat(64 * 3) +
  "0000000000000000000000000000000000000000000000000000000000000007" +
  "4254435553445400000000000000000000000000000000000000000000000000";

// A fake node that answers recordDecision with `answer` and records every method it saw.
function decisionRpc(answer, methods = []) {
  return (body) => {
    methods.push(body.method);
    if (body.method === "eth_call") return answer(body.params[0]);
    return rpc()(body);
  };
}

test("encodes recordDecision byte for byte like cast calldata", () => {
  assert.equal(encodeRecordDecision("BTCUSDT", "long", 0n, -2500), CALLDATA_LONG_2500);
  assert.equal(encodeRecordDecision("BTCUSDT", "flat", 0n, 0), CALLDATA_FLAT_0);
  assert.equal(encodeRecordDecision("BTCUSDT", "short", 0n, -1999), CALLDATA_SHORT_1999);
});

test("refuses inputs the encoder cannot represent honestly", () => {
  assert.throws(() => encodeRecordDecision("btc", "long", 0n, 0), /symbol/);
  assert.throws(() => encodeRecordDecision("BTCUSDT", "hold", 0n, 0), /unknown signal/);
  assert.throws(() => encodeRecordDecision("BTCUSDT", "long", 0n, -12.5), /whole number/);
  assert.throws(() => encodeRecordDecision("BTCUSDT", "long", 0n, -20000), /between/);
});

test("asks with an eth_call from the agent and never sends a transaction", async () => {
  const methods = [];
  let sent;
  const { fetchImpl } = fakeFetch({
    [PRIMARY]: decisionRpc((tx) => {
      sent = tx;
      return { result: pad(0) };
    }, methods),
  });
  const answer = await askRecordDecision({ signal: "long", drawdownBps: -2500 }, { fetchImpl });
  assert.equal(answer.allowed, false);
  assert.equal(answer.block, 0x802a7bd);
  assert.equal(answer.rpc, new URL(PRIMARY).host);
  assert.deepEqual(sent, { from: MACROGUARD_AGENT, to: MACROGUARD_ADDRESS, data: CALLDATA_LONG_2500 });
  assert.deepEqual(answer.call, sent);
  assert.ok(methods.every((m) => ["eth_chainId", "eth_blockNumber", "eth_call"].includes(m)), methods.join(","));
});

test("maps an allowed answer and falls back when the primary node fails", async () => {
  const { fetchImpl, seen } = fakeFetch({
    [PRIMARY]: decisionRpc(() => ({ error: { message: "header not found" } })),
    [BACKUP]: decisionRpc(() => ({ result: pad(1) })),
  });
  const answer = await askRecordDecision({ signal: "flat", drawdownBps: -2500 }, { fetchImpl });
  assert.equal(answer.allowed, true);
  assert.equal(answer.rpc, new URL(BACKUP).host);
  assert.ok(seen.includes(PRIMARY) && seen.includes(BACKUP));
});

test("names a NotAgent revert instead of guessing an answer", async () => {
  const revert = () => ({ error: { code: 3, message: "execution reverted", data: "0x0d9ab13f" } });
  const { fetchImpl } = fakeFetch({ [PRIMARY]: decisionRpc(revert), [BACKUP]: decisionRpc(revert) });
  await assert.rejects(askRecordDecision({ signal: "long", drawdownBps: 0 }, { fetchImpl }), (error) => {
    assert.match(error.message, /public RPC call failed/);
    assert.match(error.message, /execution reverted: NotAgent\(\)/);
    return true;
  });
});

test("rejects an answer that is not a bool, and a node on the wrong chain", async () => {
  const notBool = decisionRpc(() => ({ result: pad(2) }));
  const bad = fakeFetch({ [PRIMARY]: notBool, [BACKUP]: notBool });
  await assert.rejects(askRecordDecision({ signal: "short", drawdownBps: -100 }, { fetchImpl: bad.fetchImpl }), /recordDecision is not a bool/);

  const wrong = (body) => (body.method === "eth_chainId" ? { result: "0x38" } : { result: pad(1) });
  const wrongChain = fakeFetch({ [PRIMARY]: wrong, [BACKUP]: wrong });
  await assert.rejects(askRecordDecision({ signal: "flat", drawdownBps: 0 }, { fetchImpl: wrongChain.fetchImpl }), /wrong chain 56/);
  assert.equal(wrongChain.seen.length, 2, "no eth_call is sent to a node on the wrong chain");
});

test("expectDecision applies the contract's rules in the contract's order", () => {
  const neutral = { regime: 1, halted: false, maxDrawdownBps: 2000 };
  const riskOff = { regime: 0, halted: false, maxDrawdownBps: 2000 };
  const halted = { regime: 1, halted: true, maxDrawdownBps: 2000 };
  const cases = [
    // [rules, signal, drawdownBps, allowed, haltsNow] — boundary mirrors MacroGuard.t.sol (-1999 vs -2000)
    [neutral, "long", -1999, true, false],
    [neutral, "long", -2000, false, true],
    [neutral, "flat", -2500, true, true],
    [neutral, "short", -500, true, false],
    [riskOff, "long", -500, false, false],
    [riskOff, "short", -500, true, false],
    [riskOff, "long", -2500, false, true],
    [halted, "short", 0, false, false],
    [halted, "flat", -2500, true, false],
  ];
  for (const [rules, signal, drawdownBps, allowed, haltsNow] of cases) {
    assert.deepEqual(expectDecision(rules, { signal, drawdownBps }), { allowed, haltsNow }, `${signal} @ ${drawdownBps}`);
  }
});

test("prints the same question as a replayable cast command", () => {
  assert.equal(
    castCommand({ signal: "long", drawdownBps: -2500 }),
    `cast call ${MACROGUARD_ADDRESS} "recordDecision(string,uint8,uint256,int256)(bool)" ` +
      `--from ${MACROGUARD_AGENT} --rpc-url ${BACKUP} -- BTCUSDT 1 0 -2500`,
  );
});
