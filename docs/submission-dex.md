# DRIFT — Indonesia Web3 Hackathon 2026 submission draft

Status: **draft, not submitted** · Updated 2026-09-29 · Deadline date: 2026-09-30 (exact time zone/clock not confirmed by the public event page)

## Source and contribution

- Base project: [`bcc-ukdw/seed-bnb/drift`](https://github.com/bcc-ukdw/seed-bnb/tree/main/drift), commit `52671ce`, including the quant engine, web app, MacroGuard contract, and BNB migration. Do not present these as Dex's original work.
- Dex fork and contribution: [`Stylenecy/seed-bnb`, branch `dex/drift`](https://github.com/Stylenecy/seed-bnb/tree/dex/drift), commit `a22b057`: read-only MacroGuard transparency panel and `/guard/state` API, plus honest copy corrections.
- Own BSC Testnet deployment: **pending**. The upstream contract in `contracts/deployments/bsc-testnet.json` belongs to the migration team's wallet; it is not Dex's deployment.

## Submission copy

**Name:** DRIFT — MacroGuard Transparency

**One line:** Quant trading research with a public BNB Chain risk state and decision trail.

**Problem:** Trading bots can hide their risk settings and change an off-chain decision history. Users and judges need a way to inspect the risk gate independently.

**Solution:** DRIFT runs strategy research and exchange integration in Python. Its Solidity MacroGuard on BSC Testnet stores a market regime, a drawdown halt, and successful decision records. The Python runner checks `allowed()` before orders. Dex's new dashboard panel reads the actual contract, shows the current rules for Long/Short/Flat, and links to BscScan.

**Why BNB Chain:** The contract state and successful decision transactions are publicly inspectable without access to DRIFT's backend. Compute-heavy research stays off-chain.

**Honest boundary:** The contract does not execute Bybit orders. The runner currently fails open if the RPC is unavailable, under its local drawdown stop. The agent can call `resume()`. No live Bybit bot tick or profitability claim has been verified in this fork.

## Evidence available now

Previously verified evidence vs this-session checks are kept separate.
`forge`/`cast` are not available in the current OpenCode environment, so
build/test claims below are previously verified, not reproduced here.

| Item | Result |
|---|---|
| `forge build` | Previously verified: passed with Solc 0.8.24; not re-run in this session |
| `forge test -vv` | Previously verified: 7 passed, 0 failed; not re-run in this session |
| `npm run build` | Previously verified: passed; `/dashboard/macroguard` present. File confirmed present in this session: `apps/web/src/app/dashboard/macroguard/page.tsx` |
| FastAPI `/health`, `/chain`, `/strategies` | Previously verified: HTTP 200 locally; not re-run in this session |
| New `/guard/state` | Previously verified: HTTP 200 reading upstream BSC Testnet contract with no private key; chain 97, Neutral, not halted, 20% threshold, 3 decisions at test time. Route confirmed present in this session: `apps/trader/app/main.py` |
| Backtest on public Bybit data | NOT VERIFIED: HTTP 502 locally because `api.bybit.com` timed out |
| Dex own deploy and transaction receipts | PENDING: wallet unfunded, no broadcast executed in this session |
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

- [ ] Fund Dex BSC Testnet wallet sufficiently for deployment + smoke-test transactions (no invented minimum)
- [ ] Deploy Dex-owned MacroGuard (BSC Testnet, chain 97, maxDrawdownBps 2000) with Dex approval
- [ ] Run on-chain smoke test (RiskOff, halt, resume, unauthorized-caller check)
- [ ] Point dashboard/backend at Dex contract and re-verify `/guard/state`
- [ ] Collect BscScan evidence (deploy tx, smoke-test txs)
- [ ] Prepare pitch deck (portable build; Codex-only script does not run in OpenCode env)
- [ ] Record demo (use pre-deploy script until post-deploy evidence exists)
- [ ] Complete portal/team (Luma, profile, GitHub, track)
- [ ] Submit and save proof (project visible under My Projects + public Projects; edit code stored privately)
