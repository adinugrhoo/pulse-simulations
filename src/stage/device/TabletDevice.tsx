"use client";

import { DEVICES } from "@/config/global";
import { registryFor } from "@/config/phases/screens";
import { useSim } from "@/engine/store";
import { useThemeId } from "@/theme/hooks";
import { DeviceFrame } from "./DeviceFrame";
import { QrPrintOverlay } from "./QrPrintOverlay";
import { SignalLayer } from "./SignalLayer";

export function TabletDevice() {
  const phase = useSim((s) => s.phase);
  const screen = useSim((s) => s.screens.tablet);
  const themeId = useThemeId();
  const Screen = registryFor("tablet", phase, themeId)[screen];

  return (
    <DeviceFrame
      spec={DEVICES.tablet}
    >
      <SignalLayer device="tablet" />
      <QrPrintOverlay />
      <Screen />
    </DeviceFrame>
  );
}
