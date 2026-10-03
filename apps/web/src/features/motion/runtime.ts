// DRIFT motion runtime: one IntersectionObserver per option set, no animation
// loop while idle. Reveals only flip a data attribute; CSS (globals.css) does the
// moving with transform, opacity and clip-path. Counters run one short rAF burst
// and stop. Rules: DEX-MOTION-LANGUAGE.md §4, docs/VISUAL-DIRECTION.md.

type Callback = (entry: IntersectionObserverEntry) => void;

const observers = new Map<string, { io: IntersectionObserver; callbacks: Map<Element, Callback> }>();

function observer(rootMargin: string, threshold: number) {
  const key = `${rootMargin}|${threshold}`;
  let entry = observers.get(key);
  if (!entry) {
    const callbacks = new Map<Element, Callback>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) callbacks.get(e.target)?.(e);
      },
      { rootMargin, threshold },
    );
    entry = { io, callbacks };
    observers.set(key, entry);
  }
  return entry;
}

export function observe(el: Element, cb: Callback, rootMargin = "0px", threshold = 0): () => void {
  const { io, callbacks } = observer(rootMargin, threshold);
  callbacks.set(el, cb);
  io.observe(el);
  return () => {
    io.unobserve(el);
    callbacks.delete(el);
  };
}

/** Runs fn once, the first time el enters the lower 88% of the viewport. */
export function onceInView(el: Element, fn: () => void, rootMargin = "0px 0px -12% 0px"): () => void {
  let stop = () => {};
  stop = observe(
    el,
    (e) => {
      if (e.isIntersecting) {
        stop();
        fn();
      }
    },
    rootMargin,
  );
  return stop;
}

/** True when start states are active (html.js): JS on and no reduced motion. */
export function motionOn(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("js");
}

export function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

/** Counts text from 0 to value once, in a short rAF burst that ends by itself. */
export function countUp(el: HTMLElement, value: number, format: (n: number) => string, ms = 900): void {
  if (!motionOn()) {
    el.textContent = format(value);
    return;
  }
  const start = performance.now();
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    el.textContent = format(t >= 1 ? value : Math.round(value * easeOut(t)));
    if (t < 1) requestAnimationFrame(frame);
  };
  el.textContent = format(0);
  requestAnimationFrame(frame);
}

/** Groups word masks by their rendered line, so a heading rises line by line. */
export function indexLines(root: HTMLElement): void {
  const words = root.querySelectorAll<HTMLElement>(".wd");
  let line = -1;
  let top = Number.NEGATIVE_INFINITY;
  words.forEach((w) => {
    const t = w.offsetTop;
    if (t > top + 2) {
      line += 1;
      top = t;
    }
    w.style.setProperty("--l", String(line));
  });
}
