<div align="center">

# DRIFT — Showcase

### A trading bot whose risk rules you can verify — risk gate on BNB Chain.

*What each part of DRIFT looks like today. Every image is a capture of the real app or a recording of the real terminal, with its date and data source. Parts that have not been recorded are listed as such.*

</div>

---

## The public risk gate (`/macroguard`)

Login-free, wallet-free. The page reads Dex's MacroGuard contract on BSC Testnet straight from the browser over a public RPC and names the block it read. Live demo: [drift-macroguard.vercel.app/macroguard](https://drift-macroguard.vercel.app/macroguard).

![MacroGuard panel above the fold: live read badge with block number, regime Neutral, Running, 20% halt line, 2 decisions](docs/screens/after/public-guard-desktop.png)

### Ask the contract (what-if, simulated)

Pick a signal and the drawdown the bot would report; the live contract answers through an `eth_call` of `recordDecision` from the agent address. Nothing is signed or written, and the decision count stays the same. Here: Long at −25% is *Blocked*, because the contract would halt itself first.

![Ask the contract at 1440 px: Long at −25.0% answered Blocked, with the call, the agent, the block and a cast command to replay it](docs/screens/after/ask-contract-desktop.png)

<img src="docs/screens/after/ask-contract-mobile.png" alt="Ask the contract at phone width (390 px): Long at −25.0% answered Blocked" width="320">

### Whole panel: desktop and phone

Verdicts, the what-if, the verified decision trail (each row opens BscScan), the halt line and the limits ("what this does not prove").

![The whole /macroguard page at 1440 px](docs/screens/after/public-guard-full-desktop.png)

<img src="docs/screens/after/public-guard-full-mobile.png" alt="The whole /macroguard page at phone width (390 px)" width="320">

### When the chain cannot be read

With both public RPCs blocked, the panel says so, makes no live claim, and still shows the dated receipts.

![MacroGuard panel with the live read unavailable: amber notice, not-live badge, verified receipts still listed](docs/screens/after/public-guard-engine-offline-desktop.png)

*Captures: 3 Oct 2026 from a local production build served on a non-localhost host name (the same mode as the hosted demo). Live values come from BSC Testnet at the block shown in each image.*

---

## Landing (`/`)

The hero says what DRIFT is in one line and routes to the live gate. The proof strip under it is static, dated evidence: the contract, the 20% halt line, the six receipts (deploy and smoke test) and the contract test count.

![Landing page at 1440 px: headline, live-read badge, proof strip](docs/screens/after/landing-desktop.png)

<img src="docs/screens/after/landing-mobile.png" alt="Landing page at phone width (390 px)" width="320">

---

## The terminal (`./drift`)

Recorded on 3 Oct 2026 at 16.17 WIB (09.17 UTC) by running the terminal's own commands and exporting Rich's output, with no keys configured. Bybit's API is unreachable from the recording network, so every view below ran on the **Binance public-data fallback** and says so, with the candle range it used, in its last lines.

### Auto-Research: optimised on 70%, scored on the held-out 30%

![Terminal: research btc 1h, leaderboard of four strategies with in-sample and out-of-sample Sharpe, out-of-sample return and verdict](docs/screens/cli/research-btc-1h.png)

Historical simulation on 1,000 hourly BTCUSDT candles, 22 Aug 18.00 to 3 Oct 09.00 UTC (Binance spot). Sharpe is annualised from hourly bars (×√8760), so about six weeks of data gives large values; "robust" only means both slices passed the 0.5 threshold on this one window. Research, not a profit claim.

### Point-in-time backtest

![Terminal: backtest macd btc 1h with return, Sharpe, win rate, max drawdown, trade count and the equity chart](docs/screens/cli/backtest-macd-btc-1h.png)

Historical simulation on 720 hourly BTCUSDT candles, 3 Sep 10.00 to 3 Oct 09.00 UTC (Binance spot); a position decided on one bar is earned on the next. The equity chart is scaled from its own minimum to its maximum, not from zero, so a gain of a few percent fills the frame. Research, not a profit claim; past results do not predict future ones.

### Markets

![Terminal: markets table with last price, 24h change and range for eight rows](docs/screens/cli/markets.png)

`BNB/USDT` appears twice: a known upstream issue (`BNBUSDT` is listed twice in `MARKET_SYMBOLS`), pinned by a strict `xfail` test and left unfixed in this fork.

### Not recorded

- `analyze <sym>` (the LLM analyst) needs an LLM API key; none was configured for the recording.
- `bot <strat> <sym>` needs Bybit testnet trading keys. **No live bot tick has been verified in this fork.**
- `chain` needs the engine configured with a contract address; the public panel above shows the same contract.

---

## The web cockpit (`apps/web`, run locally)

The cockpit needs the engine on the same machine. On the hosted demo its routes show one notice that links to `/macroguard` and to the README quick start, and they never call the engine.

![Research page at 1440 px with the data-source label: historical simulation on public market data, research, not a profit claim](docs/screens/after/research-desktop.png)

![MacroGuard panel inside the cockpit at 1440 px](docs/screens/after/macroguard-desktop.png)

![Markets page at 1440 px with the engine stopped: an honest "Engine offline" card](docs/screens/after/markets-desktop.png)

*These cockpit captures were taken with the engine stopped, so they show the empty and offline states. Live prices, candles, research results and bots in the browser have not been recorded for this showcase.*

---

## On-chain proof

Every transaction of the 30 Sep 2026 smoke test is linked, with block and gas, in the README's [proof table](README.md#proof-on-bnb-chain); the record is [`docs/deployment-dex.md`](docs/deployment-dex.md). Source verification: [Sourcify, exact match](https://repo.sourcify.dev/97/0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D). BscScan pages are not captured here because BscScan blocks automated capture; open the links instead.

---

<div align="center">
<sub>See the <a href="./README.md">README</a> for the full docs, tests and threat model · Strategies ported from <a href="https://github.com/je-suis-tm/quant-trading">je-suis-tm/quant-trading</a></sub>
</div>
