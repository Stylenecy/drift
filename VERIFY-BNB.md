# DRIFT: BNB Chain verification

Run date: 2026-09-25. Local BSC Testnet fork (chain 97) only; no real-network writes. Accounts were anvil's public test accounts.

Verdict: **WORKS on fork.** MacroGuard deploys, and the Python engine reads and writes it on the fork. The web app builds and serves against the engine.

## Checks

| Check | Result | Notes |
|---|---|---|
| `forge build` / `forge test` | PASS | 7/7 |
| Deploy script on the BSC Testnet fork | PASS | `MAX_DRAWDOWN_BPS=2000 forge script script/Deploy.s.sol:Deploy --private-key <anvil0> --broadcast`. The contract has code, agent = deployer, maxDrawdownBps = 2000. |
| Core flow (cast) | PASS | `setRegime(RiskOff)` makes `allowed(Long)` false and `allowed(Short)` true. `recordDecision` at -5% dd: no halt. `recordDecision` at -25% dd: the `Halted` event fires, `halted` is true, only Flat is allowed, and decisionCount = 2. `resume` plus `setRegime(Neutral)` makes Long allowed again. A non-agent `setRegime` reverts with `NotAgent`. |
| Engine (FastAPI, `apps/trader`, Python 3.11 venv) | PASS | Pointed at the fork with `MACROGUARD_ADDRESS`, `ETH_PRIVATE_KEY` (anvil 0), `BSC_RPC_URL=http://127.0.0.1:8610` and `BSC_CHAIN_ID=97`. `/health` returns 200. `/chain` returns enabled, chain_id 97 and a testnet.bscscan link. `/regime` returned `on_chain: 1, synced: true` from the contract. `/strategies` returns 200. **Write path:** I set the on-chain regime to RiskOn with cast, and the engine's regime loop pushed it back to Neutral on its own with a `setRegime` tx. `app.chain.guard.record(...)` sent a `recordDecision` tx (legacy gasPrice, chainId 97) and decisionCount went up. CORS allows the web origin. |
| Web `tsc --noEmit` | PASS | |
| Web `next build` | PASS | 17 routes |
| Web run (`next start -p 3116`, `NEXT_PUBLIC_TRADER_URL` = engine) | PASS | `/`, `/blog`, `/blog/building-on-bnb-chain` and all 5 `/dashboard/*` routes return 200. `/login` returns 307 to `/dashboard` (auth disabled). There are 0 "Mantle" strings in the served HTML. The engine URL is inlined into the client bundle. |
| Address checks | PASS / N/A | There are no hard-coded token, router or feed addresses. The RPCs in `foundry.toml` and `config.py` return chain ids 97 (`data-seed-prebsc-1-s1`) and 56 (`bsc-dataseed`). |
| Leftover Mantle refs (repo grep) | PASS | Only `MIGRATION-BNB.md` mentions Mantle (history). |

## Bugs fixed

None needed. Everything passed as migrated.

## Notes

- The engine was verified on Python 3.11, the same version as the Dockerfile. The `./drift` launcher uses the system `python3`, which on this Mac is 3.9 and was not tested. Use 3.11 to match production.
- When `AUTH_GOOGLE_ID` is set in production, next-auth logs `UntrustedHost` on `/api/auth/session` unless `AUTH_TRUST_HOST=true` (or `AUTH_URL`) is set. This is config only, not chain related.
- `ChainGuard._send` uses a fixed gas of 200k and legacy `gasPrice`. Both are fine on BSC; `recordDecision` uses well under 200k.
- The guard fails open by design: if the RPC is down, bots still trade under the local drawdown stop. (Changed on 7 Oct 2026: the runner now records first and fails closed by default; see `docs/THREAT-MODEL.md`.)

## Remaining steps for a real BSC Testnet deploy

1. Fund the agent key (`ETH_PRIVATE_KEY`) with about **0.05 tBNB**. The deploy is about 0.4M gas, well under 0.001 BNB. Each bot tick sends a `recordDecision` tx of about 50–80k gas, so budget for ongoing ticks too. At 1 gwei that is about 0.00008 BNB per tick, and 0.05 tBNB covers about 600 ticks. Faucet: https://www.bnbchain.org/en/testnet-faucet
2. `cd contracts && MAX_DRAWDOWN_BPS=2000 forge script script/Deploy.s.sol:Deploy --rpc-url bsc_testnet --private-key $ETH_PRIVATE_KEY --broadcast`. Use the same key as the engine, because the deployer becomes the `agent`.
3. Set `MACROGUARD_ADDRESS` in `.env.local` or Railway. The defaults already target chain 97 and testnet.bscscan.
4. Web: set `NEXT_PUBLIC_TRADER_URL` to the engine URL, and set `ALLOWED_ORIGINS` on the engine to the web URL.
5. Fill in the address TODOs in `README.md` and `SHOWCASE.md`.

## Real BSC Testnet deploy

Run date: 2026-09-25. Real BSC Testnet (chain 97), RPC `https://bsc-testnet-rpc.publicnode.com`, gas price 0.1 gwei (legacy). The deployer and agent are the group wallet `0xE85f64383Fd58ddC0b7eC64EF1557317B91Ac0B1`. Not verified on BscScan because no `ETHERSCAN_API_KEY` was available.

