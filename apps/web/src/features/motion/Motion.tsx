"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { countUp, indexLines, motionOn, observe, onceInView, reducedMotion } from "./runtime";

type Kind = "up" | "clip" | "draw" | "lines" | "words" | "stagger" | "gauge";

// Layout effect on the client (runs before paint), plain effect on the server.
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

const KIND_CLASS: Record<Kind, string> = {
  up: "rv-up",
  clip: "rv-clip",
  draw: "rv-draw",
  lines: "rv-lines",
  words: "rv-words",
  stagger: "rv-stagger",
  gauge: "gauge",
};

/** Marks motion as booted; without it the inline boot script drops html.js after 4 s. */
export function MotionBoot() {
  useEffect(() => {
    (window as unknown as { __rv?: boolean }).__rv = true;
  }, []);
  return null;
}

/**
 * Scroll reveal. Sets data-in once when the element enters view; CSS moves it.
 * Children of kind "stagger" get --si so they enter one after another.
 */
export function Reveal({
  as = "div",
  kind = "up",
  delay = 0,
  className = "",
  style,
  children,
  id,
  ...aria
}: {
  as?: ElementType;
  kind?: Kind;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  id?: string;
  "aria-label"?: string;
  role?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (kind === "stagger") {
      Array.from(el.children).forEach((child, i) => (child as HTMLElement).style.setProperty("--si", String(i)));
    }
    if (!motionOn()) {
      el.setAttribute("data-in", "");
      return;
    }
    return onceInView(el, () => el.setAttribute("data-in", ""));
  }, [kind]);
  const Tag = as;
  return (
    <Tag
      ref={ref}
      id={id}
      className={`${KIND_CLASS[kind]} ${className}`}
      style={{ ...(delay ? { "--d": `${delay}s` } : null), ...style } as CSSProperties}
      {...aria}
    >
      {children}
    </Tag>
  );
}

export type Segment = { text: string; className?: string };

/**
 * Heading whose words sit in masks and rise line by line (SplitText-style, ~1 KB).
 * Lines are measured after layout and again on resize. Screen readers get the
 * plain text through aria-label.
 */
export function SplitWords({
  as = "h2",
  segments,
  className = "",
  delay = 0,
  id,
}: {
  as?: ElementType;
  segments: Segment[];
  className?: string;
  delay?: number;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const label = segments.map((s) => s.text).join(" ");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    indexLines(el);
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => indexLines(el));
    };
    window.addEventListener("resize", onResize, { passive: true });
    void document.fonts?.ready.then(() => indexLines(el));
    const stop = motionOn() ? onceInView(el, () => el.setAttribute("data-in", "")) : (el.setAttribute("data-in", ""), () => {});
    return () => {
      stop();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const words: ReactNode[] = [];
  segments.forEach((seg, si) => {
    seg.text.split(" ").forEach((w, wi) => {
      if (!w) return;
      if (words.length) words.push(" ");
      words.push(
        <span key={`${si}-${wi}`} className="wd">
          <span className={`wd-i ${seg.className ?? ""}`}>{w}</span>
        </span>,
      );
    });
  });

  const Tag = as;
  return (
    <Tag
      ref={ref}
      id={id}
      className={`rv-words ${className}`}
      style={delay ? ({ "--d": `${delay}s` } as CSSProperties) : undefined}
      aria-label={label}
    >
      <span aria-hidden>{words}</span>
    </Tag>
  );
}

/** Authored lines in masks. mode "load" runs on first paint with CSS only. */
export function Lines({
  as = "h2",
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
    const Tag = as;
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
    <Reveal as={as} kind="lines" delay={delay} className={className} aria-label={label}>
      {body}
    </Reveal>
  );
}

/**
 * Number that counts up once when it enters view. Server HTML holds the final
 * value. Props stay serialisable so server components can use it.
 */
export function Count({
  value,
  prefix = "",
  suffix = "",
  grouping = true,
  ms = 900,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  grouping?: boolean;
  ms?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const format = useCallback(
    (n: number) => `${prefix}${grouping ? n.toLocaleString("en-US") : String(n)}${suffix}`,
    [prefix, suffix, grouping],
  );
  useBeforePaint(() => {
    const el = ref.current;
    if (!el) return;
    if (!motionOn()) {
      el.textContent = format(value);
      return;
    }
    // Park at zero before the first paint, then count when it is seen.
    el.textContent = format(0);
    return onceInView(el, () => countUp(el, value, format, ms), "0px");
  }, [value, ms, format]);
  return (
    <span className={`tnum ${className}`}>
      <span className="sr-only">{format(value)}</span>
      <span ref={ref} aria-hidden>
        {format(value)}
      </span>
    </span>
  );
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Odometer for block numbers: each digit is a 0–9 strip moved by transform.
 * Rolls from zero the first time it is seen, and to any later value it is given.
 */
export function Odometer({ value, className = "" }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const text = value.toLocaleString("en-US");
  useBeforePaint(() => {
    const el = ref.current;
    if (!el || !motionOn()) return;
    const strips = Array.from(el.querySelectorAll<HTMLElement>(".odo-s"));
    if (el.dataset.seen) return;
    // First sight: park every strip at 0 without a transition, then roll.
    strips.forEach((s) => {
      s.style.transition = "none";
      s.style.transform = "translate3d(0,0,0)";
    });
    return onceInView(
      el,
      () => {
        el.dataset.seen = "1";
        void el.offsetHeight;
        strips.forEach((s) => {
          s.style.transition = "";
          s.style.transform = `translate3d(0, ${-Number(s.dataset.v) * 100}%, 0)`;
        });
      },
      "0px",
    );
  }, [text]);
  const chars = Array.from(text);
  const isDigit = (ch: string) => ch >= "0" && ch <= "9";
  return (
    <span className={`odo ${className}`}>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden className="odo">
        {chars.map((ch, i) => {
          if (!isDigit(ch)) {
            return <span key={i}>{ch}</span>;
          }
          const n = Number(ch);
          const di = chars.slice(0, i).filter(isDigit).length;
          return (
            <span key={i} className="odo-d">
              <span
                className="odo-s"
                data-v={n}
                style={{ "--i": di, transform: `translate3d(0, ${-n * 100}%, 0)` } as CSSProperties}
              >
                {DIGITS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

/** Live ticker: a CSS loop that only runs while on screen (and never under reduced motion). */
export function Ticker({ children, seconds = 48, className = "", label }: { children: ReactNode; seconds?: number; className?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    return observe(el, (e) => {
      if (e.isIntersecting) el.setAttribute("data-live", "");
      else el.removeAttribute("data-live");
    });
  }, []);
  return (
    <div ref={ref} className={`ticker overflow-hidden ${className}`} role="region" aria-label={label}>
      <div className="ticker-track" style={{ "--tick-s": `${seconds}s` } as CSSProperties}>
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Pulls a CTA up to 6 px toward the pointer (fine pointers only). */
export function Magnetic({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = Math.max(-6, Math.min(6, (e.clientX - (r.left + r.width / 2)) * 0.18));
      const dy = Math.max(-6, Math.min(6, (e.clientY - (r.top + r.height / 2)) * 0.3));
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    };
    const leave = () => {
      el.style.transform = "";
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);
  return (
    <span ref={ref} className={`magnetic inline-block ${className}`}>
      {children}
    </span>
  );
}
