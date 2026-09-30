"""Portable DRIFT pitch deck builder (python-pptx, no Codex runtime needed).

Content mirrors drift/.local/pitch-build/create.mjs but uses only verified facts
including the real Dex deployment. Output: docs/submission/DRIFT-Dex-pitch-draft.pptx
"""
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
import os

HERE = os.path.dirname(os.path.abspath(__file__))  # drift/docs
DRIFT = os.path.dirname(HERE)
OUT = os.path.join(DRIFT, "docs", "submission", "DRIFT-Dex-pitch-draft.pptx")

BG = RGBColor(0x0B, 0x0C, 0x0F)
FG = RGBColor(0xF4, 0xF5, 0xF8)
MUTED = RGBColor(0xA6, 0xAB, 0xB8)
ACCENT = RGBColor(0xAE, 0xB9, 0xF4)
GREEN = RGBColor(0x78, 0xD5, 0xAB)
AMBER = RGBColor(0xE5, 0xBD, 0x71)

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank = prs.slide_layouts[6]


def slide():
    s = prs.slides.add_slide(blank)
    fill = s.background.fill
    fill.solid()
    fill.fore_color.rgb = BG
    return s


def box(s, left, top, width, height, text, size=24, color=FG, bold=False):
    tx = s.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    p = tx.text_frame.paragraphs[0]
    p.text = text
    p.font.size = Pt(size)
    p.font.bold = bold
    p.font.color.rgb = color
    p.font.name = "Calibri"
    return tx


# 1. Title
s = slide()
box(s, 0.7, 0.7, 11.9, 1.2, "DRIFT", 60, ACCENT, True)
box(s, 0.7, 2.0, 11.9, 1.2, "Public risk state for off-chain quant trading", 32, FG, True)
box(s, 0.7, 4.1, 11.9, 0.8, "Dex contribution: MacroGuard transparency panel", 24, GREEN)
box(s, 0.7, 6.4, 11.9, 0.5, "BSC Testnet \u00b7 Indonesia Web3 Hackathon 2026", 18, MUTED)
box(s, 0.7, 5.3, 11.9, 0.5, "Dex contract: 0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D", 16, MUTED)

# 2. How it works
s = slide()
box(s, 0.7, 0.4, 11.9, 0.9, "How DRIFT works", 40, FG, True)
box(s, 0.7, 1.7, 5.2, 0.7, "Python engine", 26, ACCENT, True)
box(s, 0.7, 2.5, 5.5, 1.5, "Four strategies \u00b7 backtests\nLocal drawdown stop \u00b7 Bybit integration", 20, FG)
box(s, 6.2, 2.3, 0.8, 1.0, "\u2192", 44, MUTED)
box(s, 7.1, 1.7, 5.5, 0.9, "MacroGuard on BSC Testnet", 26, ACCENT, True)
box(s, 7.1, 2.6, 5.5, 1.5, "Regime \u00b7 halt \u00b7 allowed signals\nDecision records (seq 1, 2 on Dex contract)", 20, FG)
box(s, 0.7, 4.8, 11.9, 1.2, "The runner checks the public contract before orders. The contract does not control Bybit directly.", 22, MUTED)

# 3. What Dex added
s = slide()
box(s, 0.7, 0.4, 11.9, 0.9, "What Dex added", 40, FG, True)
box(s, 0.7, 1.6, 5.2, 0.7, "Upstream / team base", 24, MUTED, True)
box(s, 0.7, 2.4, 5.5, 2.0, "Quant engine and dashboard\nMacroGuard Solidity contract\nBNB migration and group deploy", 20, FG)
box(s, 6.9, 1.6, 5.7, 0.7, "Dex work (verified on-chain)", 24, GREEN, True)
box(s, 6.9, 2.4, 5.7, 2.4, "Own BSC Testnet deploy (receipt status 1)\nFull smoke test: RiskOff / halt / resume / Neutral\nRead-only /guard/state API + dashboard panel", 20, FG)
box(s, 0.7, 5.9, 11.9, 0.5, "Code: github.com/Stylenecy/seed-bnb/tree/dex/drift", 18, ACCENT)

# 4. Evidence and limits
s = slide()
box(s, 0.7, 0.4, 11.9, 0.9, "Evidence and current limits", 40, FG, True)
box(s, 0.7, 1.7, 3.4, 0.9, "7 / 7", 48, GREEN, True)
box(s, 0.7, 2.6, 5.5, 0.5, "contract tests passed (Foundry 1.5.1)", 20, FG)
box(s, 6.7, 1.7, 5.9, 0.8, "DEPLOYED + SMOKE-TESTED", 32, GREEN, True)
box(s, 6.7, 2.6, 5.9, 0.5, "Dex contract, 5 txs status 1, unauthorized reverts", 20, FG)
box(s, 0.7, 3.9, 11.9, 1.3, "Panel reads live Dex state: Neutral, not halted, 20% limit, 2 decisions.\nDeploy + smoke receipts on BscScan testnet.", 22, FG)
box(s, 0.7, 5.7, 11.9, 1.0, "Limits: RPC fail-open in runner; live Bybit bot ticks and profitability not verified.", 18, AMBER)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
prs.save(OUT)
print("saved:", OUT)
print("bytes:", os.path.getsize(OUT))
print("slides:", len(prs.slides._sldIdLst))
