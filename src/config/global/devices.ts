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
      src: "/devices/adyen.png",
      width: 542,
      height: 1249,
      screen: { x: 52, y: 391, width: 439, height: 790 },
    },
  },
};
