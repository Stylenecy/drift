"""DRIFT pitch deck builder (python-pptx).

Uses only verified facts, including the real Dex deployment.
Output: docs/submission/DRIFT-pitch.pptx
"""
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
import os

HERE = os.path.dirname(os.path.abspath(__file__))  # drift/docs
DRIFT = os.path.dirname(HERE)
OUT = os.path.join(DRIFT, "docs", "submission", "DRIFT-pitch.pptx")

# Same wording as README.md "This fork's contribution"; slide 5 shows a short form.
PROVENANCE = (
    "DRIFT's core (the quant engine, the cockpit and `MacroGuard.sol`) comes from the upstream DRIFT "
    'project, built for a Mantle hackathon track ("AI Trading & Strategy", June 2026) and migrated to'
    " BNB Chain in `bcc-ukdw/seed-bnb` (commit `52671ce`, 29 Sep 2026). Dex Bennett's contribution in"
    ' this fork: the MacroGuard transparency panel (`/dashboard/macroguard` and the public `/macrogua'
    'rd`), the read-only `/guard/state` API, contract reads straight from the browser over a public R'
    'PC (no engine needed), honest copy corrections, a self-owned MacroGuard deployment with an on-ch'
    'ain smoke test (30 Sep 2026), source verification on Sourcify, the judge-facing landing page and'
    ' visual system, the PRD and the pitch deck.'
)

BG = RGBColor(0x0B, 0x0C, 0x0F)
FG = RGBColor(0xF4, 0xF5, 0xF8)
MUTED = RGBColor(0xA6, 0xAB, 0xB8)
ACCENT = RGBColor(0xAE, 0xB9, 0xF4)
GREEN = RGBColor(0x78, 0xD5, 0xAB)
AMBER = RGBColor(0xE5, 0xBD, 0x71)
GOLD = RGBColor(0xF0, 0xB9, 0x0B)  # on-chain / verifiable (see VISUAL-DIRECTION.md)
SHOTS = os.path.join(HERE, "screens", "after")

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


def shot(s, name, left, top, width):
    path = os.path.join(SHOTS, name)
    if os.path.exists(path):
        s.shapes.add_picture(path, Inches(left), Inches(top), width=Inches(width))
    else:
        box(s, left, top, width, 0.5, f"[missing screenshot: {name}]", 14, AMBER)


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
box(s, 0.7, 0.7, 11.9, 1.2, "DRIFT", 60, GOLD, True)
box(s, 0.7, 2.0, 11.9, 1.2, "A trading bot whose risk rules you can verify", 34, FG, True)
box(s, 0.7, 3.2, 11.9, 0.8, "Off-chain quant research · on-chain risk gate on BNB Chain", 22, MUTED)
box(s, 0.7, 5.3, 11.9, 0.5, "Dex contract: 0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D", 16, GOLD)
box(s, 0.7, 6.4, 11.9, 0.5, "BSC Testnet · Indonesia Web3 Hackathon 2026 · Dex Bennett", 18, MUTED)

# 2. Problem and promise
s = slide()
box(s, 0.7, 0.4, 11.9, 0.9, "The problem", 40, FG, True)
box(s, 0.7, 1.6, 11.9, 1.6, "Trading bots ask users to trust risk rules nobody can see.\nSettings change silently; off-chain decision logs can be rewritten.", 24, FG)
box(s, 0.7, 3.6, 11.9, 0.7, "The promise", 28, GOLD, True)
box(s, 0.7, 4.4, 11.9, 1.6, "Anyone can check what DRIFT's bot is allowed to do right now,\nand every recorded decision is public on BscScan.", 24, FG)

# 3. How it works
s = slide()
box(s, 0.7, 0.4, 11.9, 0.9, "How DRIFT works", 40, FG, True)
box(s, 0.7, 1.7, 5.2, 0.7, "Off-chain: Python engine", 26, ACCENT, True)
box(s, 0.7, 2.5, 5.5, 1.5, "Four strategies · point-in-time backtests\nLocal drawdown stop · Bybit testnet execution", 20, FG)
box(s, 6.2, 2.3, 0.8, 1.0, "→", 44, MUTED)
box(s, 7.1, 1.7, 5.5, 0.9, "On-chain: MacroGuard (BSC Testnet)", 26, GOLD, True)
box(s, 7.1, 2.6, 5.5, 1.5, "allowed(signal) · regime · 20% drawdown halt\nrecordDecision → public receipt", 20, FG)
box(s, 0.7, 4.8, 11.9, 1.2, "The runner checks the public contract before orders. The contract does not control Bybit directly.", 22, MUTED)

# 4. Product: the transparency panel
s = slide()
box(s, 0.7, 0.3, 11.9, 0.8, "The MacroGuard panel — public, no login, no wallet", 30, FG, True)
shot(s, "public-guard-desktop.png", 0.7, 1.2, 7.6)
box(s, 8.6, 1.3, 4.2, 4.8, "Live regime and halt state\n\nLong / Short / Flat verdict with the reason\n\nContract, agent and threshold, each linked to BscScan\n\nDated trail of verified receipts\n\nHonest offline state when the engine or RPC is down", 17, FG)

# 5. What Dex added
s = slide()
box(s, 0.7, 0.4, 11.9, 0.9, "What Dex added", 40, FG, True)
box(s, 0.7, 1.6, 5.2, 0.7, "Upstream DRIFT project", 24, MUTED, True)
box(s, 0.7, 2.4, 5.5, 2.8, "Quant engine, cockpit and MacroGuard.sol\nBuilt for a Mantle hackathon track (June 2026)\nMigrated to BNB Chain in bcc-ukdw/seed-bnb\n(commit 52671ce, 29 Sep 2026)", 20, FG)
box(s, 6.9, 1.6, 5.7, 0.7, "Dex work", 24, GOLD, True)
box(s, 6.9, 2.4, 5.7, 3.2, "Own BSC Testnet deploy (receipt status 1)\nSmoke test: RiskOff / halt / resume / Neutral\nSource verified on Sourcify (exact match)\nRead-only /guard/state API\nTransparency panel + public /macroguard\nJudge-facing landing and visual system", 20, FG)
box(s, 0.7, 5.9, 11.9, 0.5, "Code: github.com/Stylenecy/seed-bnb/tree/dex/drift", 18, ACCENT)
s.notes_slide.notes_text_frame.text = PROVENANCE

# 6. Evidence and limits
s = slide()
box(s, 0.7, 0.4, 11.9, 0.9, "Evidence and current limits", 40, FG, True)
box(s, 0.7, 1.7, 3.4, 0.9, "7 / 7", 48, GREEN, True)
box(s, 0.7, 2.6, 5.5, 0.5, "contract tests passed (Foundry 1.5.1)", 20, FG)
box(s, 6.7, 1.7, 5.9, 0.8, "DEPLOYED + SMOKE-TESTED", 32, GREEN, True)
box(s, 6.7, 2.6, 5.9, 0.5, "Dex contract: deploy + 5 smoke txs status 1; unauthorized call reverts", 20, FG)
box(s, 0.7, 3.9, 11.9, 1.3, "Panel reads live Dex state (read 2 Oct 2026): Neutral, not halted, 20% limit, 2 decisions.\nDeploy + smoke receipts on BscScan testnet.", 22, FG)
box(s, 0.7, 5.7, 11.9, 1.0, "Limits: contract never executes orders; RPC fail-open in runner; agent can resume(); no live bot tick or profit verified.", 18, AMBER)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
prs.save(OUT)
print("saved:", OUT)
print("bytes:", os.path.getsize(OUT))
print("slides:", len(prs.slides._sldIdLst))
