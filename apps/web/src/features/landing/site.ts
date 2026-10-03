export interface NavLink {
  label: string;
  href: string;
}

export const site = {
  name: "DRIFT",
  tagline: "Off-chain quant research. An on-chain risk gate anyone can check.",
  contact: "dex.bennett28@gmail.com",
  repo: "https://github.com/Stylenecy/seed-bnb/tree/dex/drift/drift",
  sourcify: "https://repo.sourcify.dev/97/0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D",
  nav: [
    { label: "How it works", href: "/#how" },
    { label: "The halt", href: "/#halt" },
    { label: "Engine", href: "/#engine" },
    { label: "MacroGuard", href: "/macroguard" },
  ] as NavLink[],
} as const;
