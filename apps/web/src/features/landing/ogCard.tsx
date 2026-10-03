import type { CSSProperties } from "react";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { DEX_GUARD, SMOKE_TEST, short } from "@/features/guard/evidence";

// Share card for links to DRIFT (Open Graph + Twitter), in the v3 house style:
// HUD corners, mono metadata, display headline, one serif-italic line, and the
// drawdown scale with the on-chain halt line. Every value is evidence from
// docs/deployment-dex.md: the contract, its 20% halt line and the two drawdowns
// recorded in the 30 Sep 2026 smoke test. No equity curve, no performance number.
// Fonts (OFL) live in src/app/_og-fonts with their licences.

export const OG_ALT =
  "DRIFT: a trading bot whose risk rules you can verify. MacroGuard, a public risk gate on BNB Smart Chain Testnet.";

const INK = "#0C0D0D";
const BONE = "#E1E5E5";
const MUTE = "#858E8E";
const GRID = "rgba(225,229,229,0.07)";
const GOLD = "#F0B90B";
const VETO = "#E34C22";
const OK = "#34D399";

const W = 1200;
const H = 630;
const PAD = 36; // HUD inset
const SCALE = 30; // percent across the grid

async function font(name: string) {
  return readFile(join(process.cwd(), "src/app/_og-fonts", name));
}

function Corner({ x, y }: { x: "left" | "right"; y: "top" | "bottom" }) {
  const L = 22;
  const at = (d: number): CSSProperties => ({
    ...(x === "left" ? { left: d } : { right: d }),
    ...(y === "top" ? { top: d } : { bottom: d }),
  });
  const stroke = "rgba(225,229,229,0.55)";
  return (
    <div style={{ position: "absolute", width: L, height: L, display: "flex", ...at(PAD) }}>
      <div style={{ position: "absolute", width: L, height: 2, background: stroke, ...at(0) }} />
      <div style={{ position: "absolute", width: 2, height: L, background: stroke, ...at(0) }} />
    </div>
  );
}

export async function ogCard(): Promise<ImageResponse> {
  const [semibold, mono, serif] = await Promise.all([
    font("Geist-SemiBold.woff"),
    font("GeistMono-Regular.woff"),
    font("InstrumentSerif-Italic.woff"),
  ]);
  const limit = DEX_GUARD.maxDrawdownBps / 100; // 20
  const gridW = W - 2 * PAD;
  const xAt = (pct: number) => PAD + (pct / SCALE) * gridW;
  const dots = SMOKE_TEST.filter((s) => s.drawdownPct !== undefined).map((s) => s.drawdownPct ?? 0);
  const meta = { fontFamily: "Geist Mono", fontSize: 19, letterSpacing: "0.08em", color: MUTE } as const;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: INK, color: BONE, fontFamily: "Geist" }}>
        {/* 12-column drawdown grid and the gold halt line */}
        {Array.from({ length: 13 }, (_, i) => (
          <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: PAD + (gridW / 12) * i, width: 1, background: GRID }} />
        ))}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: xAt(limit), width: 2, background: "rgba(240,185,11,0.45)" }} />

        <Corner x="left" y="top" />
        <Corner x="right" y="top" />
        <Corner x="left" y="bottom" />
        <Corner x="right" y="bottom" />

        <div style={{ ...meta, position: "absolute", left: PAD + 18, top: PAD + 14, display: "flex" }}>DRIFT — RISK GATE ON BNB CHAIN</div>
        <div style={{ ...meta, position: "absolute", right: PAD + 18, top: PAD + 14, display: "flex" }}>BSC TESTNET · CHAIN 97</div>

        {/* headline */}
        <div style={{ position: "absolute", left: PAD + 40, top: 104, display: "flex", flexDirection: "column" }}>
          <div style={{ ...meta, color: BONE, display: "flex" }}>(DRIFT) — A TRADING BOT WHOSE</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 14, fontSize: 112, lineHeight: 0.92, letterSpacing: "-0.05em", fontWeight: 600 }}>
            <span>Risk rules</span>
            <span>you can</span>
            <span style={{ color: GOLD }}>verify.</span>
          </div>
        </div>

        {/* right column: the serif line and the evidence */}
        <div style={{ position: "absolute", left: xAt(limit) + 28, right: PAD + 30, top: 160, display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 40, lineHeight: 1.08, color: BONE, display: "flex" }}>
            Don&apos;t take the bot&apos;s word for it.
          </div>
          <div style={{ ...meta, marginTop: 22, lineHeight: 1.6, display: "flex", flexDirection: "column" }}>
            <span>QUANT RESEARCH OFF-CHAIN.</span>
            <span>RISK GATE: A PUBLIC CONTRACT.</span>
          </div>
        </div>

        {/* drawdown ruler with the recorded decisions */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 476, height: 70, display: "flex" }}>
          <div style={{ position: "absolute", left: PAD, width: (limit / SCALE) * gridW, top: 20, height: 4, background: "rgba(52,211,153,0.55)" }} />
          <div style={{ position: "absolute", left: xAt(limit), right: PAD, top: 20, height: 4, background: "rgba(227,76,34,0.7)" }} />
          {dots.map((pct) => (
            <div
              key={pct}
              style={{
                position: "absolute",
                left: xAt(pct) - 11,
                top: 11,
                width: 22,
                height: 22,
                transform: "rotate(45deg)",
                background: pct >= limit ? VETO : OK,
                border: `4px solid ${INK}`,
              }}
            />
          ))}
          <div style={{ ...meta, position: "absolute", left: PAD + 4, top: 40, display: "flex" }}>0%</div>
          <div style={{ ...meta, position: "absolute", left: xAt(limit) + 10, top: 40, color: GOLD, display: "flex" }}>
            {`HALT LINE −${limit}% · ${DEX_GUARD.maxDrawdownBps} BPS`}
          </div>
          <div style={{ ...meta, position: "absolute", right: PAD + 4, top: 40, display: "flex" }}>−30%</div>
        </div>

        <div style={{ ...meta, position: "absolute", left: PAD + 18, bottom: PAD + 12, color: GOLD, display: "flex" }}>
          {`MACROGUARD ${short(DEX_GUARD.address, 6, 4)} · SOURCIFY EXACT MATCH`}
        </div>
        <div style={{ ...meta, position: "absolute", right: PAD + 18, bottom: PAD + 12, display: "flex" }}>
          {`RECEIPTS ${DEX_GUARD.testedOn}`}
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: "Geist", data: semibold, weight: 600, style: "normal" },
        { name: "Geist Mono", data: mono, weight: 400, style: "normal" },
        { name: "Instrument Serif", data: serif, weight: 400, style: "italic" },
      ],
    },
  );
}