- **MacroGuard:** [0x8F2CbB56Cc9A46EfC3997146369257Ff9450Fe5A](https://testnet.bscscan.com/address/0x8F2CbB56Cc9A46EfC3997146369257Ff9450Fe5A). Deploy tx [0xd5a98f89…6056](https://testnet.bscscan.com/tx/0xd5a98f89e24d30f1d828e50753d7146fad4aa078cd16af831dc81763b6d66056). `agent()` is the deployer and `maxDrawdownBps()` is 2000.
- **Command:** `MAX_DRAWDOWN_BPS=2000 forge script script/Deploy.s.sol:Deploy --rpc-url https://bsc-testnet-rpc.publicnode.com --private-key $ETH_PRIVATE_KEY --broadcast --with-gas-price 100000000 --legacy --slow`.
- **Records:** `contracts/broadcast/Deploy.s.sol/97/run-1790289952072.json` and `contracts/deployments/bsc-testnet.json` (`run-latest.json` now holds the later deployment `0x8b09…a83D`, see `docs/deployment-dex.md`). The addresses are also in `apps/trader/.env.bsc-testnet` and `apps/web/.env.bsc-testnet`, which are gitignored and hold no keys. `README.md` and `SHOWCASE.md` now link the address.

### Smoke flow (cast, all receipts status 1)

| Step | Tx | Result |
|---|---|---|
| `setRegime(RiskOff)` | [0x2ef7c028…f54f](https://testnet.bscscan.com/tx/0x2ef7c028dac1c3f9b872448e7a53011b9a6792b8d0f3228c1e2b8907ac06f54f) | `allowed(Long)` is false and `allowed(Short)` is true |
| `recordDecision(BNBUSDT, Short, -5% dd)` | [0x90ce4065…37f6](https://testnet.bscscan.com/tx/0x90ce4065711ce98d48cb2eb601a0068d4bb40fabd64f927f1ebe1ef36ced37f6) | no halt |
| `recordDecision(BNBUSDT, Flat, -25% dd)` | [0x4b9b0379…1701](https://testnet.bscscan.com/tx/0x4b9b0379eb0835fbd87c85b5c08e10b636ac8814cb9f9b90a0abdeeb88d21701) | `Halted` event. `halted` is true, only Flat is allowed, and decisionCount is 2 |
| `resume()` | [0x42d3f85f…5b70](https://testnet.bscscan.com/tx/0x42d3f85fced0679dd27fde647265c24cbddcef0b0d6892e05b268802b1965b70) | `halted` is false |
| `setRegime(Neutral)` | [0x9f05d9ce…908b](https://testnet.bscscan.com/tx/0x9f05d9ce0cc7e0a56ff3d75a3593e4b210d595b004e5bddc19c0d5fbca72908b) | `allowed(Long)` is true |
| Non-agent `setRegime` (eth_call) | n/a | reverts with `NotAgent()` (0x0d9ab13f) |

### Python engine against the live contract

The engine is `apps/trader` running on Python 3.11 in a venv outside the repo, started with `uvicorn app.main:app --port 3113`. `MACROGUARD_ADDRESS`, `ETH_PRIVATE_KEY` (the agent key, passed through the process env only), `BSC_RPC_URL` (publicnode) and `BSC_CHAIN_ID=97` were set.

- **Read:** `/health` returned 200. `/chain` returned `enabled: true`, chain_id 97 and the testnet.bscscan address link. `/regime` returned `{"regime":1,"label":"neutral",…,"on_chain":1,"synced":true}`, read from the contract.
- **Write (regime loop):** I set the on-chain regime to RiskOn with cast ([0xda1845ee…a318](https://testnet.bscscan.com/tx/0xda1845eec6aa454a79d6ec764207998142f3aa8e0daa3220044f052607a4a318)). I then restarted the engine with `REGIME_POLL_SECONDS=20`. On its own, the engine sent `setRegime(Neutral)` from web3.py ([0x0630981c…7b31](https://testnet.bscscan.com/tx/0x0630981c8e7717d4e6f78c9ba3b178fba7ed5eab7c8a5bddf84c063192c67b31)), and `/regime` returned `synced: true` again.
- **Write (decision log):** `app.chain.guard.record("BNBUSDT", +1, 612.34, -0.012)` sent `recordDecision` ([0x2d76d8f2…9cd6](https://testnet.bscscan.com/tx/0x2d76d8f2458d855cf507fcc9d0e607124e417fabfb1d823b48ffba7a46ba9cd6)). `decisionCount` went from 2 to 3. `guard.allowed(1)` returned true.

### Web

`next build` passed with `NEXT_PUBLIC_TRADER_URL=http://localhost:3113`, producing 17 routes. `next start -p 3114` served these routes with 200: `/`, `/blog`, `/blog/building-on-bnb-chain` and `/dashboard` plus `/dashboard/{backtest,bots,connection,portfolio}`. `/login` returned 307. The engine URL is inlined in the client bundle. The engine's CORS header allows `http://localhost:3114`. Both servers were then stopped.

### Gas

The deploy plus 8 txs (6 from cast, 2 from the engine) cost **0.0000688 tBNB** at 0.1 gwei.

### What works live

The deploy, the regime veto, the drawdown halt and resume, the agent-only guard, and the engine's read path (`/chain`, `/regime`). Both engine write paths also work: the autonomous `setRegime` sync and `recordDecision`.

### What's left

- BscScan source verification (needs `ETHERSCAN_API_KEY`).
- Production env: set `MACROGUARD_ADDRESS` and the agent key in Railway, and fund the agent for ongoing ticks. Each `recordDecision` costs about 33k gas, or about 0.0000033 tBNB at 0.1 gwei.
- `contracts/foundry.toml` still defaults `bsc_testnet` to `data-seed-prebsc-1-s1`, which rejects `eth_getLogs`. It is fine for deploys, but use publicnode for log queries.
- Live Bybit bot ticks were not exercised; they need Bybit testnet keys.
