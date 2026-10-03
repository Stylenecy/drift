import type { CSSProperties, ElementType } from "react";

export type ScrubSegment = { text: string; className?: string };

/**
 * A statement whose words light up in reading order as it scrolls into view
 * (CSS scroll-driven animation, no JavaScript; see .scrub in globals.css).
 * Server component: the words are plain spans, so the text reads complete
 * everywhere, and browsers without scroll timelines simply show it lit.
 */
export function ScrubWords({
  as: Tag = "p",
  segments,
  className = "",
  span = 34,
}: {
  as?: ElementType;
  segments: ScrubSegment[];
  className?: string;
  /** Share of the cover range (in %) over which all words light up. */
  span?: number;
}) {
  const words = segments.flatMap((seg) => seg.text.split(" ").filter(Boolean).map((w) => ({ w, className: seg.className })));
  const step = `${(span / Math.max(1, words.length)).toFixed(3)}%`;
  return (
    <Tag className={`scrub ${className}`} style={{ "--step": step } as CSSProperties}>
      {words.map((it, i) => (
        <span key={i}>
          <span className={`scrub-w ${it.className ?? ""}`} style={{ "--i": i } as CSSProperties}>
            {it.w}
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
