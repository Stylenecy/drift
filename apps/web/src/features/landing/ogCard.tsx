import { ImageResponse } from "next/og";
import { DEX_GUARD, SMOKE_TEST, short } from "@/features/guard/evidence";

// Share card for links to DRIFT (Open Graph + Twitter). Every value on it is
// evidence from docs/deployment-dex.md: the contract, its 20% halt line and the
// two recorded drawdowns of the 30 Sep 2026 smoke test. No equity curve, no
// performance number. Default font of next/og (Geist) keeps the brand type.

export const OG_ALT =
  "DRIFT: a trading bot whose risk rules you can verify. MacroGuard, a public risk gate on BNB Smart Chain Testnet.";

const INK = "#0B0C0F";
const GOLD = "#F0B90B";
const EMERALD = "#34D399";
const ROSE = "#FB7185";
const MUTED = "rgba(255,255,255,0.72)";

export function ogCard(): ImageResponse {
  const limit = DEX_GUARD.maxDrawdownBps / 100; // 20
  const scale = 30;
  const at = (pct: number) => `${(Math.min(pct, scale) / scale) * 100}%`;
  const dots = SMOKE_TEST.filter((s) => s.drawdownPct !== undefined).map((s) => s.drawdownPct ?? 0);
  const safe = dots.find((pct) => pct <= limit);
  const breach = dots.find((pct) => pct > limit);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: INK,
          color: "#FFFFFF",
          padding: "60px 72px 56px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 24, letterSpacing: "0.14em", color: MUTED }}>
          <span style={{ color: "#FFFFFF" }}>DRIFT</span>
          <span style={{ margin: "0 14px" }}>·</span>
          <span>MACROGUARD ON BNB CHAIN</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, lineHeight: 1.04, letterSpacing: "-0.035em", maxWidth: 1000 }}>
            A trading bot whose risk rules you can verify.
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 22, fontSize: 30, lineHeight: 1.3, color: MUTED }}>
            <span>Quant research runs off-chain.</span>
            <span>The risk gate is a public contract on BNB Smart Chain Testnet.</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", display: "flex", height: 34 }}>
            <span style={{ position: "absolute", left: at(limit), transform: "translateX(-50%)", fontSize: 22, color: GOLD }}>
              {`halt line · ${limit}%`}
            </span>
          </div>
          <div
            style={{
              position: "relative",
              display: "flex",
              height: 14,
              borderRadius: 7,
              background: "rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: at(limit),
                borderRadius: "7px 0 0 7px",
                background: "rgba(52,211,153,0.35)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: at(limit),
                right: 0,
                top: 0,
                bottom: 0,
                borderRadius: "0 7px 7px 0",
                background: "rgba(251,113,133,0.35)",
              }}
            />
            <div style={{ position: "absolute", left: at(limit), top: -10, width: 3, height: 34, background: GOLD }} />
            {dots.map((pct) => (
              <div
                key={pct}
                style={{
                  position: "absolute",
                  left: at(pct),
                  top: -6,
                  width: 26,
                  height: 26,
                  marginLeft: -13,
                  borderRadius: 13,
                  border: `4px solid ${INK}`,
                  background: pct > limit ? ROSE : EMERALD,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, fontSize: 22, color: MUTED }}>
            <span>{`−${safe}% recorded: kept running`}</span>
            <span>{`−${breach}% recorded: the contract halted itself`}</span>
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 24, color: GOLD }}>
            {`${short(DEX_GUARD.address, 6, 4)} · chain 97 · source verified on Sourcify · receipts ${DEX_GUARD.testedOn}`}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
