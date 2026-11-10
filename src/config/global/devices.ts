export type DeviceId = "mobile" | "tablet" | "terminal";

export type DeviceSpec = {
  id: DeviceId;
  label: string;
  /** Logical CSS pixel size of the Figma frame. Screens are authored at exactly this size. */
  width: number;
  height: number;
  /** Visual bezel thickness around the viewport. */
  bezel: number;
  radius: number;
  /**
   * Photo of the hardware drawn instead of a bezel. `screen` is the display's box in the photo's
   * own pixels; the screens (still authored at width x height) scale to fit inside it.
   */
  skin?: { src: string; width: number; height: number; screen: { x: number; y: number; width: number; height: number } };
  /**
   * Photo bezel that adapts to the frame instead of setting its size: the frame keeps its
   * bezel-based footprint, the photo's body fills it (a 9-slice, so only the straight edges
   * stretch) and `parts` (buttons, a printer dock...) sit on top at their own size, free to
   * stick out above the frame. All numbers are in the body image's pixels.
   */
  photo?: {
    src: string;
    width: number;
    height: number;
    /** Where the screen starts on each side, in the image. Can sit inside the photo's own display edge. */
    slice: { top: number; right: number; bottom: number; left: number };
    /** Screen corner radius in the image's pixels, so the corners follow the photo's glass. */
    screenRadius: number;
    /** `x` counts from the body's left, centre or right edge; `y` from its top (negative = above). */
    parts: { src: string; width: number; height: number; x: number; y: number; anchor: "left" | "center" | "right" }[];
  };
};

/** Mobile frame comes from SmartWeb Pro (375x812). Tablet frame comes from Pulse (1280x800). */
export const DEVICES: Record<DeviceId, DeviceSpec> = {
  mobile: {
    id: "mobile",
    label: "Customer · Mobile",
    width: 375,
    height: 812,
    bezel: 12,
    radius: 44,
  },
  tablet: {
    id: "tablet",
    label: "Waiter · Tablet",
    width: 1280,
    height: 800,
    bezel: 16,
    radius: 28,
    // Sunmi V3 MIX, cut from public/devices/sunmi-v3-mix.png (1500px export)
    photo: {
      src: "/devices/sunmi-body.png",
      width: 1383,
      height: 846,
      // the screen runs over the photo's glass (camera included) up to the rim, inset 9px; its
      // corners round to follow the glass's ~30px corners so they never touch the frame
      slice: { top: 45, right: 30, bottom: 17, left: 29 },
      screenRadius: 24,
      parts: [
        { src: "/devices/sunmi-buttons.png", width: 243, height: 111, x: 72, y: -22, anchor: "left" },
        // dock centre sits 12px left of the body's
        { src: "/devices/sunmi-dock.png", width: 784, height: 501, x: -12, y: -412, anchor: "center" },
        { src: "/devices/sunmi-notch.png", width: 188, height: 106, x: 51, y: -17, anchor: "right" },
      ],
    },
  },
  // Payment mode "terminal": an Adyen takes the customer phone's place. Screens come from
  // Terminal Payment 1.0, authored at 360x800
  terminal: {
    id: "terminal",
    label: "Payment Terminal · Adyen",
    width: 360,
    height: 800,
    bezel: 0,
    radius: 0,
    skin: {
      src: "/devices/terminal.png",
      width: 762,
      height: 2042,
      screen: { x: 58, y: 574, width: 636, height: 1280 },
    },
  },
};
