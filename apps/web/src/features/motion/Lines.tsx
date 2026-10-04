import type { CSSProperties, ElementType, ReactNode } from "react";
import { Reveal } from "./Motion";

/**
 * Authored lines in masks. mode "load" rises on first paint with CSS only and
 * stays a server component (no hydration for the hero headline); mode "scroll"
 * hands the element to the shared reveal.
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
  mode?: "load" | "scroll";
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
  if (mode === "load") {
    return (
      <Tag
        className={`ld-lines ${className}`}
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
