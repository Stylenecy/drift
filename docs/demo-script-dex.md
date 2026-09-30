# DRIFT — Demo Script (60–75 seconds)

## 1. CURRENT / PRE-DEPLOY SCRIPT (usable now, no own-deployment claims)

Total: ~70 seconds.

- 0–10s — Problem + architecture:
  "DRIFT studies four trading strategies. The Python engine does the research off-chain; BNB Chain stores a small public risk gate."
- 10–25s — MacroGuard transparency panel:
  Show `/dashboard/macroguard` reading the upstream reference contract on BSC Testnet chain 97.
  Point at: contract address, regime, halt flag, 20% drawdown limit, decision count. Open the BscScan address.
  Say: "This is the upstream reference contract, not a Dex deployment yet."
- 25–40s — Rules without claiming own txs:
  Explain the on-chain rules from source: RiskOff blocks Long; halted blocks everything except Flat.
  Do NOT show a Dex RiskOff transaction (none exists yet).
- 40–55s — Current limits:
  "The contract does not execute Bybit orders. The runner fails open if RPC is down. Live bot ticks and profitability are not verified."
- 55–65s — Evidence on screen:
  Show previously verified local evidence: `forge test` 7/7 result and web build with the new route.
  Label clearly as previously verified, not recorded live today.
- 65–70s — Close:
  "Dex contribution is the transparency panel and read-only state API. Own deployment and receipts are pending funds and approval."

## 2. FINAL / POST-DEPLOY SCRIPT (record only after evidence exists)

Placeholders must stay empty until real receipts exist. Never invent hashes.

- 0–10s — Problem + architecture:
  Same as pre-deploy. Show Python engine + MacroGuard diagram.
- 10–25s — Transparency panel on Dex contract:
  Show panel pointed at `<DEX_CONTRACT_ADDRESS>` on chain 97.
  Show regime, halt=false, maxDrawdownBps 2000, decision count. Open BscScan:
  `<DEX_CONTRACT_ADDRESS>`
- 25–40s — RiskOff blocks Long:
  Show `setRegime(RiskOff)` receipt `<RISKOFF_TX_HASH>` on BscScan.
  Refresh panel: Long blocked, Short/Flat allowed. Quote `allowed()` result.
- 40–55s — Drawdown breach halts:
  Show `recordDecision` breach receipt `<HALT_TX_HASH>` and `halted=true` on panel.
  Show only Flat allowed.
- 55–65s — Resume + Neutral:
  Show `resume()` receipt `<RESUME_TX_HASH>`, then `setRegime(Neutral)` receipt.
  Refresh panel to prove state changed. Deploy tx for reference: `<DEPLOY_TX_HASH>`.
- 65–75s — Honest boundary:
  "BNB Chain stores and enforces the public risk state; the Python runner and exchange execution remain off-chain. RPC fail-open behavior and unverified live trading are disclosed."

Suggested screenshots (final only): dashboard panel on Dex contract, BscScan contract page, deploy receipt, RiskOff receipt, halt receipt, resume receipt.

## Verified values (2026-09-30, BSC Testnet chain 97)

- `<DEX_CONTRACT_ADDRESS>` = `0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D`
- `<DEPLOY_TX_HASH>` = `0x2d8cce2de583424a45e8de176c1b79438cdf54f7a016ae0cfc6c4ca86078c044` (block 133995398)
- `<RISKOFF_TX_HASH>` = `0x563f1eee78fee6a0b532c6ae50ab5de05667e7d64bb573ddc21596b9d2376858` (block 134042196)
- safe decision tx = `0x7a5185e4beb1c51f6c1fcaeb7614df88a5dd72357caa38ab7e15956500ab4810` (block 134042256)
- `<HALT_TX_HASH>` = `0x8e346d74c06c53f2f8914c86c4be9e45c49ea99a54e41ece6fc53a018e3b62ef` (block 134042283)
- `<RESUME_TX_HASH>` = `0xda579ebbf2969b855fe50b4520593fb267e33f4db062e0c71c48ca64b18d18ae` (block 134042318)
- Neutral tx = `0xa846652354020a77b8c24ef8bb3e088ccecb63f4c2c3267c0a4377c57a39486b` (block 134042328)
- Final on-chain state: Neutral, not halted, Long allowed, 2 decisions
- BscScan base: `https://testnet.bscscan.com` (append `/address/...` or `/tx/...`)

## Manual recording runbook for Dex

1. Start backend: `cd drift/apps/trader && .venv/Scripts/python -m uvicorn app.main:app --port 3113` (already repointed at Dex contract via local `.env.local`)
2. Start web: `cd drift && npm install` (first time only) + `npm run dev`, open `/dashboard/macroguard`
3. Record 60–75s following FINAL script above; show panel refresh after each receipt; open each BscScan tx link on camera
4. Narrate the honest boundary (off-chain runner, fail-open RPC, no live-trading claims)
