import type { CSSProperties } from "react";

/**
 * Token contracts between a theme's `mobile/` / `tablet/` folder and the screens that
 * read them. Adding a token = add the key here, then every theme must fill it in
 * (the compiler lists the ones that don't).
 */

/** Mobile tokens become CSS variables on the device root (`--mobile-primary`). */
export type MobileTokens = {
  /** Brand colour: CTAs, active tab, category underline. */
  primary: string;
};

/** Class-name tokens for the tablet POS "Select Dish" page. */
export type PosTokens = {
  page: string;
  header: string;
  closeBtn: string;
  /** Close icon file under /figma/tablet-pos. */
  closeIcon: string;
  /** Class that flips light-on-dark icons for light pages ("" or "invert"). */
  iconInv: string;
  searchLine: string;
  tab: string;
  title: string;
  /** Inactive breadcrumb tab on the subcategory page (Figma 3124:278). */
  crumb: string;
  ring: string;
  /** Section divider class; null draws the Figma hairline svg instead. */
  divider: string | null;
  reco: string;
  /** Sparkle icon file under /figma/tablet-pos. */
  sparkle: string;
  bucket: string;
  ink: string;
  line: string;
  meta: string;
  sub: string;
  stepWrap: string;
  stepBtn: string;
  confirmOn: string;
  confirmOff: string;
  row: string;
};

export type TabletTokens = {
  pos: PosTokens;
};

export type DeviceTokens = { mobile: MobileTokens; tablet: TabletTokens };

/** CSS variables a device root sets from its tokens. */
export const mobileCssVars = (t: MobileTokens) => ({ "--mobile-primary": t.primary }) as CSSProperties;
