// Chart colours come from the tokens in styles/globals.css (docs/VISUAL-DIRECTION.md):
// up = --ok, down = --down (price falling / short side; not the veto colour),
// exits and markers = --warn, the off-chain engine = --engine.
export const CHART = {
  up: "var(--ok)",
  down: "var(--down)",
  exit: "var(--warn)",
  engine: "var(--engine)",
  ink: "var(--ink)",
  label: "var(--mute)", // axis and legend text: 5.79:1 on ink, 5.01:1 on slate-1
  mono: "var(--font-geist-mono), ui-monospace, monospace",
} as const;
