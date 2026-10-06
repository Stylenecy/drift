"use client";

import { useId, type CSSProperties } from "react";
import { usePlay } from "../motion";

// Five small looping artworks for "How it works", drawn in code (2 px line style).
// Gold marks the two on-chain steps.

const stroke = { fill: "none", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Propose() {
  return (
    <svg viewBox="0 0 320 220" className="h-full w-full">
      <path d="M20 190 H300 M20 190 V20" stroke="var(--slate-2)" {...stroke} />
      <path className="mo-draw" d="M24 160 L70 130 L110 148 L150 96 L190 112 L230 64 L290 44" stroke="var(--bone)" {...stroke} />
      <g className="mo-pop">
        <rect x="200" y="12" width="104" height="40" rx="20" fill="var(--bone)" />
        <text x="252" y="38" textAnchor="middle" fontSize="17" fontWeight="600" fill="var(--ink)">Buy?</text>
      </g>
    </svg>
  );
}

function Ask() {
  return (
    <svg viewBox="0 0 320 220" className="h-full w-full">
      <path d="M96 24 H196 L232 60 V196 H96 Z" stroke="var(--chain)" {...stroke} />
      <path d="M196 24 V60 H232" stroke="var(--chain)" {...stroke} />
      <path d="M118 84 H206 M118 108 H206 M118 132 H170" stroke="var(--chain)" strokeOpacity="0.55" {...stroke} />
      <g className="mo-yes">
        <circle cx="236" cy="168" r="34" fill="var(--ok)" />
        <path d="M220 168 L232 180 L254 156" stroke="var(--ink)" {...stroke} strokeWidth="5" />
        <text x="60" y="176" textAnchor="middle" fontSize="20" fontWeight="600" fill="var(--ok)">YES</text>
      </g>
      <g className="mo-no">
        <circle cx="236" cy="168" r="34" fill="var(--veto)" />
        <path d="M222 154 L250 182 M250 154 L222 182" stroke="var(--ink)" {...stroke} strokeWidth="5" />
        <text x="60" y="176" textAnchor="middle" fontSize="20" fontWeight="600" fill="var(--veto)">NO</text>
      </g>
    </svg>
  );
}

function Trade() {
  return (
    <svg viewBox="0 0 320 220" className="h-full w-full">
      <g className="mo-spin">
        <path d="M86 92 A78 78 0 0 1 226 84" stroke="var(--bone)" {...stroke} strokeWidth="4" />
        <path d="M212 64 L228 86 L202 92" stroke="var(--bone)" {...stroke} strokeWidth="4" />
        <path d="M234 128 A78 78 0 0 1 94 136" stroke="var(--bone)" {...stroke} strokeWidth="4" />
        <path d="M108 156 L92 134 L118 128" stroke="var(--bone)" {...stroke} strokeWidth="4" />
      </g>
      <rect x="112" y="96" width="96" height="30" rx="15" fill="var(--slate-2)" />
      <text x="160" y="116" textAnchor="middle" fontSize="13" fontWeight="600" letterSpacing="1.5" fill="var(--bone)">TESTNET</text>
    </svg>
  );
}

function Receipt() {
  const clip = `rc${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg viewBox="0 0 320 220" className="h-full w-full">
      <rect x="82" y="10" width="156" height="14" rx="7" fill="var(--slate-2)" />
      <clipPath id={clip}>
        <rect x="70" y="18" width="180" height="200" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <g className="mo-print">
          <path d="M96 18 H224 V196 L208 186 L192 196 L176 186 L160 196 L144 186 L128 196 L112 186 L96 196 Z" fill="var(--slate-1)" stroke="var(--chain)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M116 52 H204 M116 76 H180 M116 100 H196" stroke="var(--chain)" strokeOpacity="0.7" {...stroke} />
          <text x="160" y="150" textAnchor="middle" fontSize="15" fontWeight="600" letterSpacing="1" fill="var(--chain)">STATUS 1</text>
        </g>
      </g>
    </svg>
  );
}

function Explain() {
  return (
    <svg viewBox="0 0 320 220" className="h-full w-full">
      <path d="M40 30 H280 Q292 30 292 42 V138 Q292 150 280 150 H120 L76 186 V150 H40 Q28 150 28 138 V42 Q28 30 40 30 Z" stroke="var(--bone)" {...stroke} />
      <g className="mo-type">
        <text x="52" y="78" fontSize="17" fill="var(--mute)">Why did the bot stay out?</text>
        <text x="52" y="106" fontSize="17" fill="var(--bone)">Risk off blocks new buys.</text>
      </g>
      {[0, 1, 2].map((i) => (
        <circle key={i} className="mo-dot" style={{ "--i": i } as CSSProperties} cx={226 + i * 18} cy={124} r="5" fill="var(--mute)" />
      ))}
    </svg>
  );
}

const ART = [Propose, Ask, Trade, Receipt, Explain];

export function StepArt({ index, className = "" }: { index: number; className?: string }) {
  const ref = usePlay<HTMLDivElement>();
  const Art = ART[index] ?? Propose;
  return (
    <div ref={ref} aria-hidden className={`mo ${className}`}>
      <Art key={index} />
    </div>
  );
}
