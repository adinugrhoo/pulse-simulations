"use client";

import { DEVICES } from "@/config/global";
import { registryFor } from "@/config/phases/screens";
import { useSim } from "@/engine/store";
import { useThemeId } from "@/theme/hooks";
import { DeviceFrame } from "./DeviceFrame";
import { SignalLayer } from "./SignalLayer";

export function TabletDevice() {
  const phase = useSim((s) => s.phase);
  const screen = useSim((s) => s.screens.tablet);
  const openOrders = useSim((s) => s.orders.filter((o) => o.status === "submitted").length);
  const themeId = useThemeId();
  const Screen = registryFor("tablet", phase, themeId)[screen];

  return (
    <DeviceFrame
      spec={DEVICES.tablet}
      badge={
        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300">
          {screen}
          {openOrders ? ` · ${openOrders} new` : ""}
        </span>
      }
    >
      <SignalLayer device="tablet" />
      <Screen />
    </DeviceFrame>
  );
}
