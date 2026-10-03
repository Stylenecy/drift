// /macroguard sets its own Open Graph title, which replaces the root openGraph
// object, so the share card is declared here as well.
import { OG_ALT, ogCard } from "@/features/landing/ogCard";

export const alt = OG_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function MacroGuardOpenGraphImage() {
  return ogCard();
}
