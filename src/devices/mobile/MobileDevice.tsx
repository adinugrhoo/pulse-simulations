"use client";

import { DeviceFrame } from "@/components/stage/DeviceFrame";
import { SignalLayer } from "@/components/stage/SignalLayer";
import { DEVICES } from "@/sim/devices";
import { useSim } from "@/sim/store";
import { MOBILE_REGISTRY } from "./screens";

export function MobileDevice() {
  const screen = useSim((s) => s.screens.mobile);
  const cartCount = useSim((s) => s.customer.cart.reduce((n, l) => n + l.qty, 0));
  const Screen = MOBILE_REGISTRY[screen];

  return (
    <DeviceFrame
      spec={DEVICES.mobile}
      badge={
        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300">
          {screen}
          {cartCount ? ` · cart ${cartCount}` : ""}
        </span>
      }
    >
      <SignalLayer device="mobile" />
      <Screen />
    </DeviceFrame>
  );
}
