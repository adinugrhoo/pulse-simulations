"use client";

import { DEVICES } from "@/config/global";
import { registryFor } from "@/config/phases/screens";
import { useSim } from "@/engine/store";
import { useThemeConfig } from "@/theme/hooks";
import { mobileCssVars } from "@/theme/tokens";
import { DeviceFrame } from "./DeviceFrame";
import { SignalLayer } from "./SignalLayer";

export function MobileDevice() {
  const phase = useSim((s) => s.phase);
  const screen = useSim((s) => s.screens.mobile);
  const cartCount = useSim((s) => s.customer.cart.reduce((n, l) => n + l.qty, 0));
  const theme = useThemeConfig();
  const Screen = registryFor("mobile", phase, theme.id)[screen];

  return (
    <DeviceFrame
      spec={DEVICES.mobile}
      style={mobileCssVars(theme.mobile.tokens)}
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
