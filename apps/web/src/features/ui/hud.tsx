import type { ReactNode } from "react";
import { Reveal } from "@/features/motion/Motion";

// DRIFT v3 signature elements (DEX-MOTION-LANGUAGE.md §2): HUD corners, mono
// metadata, bracket labels. Server components; only the chapter rule uses the
// shared reveal (it draws itself in from the left).

type Tone = "bone" | "chain" | "veto" | "ink";

const HUD_TONE: Record<Tone, string> = {
  bone: "",
  chain: "hud-chain",
  veto: "hud-veto",
  ink: "hud-ink",
};

/** 1 px corner brackets with optional mono labels in the corners. */
export function Hud({
  children,
  tone = "bone",
  className = "",
  tl,
  tr,
  bl,
  br,
  as: As = "div",
}: {
  children?: ReactNode;
  tone?: Tone;
  className?: string;
  tl?: ReactNode;
  tr?: ReactNode;
  bl?: ReactNode;
  br?: ReactNode;
  as?: "div" | "section" | "aside" | "article";
}) {
  return (
    <As className={`hud ${HUD_TONE[tone]} ${className}`}>
      {tl && <span className="meta pointer-events-auto absolute left-4 top-3 text-mute">{tl}</span>}
      {tr && <span className="meta pointer-events-auto absolute right-4 top-3 text-right text-mute">{tr}</span>}
      {bl && <span className="meta pointer-events-auto absolute bottom-3 left-4 text-mute">{bl}</span>}
      {br && <span className="meta pointer-events-auto absolute bottom-3 right-4 text-right text-mute">{br}</span>}
      {children}
    </As>
  );
}

/** Mono uppercase metadata, e.g. DRIFT — 02 / GUARD · BLOCK 134,644,887. */
export function Meta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`meta ${className}`}>{children}</span>;
}

/** Section marker in brackets, e.g. (how it works). */
export function Bracket({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`bracket ${className}`}>({children})</span>;
}

/** The chapter line that opens a section: index, bracket label, rule. */
export function Chapter({
  index,
  label,
  total = "06",
  className = "",
  tone = "bone",
}: {
  index: string;
  label: string;
  total?: string;
  className?: string;
  tone?: "bone" | "ink";
}) {
  const rule = tone === "ink" ? "bg-ink/15" : "bg-[var(--line-strong)]";
  const text = tone === "ink" ? "text-paper-mute" : "text-mute";
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span className={`meta ${text}`}>
        {index} / {total}
      </span>
      <span className={`bracket ${text}`}>({label})</span>
      <Reveal as="span" kind="draw" className={`block h-px flex-1 ${rule}`} />
    </div>
  );
}
