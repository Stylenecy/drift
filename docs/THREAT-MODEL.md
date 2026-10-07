# DRIFT · MacroGuard threat model

Updated 2026-10-07 · Scope: Dex's MacroGuard deployment
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
| Runner operator (whoever runs `apps/trader`) | Choose what the runner reports, run a modified runner, or switch to `MACROGUARD_FAIL_MODE=open` | Make the contract execute or stop an exchange order |
| Public RPC providers | Answer reads for the panel | Sign anything (the panel has no signer) |

## Properties, mechanisms and limits

| Property | Mechanism | Limit | Mitigation now · roadmap |
|---|---|---|---|
| Only the agent writes | `onlyAgent` modifier; `agent` is `immutable` | A single EOA. If the key leaks, the holder controls regime, records and `resume()` | Fuzzed and invariant-tested (`testFuzz_NobodyButTheAgentCanWrite`, `invariant_StrangersNeverWrite`) · roadmap: multisig or timelock for `resume`/`setRegime`, key in a hardware signer |
| A drawdown at or past the limit halts | `recordDecision` sets `halted` when `drawdownBps <= -maxDrawdownBps` (2000 bps) | The drawdown is **self-reported** by the agent; the contract cannot see the exchange account. A buggy or dishonest runner can report 0 | Boundary tested (−1999 vs −2000) · roadmap: attested equity (signed exchange snapshots or an oracle) |
| A halt allows only Flat | `allowed()` returns `signal == Flat` while halted | `resume()` clears the halt at once, with no delay and no second signer. A halt is a recorded pause, not a lock | `Resumed` is logged on-chain · roadmap: timelock on `resume` |
| Risk off vetoes new Longs | `allowed()` returns `signal != Long` in `RiskOff` | The regime is classified **off-chain** (BTC 1h realised-vol z-score + EWMA trend) and pushed by the agent; the contract trusts it | `RegimeSet` is logged; only a regime classified from Bybit data is pushed (`should_push_regime`) · roadmap: EIP-712 signed regime verdicts with a hash of their inputs |
| The runner asks before it orders | Since 7 Oct 2026: the runner measures the drawdown first, then `ChainGuard.decide()` records the bot's intent with `recordDecision` and the runner acts on the `allowed` field of that receipt's `Decision` event | **Cooperative**: the contract cannot force a bot to ask; a modified runner, or a second bot on the same exchange account, can trade without it. No confirmed answer (RPC down, tx failed or reverted) means only Flat passes (fail-closed, the default); `MACROGUARD_FAIL_MODE=open` restores the earlier fail-open behaviour | Tested (`test_the_loss_is_checked_before_any_new_order`, `test_an_allowed_intent_is_recorded_before_the_order`, `test_without_a_confirmed_answer_the_runner_holds_flat`, `test_decide_acts_on_the_answer_in_the_receipt` on two real receipts, `test_a_reverted_transaction_is_not_a_receipt`) · roadmap: exchange-side limits (sub-account permissions) and attested fills |
| Every decision is on the public record | `Decision` event and `decisionCount` | The record holds what the agent sends. Since 7 Oct 2026 the runner records the bot's own intent, so a vetoed Long appears as Long with `allowed = false`. A failed write leaves no record (and, fail-closed, no new trade). Records are not linked to exchange fills | Tested (`test_a_blocked_intent_stays_on_the_record_as_the_bots_own_signal`) · roadmap: commit-then-attest hashes of fills |
| The panel shows the real contract | Contract address and RPC URLs are code constants (`chainRead.ts`); chain id and code are checked; nothing in the URL or storage can redirect it | The panel trusts the first public RPC that answers; a lying RPC could show false state | Every value links to BscScan; the what-if shows a `cast call` to replay · roadmap: cross-check two RPCs |
| The what-if cannot write | `eth_call` of `recordDecision` from the agent address; the browser holds no key | The answer is for the state at the block read; the next real decision can see a different state | Labelled "simulation" in the UI; the answer shows its block |
| Bad inputs are rejected | Solidity's ABI decoder rejects enum values above 2 | — | Fuzzed (`testFuzz_OutOfRangeSignalIsRejected`) |
| The halt threshold is sane | Set once in the constructor (2000 bps on this deployment) | Not validated: `maxDrawdownBps = 0` would halt on the first non-positive drawdown; it cannot be changed after deploy | Tested (`test_ZeroThresholdHaltsOnTheFirstNonPositiveDrawdown`) · roadmap: bounded constructor argument |
| The engine API stays private | The engine runs on the operator's machine; the hosted demo never calls it | Mutating endpoints (`POST /bots`, `/connection`, `/telegram`, `DELETE /bots/{id}`) have no auth | Never deployed or tunnelled · roadmap: auth before any hosting |
| Market data is labelled | `source` on every frame and response (`bybit`, or `binance` on fallback); the fallback fires only when Bybit is unreachable, never to replace an error answer | Binance spot candles differ slightly from Bybit perpetuals | Live trading never uses fallback data, and a regime classified from it is never written on-chain (pinned by `test_a_regime_from_fallback_data_is_never_written_on_chain`); orders go to Bybit testnet only |

**A note on the contract's own comment.** The NatSpec in `MacroGuard.sol` says the rules live on-chain
"where the bot itself cannot override them". That overstates it: the agent key can `resume()` and
`setRegime()` at any time. The comment is upstream text and stays as it is, because the verified source
must remain byte-identical; this document is the correction.

## Known issues found while testing

- **Upstream bug:** `BNBUSDT` is listed twice in `MARKET_SYMBOLS` (`apps/trader/app/main.py`,
  `apps/trader/app/cli.py`), so `/markets` and the terminal show it twice. Pinned by a strict `xfail`
  test (`tests/test_known_limits.py`) and left unfixed here.
- **Fixed on 7 Oct 2026:** the runner used to place its order first and only then measure the loss and
  write the record, so one order could go out on a stale drawdown, and it recorded a vetoed signal as
  Flat. It now measures first, records the intent, and acts on that receipt (`tests/test_live_runner.py`).

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

# A write from any other address reverts with NotAgent() (0x0d9ab13f)
cast call 0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D "setRegime(uint8)" 2 \
  --from 0x000000000000000000000000000000000000dEaD --rpc-url https://bsc-testnet-rpc.publicnode.com

# Tests: contract, engine (offline), web
cd contracts && forge test
cd apps && python -m pytest trader/tests -c trader/pytest.ini
cd apps/web && npm test
```
