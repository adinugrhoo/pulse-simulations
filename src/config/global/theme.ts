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
  // Pulse gold, as Table Detail's "Guest list" title
  title: "text-[#fcdfa2]",
  crumb: "text-[#595959]",
  ring: "ring-2 ring-[#f5dfa8] ring-offset-2 ring-offset-[#151515]",
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
  // Table Detail's Pay Bill (Figma GRAD_PAY) and its disabled buttons
  confirmOn:
    "border border-[#e8bc6b] bg-[linear-gradient(85.8deg,#aa7f1e_0%,#90690e_52%,#aa8225_99.8%)] text-[#ffffef]",
  confirmOff: "border border-transparent bg-[#3a3a3a] text-[#939393]",
  secondary:
    "border border-[#e8bc6b] bg-[linear-gradient(86.6deg,rgba(170,127,30,0.3)_0%,rgba(144,105,14,0.3)_52%,rgba(170,130,37,0.3)_99.8%)] text-[#fff8eb]",
  outline: "border border-[#6e5e41] bg-[#1b1b1b] text-[#fff8eb]",
  row: "border-[#222] bg-[#191919] text-[#fff8eb]",
  muted: "text-[#6b6b6b]",
  warn: "text-[#f5d58a]",
};
