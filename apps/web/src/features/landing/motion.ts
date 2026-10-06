"use client";

import { useEffect, useRef } from "react";
import { observe, reducedMotion } from "@/features/motion/runtime";

// Loops (class "mo") only play while their container is on screen.
export function usePlay<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    return observe(el, (e) => {
      if (e.isIntersecting) el.setAttribute("data-play", "");
      else el.removeAttribute("data-play");
    });
  }, []);
  return ref;
}

// Scroll progress of a tall section through the viewport, 0 at its top reaching the
// top of the screen, 1 when its bottom reaches the bottom. Written once per frame as
// --p on the element; `onStep` gets the value for discrete changes (React state).
export function useScrollProgress<T extends HTMLElement>(onStep?: (p: number) => void, mode: "pin" | "enter" = "pin") {
  const ref = useRef<T>(null);
  const cb = useRef(onStep);
  useEffect(() => {
    cb.current = onStep;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) {
      el.style.setProperty("--p", "1");
      cb.current?.(1);
      return;
    }
    let frame = 0;
    let visible = false;
    const measure = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p =
        mode === "pin"
          ? Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)))
          : Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.85)));
      el.style.setProperty("--p", p.toFixed(4));
      cb.current?.(p);
    };
    const onScroll = () => {
      if (visible && !frame) frame = requestAnimationFrame(measure);
    };
    const stop = observe(el, (e) => {
      visible = e.isIntersecting;
      if (visible) onScroll();
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    measure();
    return () => {
      stop();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [mode]);
  return ref;
}
