export type DeviceId = "mobile" | "tablet";

export type DeviceSpec = {
  id: DeviceId;
  label: string;
  /** Logical CSS pixel size of the Figma frame. Screens are authored at exactly this size. */
  width: number;
  height: number;
  /** Visual bezel thickness around the viewport. */
  bezel: number;
  radius: number;
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
};
