# DRIFT — Portal Copy

Dex bisa copy-paste ke portal begitu submission form terbuka.
Hanya berisi fakta yang didukung evidence. Jangan klaim yang belum dieksekusi.

## Project name
DRIFT — MacroGuard Transparency

## One-line description
Quant trading research with a public BNB Chain risk state and decision trail.

## Short description
DRIFT is quant trading research with an off-chain Python engine and an on-chain risk gate. MacroGuard on BSC Testnet stores market regime, a drawdown halt, and successful decision records. The runner checks allowed() before orders. Dex added a read-only transparency panel and /guard/state API so judges can inspect the live risk state independently on BscScan.

## Full description
Problem: trading bots can hide risk settings and rewrite off-chain decision history, so users and judges cannot verify the risk gate independently. Solution: DRIFT keeps strategy research and exchange integration in an off-chain Python engine, and puts a small public risk gate on BNB Chain. MacroGuard on BSC Testnet stores a market regime (RiskOff/Neutral/RiskOn), a drawdown halt with a 20% threshold (maxDrawdownBps 2000), and successful decision records; the Python runner queries allowed() before sending orders. Role BNB Chain: contract state and successful decision transactions are publicly inspectable without backend access, while heavy compute stays off-chain. Dex contribution: read-only MacroGuard transparency panel at /dashboard/macroguard plus a /guard/state API that reads the live contract with no private key, and honest README corrections. Honest limitation: the contract does not execute Bybit orders; the runner fails open if RPC is unavailable under its local drawdown stop; no live Bybit bot tick or profitability has been verified in this fork. Dex-owned MacroGuard is deployed at 0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D (tx 0x2d8cce2de583424a45e8de176c1b79438cdf54f7a016ae0cfc6c4ca86078c044); smoke-test transactions are still pending.

## Track recommendation
Primary:
Finance & Commerce

Secondary if portal supports multiple tracks:
AI Agents

## Why BNB Chain
The risk state and successful decision records live on BSC Testnet where anyone can inspect them via BscScan without trusting DRIFT's backend. Off-chain research stays cheap and fast; only the small enforceable risk gate is on-chain.

## What Dex added
- Read-only MacroGuard transparency panel (`/dashboard/macroguard`) with regime, halt, drawdown limit, decision count, and BscScan link
- Read-only FastAPI `/guard/state` endpoint that reads the live BSC Testnet contract with no private key
- Plain-language signal explanation (Long/Short/Flat rules)
- Honest README/submission copy corrections (no live-trading or profitability claims)

## Existing upstream work
- Off-chain Python quant engine (four strategies, backtests, Bybit integration)
- MacroGuard Solidity contract and BNB migration
- Original dashboard and group/upstream BSC Testnet deployment
- Source: bcc-ukdw/seed-bnb/drift — not Dex's original work

## GitHub
Stylenecy/seed-bnb
branch dex/drift

## Contract
Status:
DEPLOYED — Dex-owned MacroGuard on BSC Testnet chain 97

Dex contract:
0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D
Deploy tx:
0x2d8cce2de583424a45e8de176c1b79438cdf54f7a016ae0cfc6c4ca86078c044
Block: 133995398. Receipt status 1. agent() matches deployer. maxDrawdownBps() 2000.

Upstream contract:
0x8F2CbB56Cc9A46EfC3997146369257Ff9450Fe5A
UPSTREAM / REFERENCE ONLY — NOT DEX DEPLOYMENT

## Demo status
PENDING

## Evidence currently available
- 7/7 contract tests verified in deployment session (forge 1.5.1, exit 0)
- Dex-owned MacroGuard deployed: 0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D, receipt status 1, agent and 2000 bps verified on-chain
- Web build previously verified; `/dashboard/macroguard` file present
- `/guard/state` previously verified reading upstream BSC Testnet state (chain 97); repoint to Dex contract pending smoke test
- MacroGuard transparency panel present in fork
- Honest README corrections applied
- Public Bybit backtest NOT VERIFIED due to api.bybit.com timeout
- Smoke-test transactions EXECUTED 2026-09-30: RiskOff, safe decision, breach/halt, resume, Neutral, unauthorized-revert — all receipts status 1 (see `deployment-dex.md`)
