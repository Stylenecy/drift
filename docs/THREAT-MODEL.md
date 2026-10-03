# DRIFT · MacroGuard threat model

Updated 2026-10-03 · Scope: Dex's MacroGuard deployment
[`0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D`](https://testnet.bscscan.com/address/0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D)
(BSC Testnet, chain 97; source verified on [Sourcify](https://repo.sourcify.dev/97/0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D), exact match),
the engine's `ChainGuard` client (`apps/trader/app/chain.py`), the live runner (`apps/trader/app/live.py`)
and the public panel (`/macroguard`). The contract source is unchanged from upstream commit `52671ce`.

MacroGuard is a **public risk gate and decision log**, not a custody or execution layer. It holds no
funds and cannot place, block or cancel an exchange order. Its value is that the rules and the record
are public and checkable; its limits are listed here so nobody has to discover them.

## Actors

| Actor | Can | Cannot |
|---|---|---|
| Agent key `0x2B07…4b81` (one EOA, set at deploy) | `setRegime`, `recordDecision`, `resume` | Change `agent` or `maxDrawdownBps` (both fixed at deploy) |
| Anyone else | Read every value; simulate any call with `eth_call` | Write: every state-changing call reverts with `NotAgent()` |
| Runner operator (whoever runs `apps/trader`) | Choose what the runner reports and when it calls the contract | Make the contract execute or stop an exchange order |
| Public RPC providers | Answer reads for the panel | Sign anything (the panel has no signer) |

## Properties, mechanisms and limits

| Property | Mechanism | Limit | Mitigation now · roadmap |
|---|---|---|---|
| Only the agent writes | `onlyAgent` modifier; `agent` is `immutable` | A single EOA. If the key leaks, the holder controls regime, records and `resume()` | Fuzzed and invariant-tested (`testFuzz_NobodyButTheAgentCanWrite`, `invariant_StrangersNeverWrite`) · roadmap: multisig or timelock for `resume`/`setRegime`, key in a hardware signer |
| A drawdown at or past the limit halts | `recordDecision` sets `halted` when `drawdownBps <= -maxDrawdownBps` (2000 bps) | The drawdown is **self-reported** by the agent; the contract cannot see the exchange account. A buggy or dishonest runner can report 0 | Boundary tested (−1999 vs −2000) · roadmap: attested equity (signed exchange snapshots or an oracle) |
| A halt allows only Flat | `allowed()` returns `signal == Flat` while halted | `resume()` clears the halt at once, with no delay and no second signer. A halt is a recorded pause, not a lock | `Resumed` is logged on-chain · roadmap: timelock on `resume` |
| Risk off vetoes new Longs | `allowed()` returns `signal != Long` in `RiskOff` | The regime is classified **off-chain** (BTC 1h realised-vol z-score + EWMA trend) and pushed by the agent; the contract trusts it | `RegimeSet` is logged · roadmap: EIP-712 signed regime verdicts with a hash of their inputs |
| The runner checks the gate before ordering | `ChainGuard.allowed()` before every order | **Fails open**: if the RPC is unreachable or errors, the runner trades under its local drawdown stop only | Pinned by `test_allowed_fails_open_when_the_rpc_is_down`; shown on the panel · roadmap: a fail-closed mode |
| Every decision is on the public record | `Decision` event and `decisionCount` | The record holds what the agent sends. The runner records the **post-veto** target, so a vetoed Long appears as Flat (allowed). Failed or skipped writes leave no record. Records are not linked to exchange fills | Pinned by `test_runner_records_the_post_veto_target` · roadmap: record the raw signal plus a veto flag; commit-then-attest hashes of fills |
| The panel shows the real contract | Contract address and RPC URLs are code constants (`chainRead.ts`); chain id and code are checked; nothing in the URL or storage can redirect it | The panel trusts the first public RPC that answers; a lying RPC could show false state | Every value links to BscScan; the what-if shows a `cast call` to replay · roadmap: cross-check two RPCs |
| The what-if cannot write | `eth_call` of `recordDecision` from the agent address; the browser holds no key | The answer is for the state at the block read; the next real decision can see a different state | Labelled "simulation" in the UI; the answer shows its block |
| Bad inputs are rejected | Solidity's ABI decoder rejects enum values above 2 | — | Fuzzed (`testFuzz_OutOfRangeSignalIsRejected`) |
| The halt threshold is sane | Set once in the constructor (2000 bps on this deployment) | Not validated: `maxDrawdownBps = 0` would halt on the first non-positive drawdown; it cannot be changed after deploy | Tested (`test_ZeroThresholdHaltsOnTheFirstNonPositiveDrawdown`) · roadmap: bounded constructor argument |
| The engine API stays private | The engine runs on the operator's machine; the hosted demo never calls it | Mutating endpoints (`POST /bots`, `/connection`, `/telegram`, `DELETE /bots/{id}`) have no auth | Never deployed or tunnelled · roadmap: auth before any hosting |
| Market data is labelled | `source` on every frame and response (`bybit`, or `binance` on fallback) | Binance spot candles differ slightly from Bybit perpetuals | Live trading never uses fallback data; orders go to Bybit testnet only |

**A note on the contract's own comment.** The NatSpec in `MacroGuard.sol` says the rules live on-chain
"where the bot itself cannot override them". That overstates it: the agent key can `resume()` and
`setRegime()` at any time. The comment is upstream text and stays as it is, because the verified source
must remain byte-identical; this document is the correction.

## Known issues found while testing

- **Upstream bug:** `BNBUSDT` is listed twice in `MARKET_SYMBOLS` (`apps/trader/app/main.py`,
  `apps/trader/app/cli.py`), so `/markets` and the terminal show it twice. Pinned by a strict `xfail`
  test (`tests/test_known_limits.py`) and left unfixed here.
- **Design limit:** the post-veto record described above.

## Out of scope

Mainnet and real funds, profitability, exchange-side risk (Bybit outages, fills, fees), the LLM analyst
(advisory only, never in the trade loop) and the Telegram bot's own security.

## Check it yourself

```bash
# Read the gate (no key, no gas)
cast call 0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D "allowed(uint8)(bool)" 1 --rpc-url https://bsc-testnet-rpc.publicnode.com

# Simulate a decision at -25% from the agent address: false (it would halt first)
cast call 0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D "recordDecision(string,uint8,uint256,int256)(bool)" \
  --from 0x2B07AfB54068042664074781Af36163aC6714b81 --rpc-url https://bsc-testnet-rpc.publicnode.com -- BTCUSDT 1 0 -2500

# The same call from any other address reverts with NotAgent() (0x0d9ab13f)
cast call 0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D "setRegime(uint8)" 2 \
  --from 0x000000000000000000000000000000000000dEaD --rpc-url https://bsc-testnet-rpc.publicnode.com

# Tests: contract, engine (offline), web
cd contracts && forge test
cd apps/trader && python -m pytest
cd apps/web && npm test
```
