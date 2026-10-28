import type { MobileTokens, PosTokens } from "@/theme/tokens";

/**
 * Global token defaults. A theme's `mobile/tokens.ts` / `tablet/tokens.ts` starts from
 * these and overrides what it changes.
 */

/** Home's maroon; the Figma source's orange primary is remapped to it everywhere on mobile. */
export const DEFAULT_MOBILE_TOKENS: MobileTokens = {
  primary: "#43263c",
};

/** The original dark "Select Dish" page (Figma 2820:17259). */
export const DEFAULT_POS_TOKENS: PosTokens = {
  page: "bg-[#151515] text-white",
  header: "border-[#222] bg-[#151515]",
  closeBtn: "border-[#3a3a3a] hover:bg-white/5",
  closeIcon: "close.svg",
  iconInv: "",
  searchLine: "border-[#f5dfa8]",
  tab: "bg-[#f5dfa8]",
  title: "text-[#fff8eb]",
  crumb: "text-[#595959]",
  ring: "ring-2 ring-white ring-offset-2 ring-offset-[#151515]",
  divider: null,
  reco: "text-[#f5dfa8]",
  sparkle: "sparkle.svg",
  bucket: "bg-[#131313]",
  ink: "text-[#fff8eb]",
  line: "border-[#222] bg-[#1b1b1a]",
  meta: "text-[#afaca2]",
  sub: "text-[#cdcdcd]",
  stepWrap: "bg-[#222]",
  stepBtn: "text-[#cdcdcd] hover:bg-white/10",
  confirmOn: "bg-[#f5dfa8] text-[#1b1b1a]",
  confirmOff: "bg-[#383736] text-[#676665]",
  row: "border-[#222] bg-[#191919] text-[#fff8eb]",
};
