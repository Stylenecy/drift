# DRIFT — Indonesia Web3 Hackathon 2026 submission draft

Status: **draft, not submitted** · Updated 2026-09-29 · Deadline date: 2026-09-30 (exact time zone/clock not confirmed by the public event page)

## Source and contribution

- Base project: [`bcc-ukdw/seed-bnb/drift`](https://github.com/bcc-ukdw/seed-bnb/tree/main/drift), commit `52671ce`, including the quant engine, web app, MacroGuard contract, and BNB migration. Do not present these as Dex's original work.
- Dex fork and contribution: [`Stylenecy/seed-bnb`, branch `dex/drift`](https://github.com/Stylenecy/seed-bnb/tree/dex/drift), commit `a22b057`: read-only MacroGuard transparency panel and `/guard/state` API, plus honest copy corrections.
- Own BSC Testnet deployment: **DEPLOYED 2026-09-30** — Dex contract `0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D`, deploy tx `0x2d8cce2de583424a45e8de176c1b79438cdf54f7a016ae0cfc6c4ca86078c044`, block 133995398, receipt status 1, agent() matches Dex deployer, maxDrawdownBps() 2000. The upstream contract in `contracts/deployments/bsc-testnet.json` belongs to the migration team's wallet; it is not Dex's deployment.

## Submission copy

**Name:** DRIFT — MacroGuard Transparency

**One line:** Quant trading research with a public BNB Chain risk state and decision trail.

**Problem:** Trading bots can hide their risk settings and change an off-chain decision history. Users and judges need a way to inspect the risk gate independently.

**Solution:** DRIFT runs strategy research and exchange integration in Python. Its Solidity MacroGuard on BSC Testnet stores a market regime, a drawdown halt, and successful decision records. The Python runner checks `allowed()` before orders. Dex's new dashboard panel reads the actual contract, shows the current rules for Long/Short/Flat, and links to BscScan.

**Why BNB Chain:** The contract state and successful decision transactions are publicly inspectable without access to DRIFT's backend. Compute-heavy research stays off-chain.

**Honest boundary:** The contract does not execute Bybit orders. The runner currently fails open if the RPC is unavailable, under its local drawdown stop. The agent can call `resume()`. No live Bybit bot tick or profitability claim has been verified in this fork.

## Evidence available now

Build/test re-verified in the deployment session with Foundry 1.5.1
(discovered at `$env:USERPROFILE\.foundry\bin`, not via PATH).

| Item | Result |
|---|---|
| `forge build` | Verified this session: exit 0 (Solc 0.8.24, compilation cached; 2 style lint notes only) |
| `forge test -vv` | Verified this session: 7 passed, 0 failed |
| `npm run build` | Previously verified: passed; `/dashboard/macroguard` present. File confirmed present: `apps/web/src/app/dashboard/macroguard/page.tsx` |
| FastAPI `/health`, `/chain`, `/strategies` | Previously verified: HTTP 200 locally; not re-run in this session |
| New `/guard/state` | Previously verified: HTTP 200 reading upstream BSC Testnet contract with no private key; chain 97, Neutral, not halted, 20% threshold, 3 decisions at test time. Route present: `apps/trader/app/main.py`. Repoint at Dex contract pending smoke test |
| Backtest on public Bybit data | NOT VERIFIED: HTTP 502 locally because `api.bybit.com` timed out |
| Dex own deploy and transaction receipts | DEPLOYED: contract `0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D`, tx `0x2d8cce2de583424a45e8de176c1b79438cdf54f7a016ae0cfc6c4ca86078c044`, block 133995398, status 1, gas 449207 at 0.1 gwei (~0.0000449207 tBNB). Smoke-test txs still PENDING |
| Demo video | PENDING |

## 75-second demo outline

1. **0–10s:** “DRIFT studies four trading strategies. The Python engine does the research; BNB Chain stores a small public risk gate.”
2. **10–25s:** Show the MacroGuard panel: network 97, contract address, regime, halt, drawdown limit, and decision count. Open the BscScan address.
3. **25–50s:** On Dex's own deployed contract, show a RiskOff state and that Long is blocked while Short/Flat remain allowed. Show the successful transaction on BscScan. **Record only after this has actually been executed.**
4. **50–65s:** Show the drawdown halt and `resume()` receipts, if executed, then refresh the panel to prove state changed.
5. **65–75s:** State the boundary: the exchange bot is off-chain; the contract's successful decisions are independently inspectable; the RPC fail-open behavior and untested live bot are disclosed.

Suggested screenshots: dashboard panel, BscScan contract address, two transaction receipts (RiskOff and Halted), local `forge test` result.

## Portal checklist

Portal FAQ: <https://indonesiaweb3hack.xyz/en/faq>. Public event page: <https://luma.com/pcc699dv>.

- [ ] Dex/team registered on Luma (portal says submission counts only with Luma registration).
- [ ] Portal profile complete, GitHub connected, and team created or joined; the team leader submits.
- [ ] Team name and members confirmed by Dex; only consenting members listed.
- [ ] Track selection confirmed: Finance & Commerce, optionally AI Agents if the team chooses.
- [ ] Own BSC Testnet contract address resolves on BscScan; add address and deploy receipt here.
- [x] Public GitHub fork/branch is available under Stylenecy.
- [ ] Pitch deck and demo video prepared; exact form requirements checked after profile/team unlock.
- [ ] Submit in portal and verify the project appears under My Projects and public Projects.
- [ ] Save the portal edit code privately; do not commit it.

## Remaining before final submission

- [x] Fund Dex BSC Testnet wallet (0.1 tBNB received, tx 0x2f2326086fc0d8b234e500a105afd68a7b31c33b25ce128ace52dcda5e03e157, receipt status 1)
- [x] Deploy Dex-owned MacroGuard (BSC Testnet, chain 97, maxDrawdownBps 2000) with Dex approval (contract 0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D, tx 0x2d8cce2de583424a45e8de176c1b79438cdf54f7a016ae0cfc6c4ca86078c044)
- [x] Run on-chain smoke test (RiskOff, halt, resume, unauthorized-caller check) — executed 2026-09-30, all receipts status 1, see `deployment-dex.md`
- [ ] Point dashboard/backend at Dex contract and re-verify `/guard/state`
- [ ] Collect BscScan evidence (deploy tx, smoke-test txs)
- [x] Prepare pitch deck (portable `docs/build-deck.py` via python-pptx; output `docs/submission/DRIFT-Dex-pitch-draft.pptx`, 4 slides, Dex deploy facts included)
- [ ] Record demo (use pre-deploy script until post-deploy evidence exists)
- [ ] Complete portal/team (Luma, profile, GitHub, track)
- [ ] Submit and save proof (project visible under My Projects + public Projects; edit code stored privately)
