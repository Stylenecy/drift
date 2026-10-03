export interface NavLink {
  label: string;
  href: string;
}

export const site = {
  name: "DRIFT",
  tagline: "Off-chain quant research. An on-chain risk gate anyone can check.",
  contact: "dex.bennett28@gmail.com",
  repo: "https://github.com/Stylenecy/seed-bnb/tree/dex/drift/drift",
  nav: [
    { label: "DRIFT", href: "/" },
    { label: "How it works", href: "/#how" },
    { label: "MacroGuard", href: "/macroguard" },
  ] as NavLink[],
} as const;
