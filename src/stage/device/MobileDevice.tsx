"use client";

import { DEVICES } from "@/config/global";
import { registryFor } from "@/config/phases/screens";
import { useSim } from "@/engine/store";
import { useThemeConfig } from "@/theme/hooks";
import { mobileCssVars } from "@/theme/tokens";
import { TerminalIdleScreen } from "@/screens/terminal/TerminalIdleScreen";
import {
  TerminalApprovedScreen,
  TerminalProcessingScreen,
  TerminalSuccessScreen,
  TerminalTapCardScreen,
} from "@/screens/terminal/TerminalPaymentScreens";
import { DeviceFrame } from "./DeviceFrame";
import { SignalLayer } from "./SignalLayer";

const TERMINAL_SCREENS = {
  idle: TerminalIdleScreen,
  processing: TerminalProcessingScreen,
  "tap-card": TerminalTapCardScreen,
  done: TerminalApprovedScreen,
  success: TerminalSuccessScreen,
};

export function MobileDevice() {
  const phase = useSim((s) => s.phase);
  const terminal = useSim((s) => s.paymentMode) === "terminal";
  const terminalScreen = useSim((s) => s.terminal.screen);
  const TerminalScreen = TERMINAL_SCREENS[terminalScreen];
  const screen = useSim((s) => s.screens.mobile);
  const cartCount = useSim((s) => s.customer.cart.reduce((n, l) => n + l.qty, 0));
  const theme = useThemeConfig();
  const Screen = registryFor("mobile", phase, theme.id)[screen];

  return (
    <DeviceFrame
      spec={terminal ? DEVICES.terminal : DEVICES.mobile}
      style={mobileCssVars(theme.mobile.tokens)}
      badge={
        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300">
          {terminal ? terminalScreen : screen}
          {!terminal && cartCount ? ` · cart ${cartCount}` : ""}
        </span>
      }
    >
      {terminal ? (
        <TerminalScreen />
      ) : (
        <>
          <SignalLayer device="mobile" />
          <Screen />
        </>
      )}
    </DeviceFrame>
  );
}
