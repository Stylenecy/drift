import type { CSSProperties, ElementType, ReactNode } from "react";
import { Reveal } from "./Motion";

/**
 * Authored lines. mode "load" rises out of masks on first paint (CSS only);
 * "settle" is painted on the first frame and settles into place (for an LCP
 * headline); "scroll" hands the element to the shared reveal. Load modes stay
 * server-rendered with no client JS.
 */
export function Lines({
  as: Tag = "h2",
  lines,
  className = "",
  mode = "scroll",
  delay,
  label,
}: {
  as?: ElementType;
  lines: ReactNode[];
  className?: string;
  mode?: "load" | "settle" | "scroll";
  delay?: number;
  label?: string;
}) {
  const body = lines.map((line, i) => (
    <span key={i} className="ln">
      <span className="ln-i" style={{ "--i": i } as CSSProperties}>
        {line}
      </span>
    </span>
  ));
  if (mode === "load" || mode === "settle") {
    return (
      <Tag
        className={`${mode === "load" ? "ld-lines" : "ld-settle"} ${className}`}
        style={delay !== undefined ? ({ "--d": `${delay}s` } as CSSProperties) : undefined}
        aria-label={label}
      >
        {body}
      </Tag>
    );
  }
  return (
    <Reveal as={Tag} kind="lines" delay={delay} className={className} aria-label={label}>
      {body}
    </Reveal>
  );
}
