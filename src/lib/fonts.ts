import { Figtree } from "next/font/google";

/** Figma frames use Figtree end to end — scope it to device screens via className. */
export const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
});
