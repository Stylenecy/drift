// node --test src/features/guard/chainRead.test.mjs
// Fixtures are the raw `cast call` results for Dex's MacroGuard on 2026-10-02
// (Neutral, not halted, 2000 bps, 2 decisions, Long/Short/Flat allowed).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readGuardFromChain, PUBLIC_RPCS, MACROGUARD_ADDRESS, MACROGUARD_AGENT } from "./chainRead.ts";

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
