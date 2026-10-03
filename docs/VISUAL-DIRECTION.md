# DRIFT — Visual direction (2026-10-01)

**Mood:** a flight recorder for a trading bot. Calm, dark, instrument-grade. Drama comes from
evidence (a live badge, a receipt hash, a halt line), not from glow effects or profit charts.

**Colour has meaning — two systems, never mixed:**
- **Gold `#F0B90B` = on-chain / verifiable.** Contract address, receipts, BscScan links, "live
  contract read". If it is gold, a judge can check it on BscScan. Used sparingly (≤10% of a screen).
- **Periwinkle `#9AA8F0` = off-chain engine.** Strategies, backtests, cockpit actions (existing accent).
- Ground: ink `#0B0C0F`, panels `white/3%`, hairlines `white/10%`. Text ≥ `white/60%` for body (AA).
- State: emerald `#34D399` allowed/running · amber `#FBBF24` risk-off/attention · rose `#FB7185`
  halted/blocked. Every state also carries a word and an icon — never colour alone.

**Type:** Geist Sans for prose and headlines (tight tracking, bold, short lines). Geist Mono for
anything a machine wrote: addresses, hashes, bps, block numbers, chain IDs. Tabular numbers.
*Deck (2026-10-03):* the .pptx uses Calibri and Consolas in place of Geist and Geist Mono, because
a .pptx renders with the viewer's installed fonts and Geist is not a system font; the PDF export
embeds them. Colours stay the tokens above, headings are white, and gold still means "checkable
on-chain".

**Motion:** one idea per screen. Live badge breathes (2 s pulse); timeline steps reveal in order;
gauge marker slides to its value. All of it off under `prefers-reduced-motion`. No parallax on data.

**Key components:**
- **On-chain proof card** — gold hairline, chain + address (mono, copyable), agent, BscScan link,
  "live read · block-time" badge; distinct offline/error state that still shows static evidence.
- **State badges** — Regime (RiskOff/Neutral/RiskOn as a 3-step selector) and Halt (Running/Halted).
- **Signal verdict** — Long/Short/Flat tiles: ✓ Allowed / ✕ Blocked + one-line reason.
- **Halt-line gauge** — 0 → 20% limit; recorded decisions plotted as dots (safe −1%, breach −25%).
- **Decision timeline** — verified receipts, dated, each with block, gas, status and BscScan link.

**Honesty rules for visuals:** no fake equity curves or "+x%" decorations; static evidence is
labelled with its date; live data is labelled live; offline is labelled offline.
