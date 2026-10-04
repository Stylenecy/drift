# DRIFT — Visual direction (v3, 2026-10-04)

**Mood:** a flight recorder for a trading bot. Calm, dark, instrument-grade. Drama comes from
evidence (a live block number, a receipt, the halt line), not from glow effects or profit charts.
v3 gives the whole site one language: HUD corners, mono metadata, giant display type with one
serif-italic phrase, bracket labels, a thin measuring grid, and motion that explains.

**Colour has meaning — never mixed:**
- **Gold `#F0B90B` = on-chain / verifiable.** Contract address, receipts, BscScan links, the
  on-chain halt line, "live read" proof. If it is gold, a judge can check it on BscScan. Sparingly
  (≤10% of a screen). Its light tint `#F8D36A` (13.45:1 on ink) is for gold text links on dark
  surfaces and gold hover states.
- **Vermilion `#E34C22` = halt / veto.** Blocked verdicts, the `Halted` event, the breach zone.
  Text only on ink (4.93:1); on raised surfaces use `#F2795A`; ink on vermilion is 4.93:1.
- **Periwinkle `#9AA8F0` = off-chain engine.** A marker in diagrams and the cockpit, not an accent.
- **Ground (house neutrals):** ink `#0C0D0D`, slate-1 `#1A1E1E` (raised), slate-2 `#303636`
  (strong line), mute `#858E8E` (secondary text, 5.79:1 on ink), bone `#E1E5E5` (text, 15.32:1),
  paper `#F1F3F3` (the one light block; secondary text on it `#5B6363`, 5.52:1), hairlines bone at 8%/16%.
- **State:** emerald `#34D399` allowed/running · amber `#FBBF24` risk-off/attention · vermilion
  halted/blocked. Every state also carries a word and an icon — never colour alone.
- **Charts (cockpit only):** up = emerald, down / short side = `#F87171` (7.03:1 on ink), markers =
  amber, the off-chain test region = periwinkle. The chart red is a price direction, never a veto.
  Category marks in the blog archive are neutral (mute); categories are told by their mono label.

**Type:** Geist for prose and display (display: weight 600, tracking −0.045em, `clamp(56px, 9vw, 168px)`).
Geist Mono for anything a machine wrote: addresses, hashes, bps, block numbers, chain IDs, and the
uppercase metadata labels (11–12 px, tracking 0.08em). Instrument Serif italic for one phrase per
screen. Tabular numbers.
*Deck (2026-10-03):* the .pptx uses Calibri and Consolas in place of Geist and Geist Mono, because
a .pptx renders with the viewer's installed fonts and Geist is not a system font; the PDF export
embeds them. Colours stay the tokens above, headings are white, and gold still means "checkable
on-chain".

**Signature elements:** 1 px HUD corners (gold when the content is verifiable on-chain, vermilion
for halt states) · mono metadata in corners · bracket labels `(proof)`, `(how it works)` ·
chapter lines `03 / 06` · the 12-column grid of the hero, which is a drawdown scale (2.5% per
column, the gold halt line at −20%).

**Motion (rules in Dex-Brain `DEX-MOTION-LANGUAGE.md` §4):** only transform, opacity and clip-path
move; no motion library, no WebGL, no animation loop while idle. Headlines rise line by line in
masks (1.0–1.1 s, expo-out, 80–90 ms stagger); panels open with a clip-path wipe; numbers count
once; block numbers roll like an odometer; the live ticker runs only on screen; one pinned
"how it works" sequence on wide screens; the halt gauge marker slides past the gold line.
Everything rests under `prefers-reduced-motion`, and the page reads complete without JavaScript.
No parallax on data.

**Key components:**
- **Live readout** (hero) — block (odometer), regime, halt, halt line, decisions, verdicts, read time.
- **On-chain proof card** — gold HUD, chain + address (mono, copyable), agent, BscScan link,
  "live read · block" badge; distinct offline/error state that still shows static evidence.
- **State badges** — Regime (RiskOff/Neutral/RiskOn as a 3-step selector) and Halt (Running/Halted).
- **Signal verdict** — Long/Short/Flat tiles: ✓ Allowed / ✕ Blocked + one-line reason.
- **Halt-line gauge** — 0 → 30%, gold line at 20%; recorded decisions as diamonds (−1% kept running,
  −25% halted).
- **Decision timeline** — verified receipts, dated, each with block, gas, status and BscScan link.

**Honesty rules for visuals:** no fake equity curves or "+x%" decorations; static evidence is
labelled with its date; live data is labelled live; offline is labelled offline; terminal images
are real recordings with their date and data source.
