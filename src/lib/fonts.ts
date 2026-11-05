import { Figtree, Roboto, Rubik } from "next/font/google";

/** Figma frames use Figtree end to end — scope it to device screens via className. */
export const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
});

/** The terminal's card-reader screens (tap card, done) are set in Roboto in the Terminal Payment file. */
export const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-roboto",
});

/** The tablet's own card reader screens (same-device payment: present card, approved) use Rubik. */
export const rubik = Rubik({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rubik",
});
