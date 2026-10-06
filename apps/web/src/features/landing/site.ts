export interface NavLink {
  label: string;
  href: string;
}

export const site = {
  name: "DRIFT",
  tagline: "A trading bot with a brake anyone can check.",
  contact: "dex.bennett28@gmail.com",
  repo: "https://github.com/Stylenecy/drift",
  sourcify: "https://repo.sourcify.dev/97/0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D",
  nav: [
    { label: "How it works", href: "/#how" },
    { label: "The limit", href: "/#limit" },
    { label: "Try it", href: "/#try" },
    { label: "FAQ", href: "/#faq" },
  ] as NavLink[],
} as const;
