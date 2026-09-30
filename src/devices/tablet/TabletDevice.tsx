"use client";

import { DeviceFrame } from "@/components/stage/DeviceFrame";
import { SignalLayer } from "@/components/stage/SignalLayer";
import { DEVICES } from "@/sim/devices";
import { useSim } from "@/sim/store";
import { TABLET_REGISTRY } from "./screens";

export function TabletDevice() {
  const screen = useSim((s) => s.screens.tablet);
  const openOrders = useSim((s) => s.orders.filter((o) => o.status === "submitted").length);
  const Screen = TABLET_REGISTRY[screen];

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
