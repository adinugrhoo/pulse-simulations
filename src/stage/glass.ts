/**
 * Liquid-glass surfaces for the floating stage chrome (FAB, scenario bar, sidebar): a
 * light tint over a strong blur and saturation boost, a hairline rim and a top highlight.
 * Text on them stays neutral-100/300, which keeps it readable over the device screens.
 */
export const GLASS =
  "border border-white/[0.12] bg-neutral-900/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-[1.8]";

/** Denser glass for panels that hold a lot of text (sidebar, dropdown panels). */
export const GLASS_PANEL =
  "border border-white/[0.1] bg-neutral-900/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-3xl backdrop-saturate-[1.8]";

/** Controls sitting on glass: a faint fill that brightens on hover. */
export const GLASS_CONTROL = "border border-white/[0.08] bg-white/[0.06] hover:bg-white/[0.1]";

/**
 * Progressive blur bands for a fixed top edge: each layer blurs harder and is masked to a
 * shorter stretch from the top, so content softens gradually into the glass chrome instead
 * of meeting a hard line.
 */
export const PROGRESSIVE_BLUR = [
  { blur: 1, stop: 100 },
  { blur: 2, stop: 80 },
  { blur: 4, stop: 60 },
  { blur: 8, stop: 42 },
  { blur: 16, stop: 26 },
];
