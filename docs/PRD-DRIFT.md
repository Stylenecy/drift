# PRD — DRIFT · MacroGuard Transparency

Owner: Dex Bennett · Updated 2026-10-02 · Event: Indonesia Web3 Hackathon 2026 (BNB Chain)
Status: locked for the submission window (UI freeze Mon 5 Oct 12.00 WIB, submit Tue 6 Oct).

## 1. Problem

Trading bots ask users to trust risk rules nobody can see. Settings change silently, and an
off-chain decision log can be edited after the fact. A retail trader, an auditor, or a judge has
no independent way to answer: *"What was the bot allowed to do at that moment, and why?"*

## 2. Users

| User | Needs | Wins when |
|---|---|---|
| Hackathon judge (primary) | Understand the product in ~3 minutes; see a real contract working | Can open the live state and a BscScan receipt without reading code |
| Skeptical retail trader | Proof that the risk stop is real, not a marketing promise | Sees which signals are blocked right now, and why, in plain language |
| Auditor / technical reviewer | Raw evidence: address, agent, receipts, limits | Every claim on screen links to an on-chain source or is labelled as off-chain |

## 3. Promise (one sentence)

**DRIFT is a quant trading cockpit whose risk gate lives on BNB Chain: anyone can check what the
bot is allowed to do right now, and every recorded decision is public on BscScan.**

## 4. Boundaries

**Upstream vs Dex.** DRIFT's core (the quant engine, the cockpit and `MacroGuard.sol`) comes from the upstream DRIFT project, built for a Mantle hackathon track ("AI Trading & Strategy", June 2026) and migrated to BNB Chain in `bcc-ukdw/seed-bnb` (commit `52671ce`, 29 Sep 2026). Dex Bennett's contribution in this fork: the MacroGuard transparency panel (`/dashboard/macroguard` and the public `/macroguard`), the read-only `/guard/state` API, contract reads straight from the browser over a public RPC (no engine needed), honest copy corrections, a self-owned MacroGuard deployment with an on-chain smoke test (30 Sep 2026), source verification on Sourcify, the judge-facing landing page and visual system, the PRD and the pitch deck.

**On-chain (BSC Testnet, chain 97, Dex contract `0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D`):**
market regime (RiskOff/Neutral/RiskOn), `allowed(signal)` gate, drawdown halt at 2000 bps (20%),
`recordDecision` trail, agent-only `resume()`.

**Off-chain:** strategy research, backtests, Bybit market data and order execution, regime
classification, LLM analyst, Telegram control, the web app.

## 5. The 3-minute judge flow

1. **Landing (0:00–0:20).** Hero tells the story in 5 seconds: engine off-chain, risk gate on-chain,
   verifiable. A proof strip shows the contract address, threshold, and receipt count (static, dated evidence).
2. **Live contract proof (0:20–0:50).** One click to the MacroGuard panel (no login): network,
   address, agent, "live contract read" badge.
3. **MacroGuard panel (0:50–1:50).** Regime and halt state badges, Long/Short/Flat verdict with the
   reason, drawdown gauge against the 20% limit, decision count, and the verified smoke-test
   timeline (RiskOff → decision → halt → resume → Neutral).
4. **BscScan (1:50–2:30).** Every address and tx hash on the panel opens BscScan in a new tab.
5. **Honest research boundary (2:30–3:00).** The quant engine (backtests, optimizer) runs on the
   user's own machine. The hosted demo is read-only: its cockpit routes show one notice linking to
   `/macroguard` and the README quick start. Run locally, the research page shows a point-in-time
   backtest with return, Sharpe, max drawdown — explicitly "research, not a profit claim". If Bybit
   public data is unreachable, the page says so instead of showing a fake curve.

## 6. Screens and acceptance criteria

| Screen | Purpose | Acceptance (measurable) |
|---|---|---|
| `/` landing | Explain DRIFT in 5 s and route the judge to proof | Above the fold at 1440×900 and 390×844: headline, one-line promise, "Inspect MacroGuard" CTA, BscScan link. No claim of profit or trustless execution. Hero copy ≤ 30 words. |
| `/macroguard` (public) and `/dashboard/macroguard` | Star screen: live risk state + evidence | Regime, halt, threshold, decision count, per-signal verdict visible without scrolling at 1440×900. Every address/tx is a BscScan link. Live values name their source (public RPC + block, or DRIFT engine); the hosted demo reads the chain from the browser, with no engine. Loading and live-read-failed states each render a distinct, honest message and still show the static verified evidence. No login required for `/macroguard`. |
| `/dashboard/backtest` | Show research honesty | Hosted demo: one notice that the engine runs locally, linking to `/macroguard` and the README quick start; no request to localhost. Local: metrics labelled as historical simulation; error state explains the Bybit data timeout. |
| `/dashboard` markets | Context for the cockpit | Unchanged logic; inherits shared visual tokens. |
| All screens | Quality bar | `npm run build` and `npm run lint` pass. Visible focus ring on every interactive element. Text contrast ≥ 4.5:1 (AA). Motion off under `prefers-reduced-motion`. No horizontal scroll at 390 px. |

## 7. Non-goals

- No change to engine logic, contract code, or API response shapes.
- No new transactions, redeploys, or mainnet anything.
- No live Bybit trading demo; no wallet-connect flow.
- No new data source for the decision timeline: it shows the documented smoke-test receipts
  (static, dated 2026-09-30) next to the live `decision_count`.

## 8. Honest boundaries (must stay true in every screen, deck, and video)

- The contract does **not** execute Bybit orders. Execution is off-chain.
- The Python runner **fails open** if the RPC is unavailable (it falls back to its local stop).
- The agent can call `resume()`; the halt is a recorded pause, not an unbreakable lock.
- With a private key configured, the engine's regime loop **sends `setRegime` automatically** when
  the off-chain regime changes. Demo/screenshot runs use a read-only engine (no key).
- No live bot tick and no profitability have been verified in this fork. Backtests are research.

## 9. Submission requirements (read-only check, 2026-10-01)

Source: <https://indonesiaweb3hack.xyz/en/faq> and <https://indonesiaweb3hack.xyz/en>;
event page <https://luma.com/pcc699dv> (still shows 30 Sep; portal says "1 September to
7 October 2026 (extended)"). Closing clock/time zone: **not published** — treat 6 Oct as the deadline.

Form fields: team and project name, tracks, **contract address resolving on BscScan**, problem
statement, solution, project detail (markdown + mermaid), **public GitHub repo**, **demo video
(YouTube, ≤5 min recommended)**, team members, supporting links. Team must be registered on Luma.
Edits allowed until the window closes (edit code issued on first submit).
Judging: innovation and originality, technical execution, impact and business viability, UX,
presentation and demo. Finalists 14 Oct; Demo Day 31 Oct, Yogyakarta (offline).
