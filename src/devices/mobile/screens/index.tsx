import type { ComponentType } from "react";
import type { MobileScreenId } from "@/sim/screens";
import { ScreenStub } from "@/components/stage/ScreenStub";
import { LoginScreen } from "./LoginScreen";
import { MenuScreen } from "./MenuScreen";
import { CartScreen } from "./CartScreen";
import { OrderPlacedScreen } from "./OrderPlacedScreen";
import { BillScreen } from "./BillScreen";
import { PaymentSuccessScreen } from "./PaymentSuccessScreen";
import { BillLoadingScreen, PaymentPartialScreen, PaymentProcessingScreen } from "./SplitFlowScreens";

const stub = (screenId: MobileScreenId, figmaNode?: string) => {
  const Stub = () => <ScreenStub device="mobile" screenId={screenId} figmaNode={figmaNode} />;
  Stub.displayName = `MobileStub(${screenId})`;
  return Stub;
};

/**
 * Mobile screen registry. Swap a stub for the real Figma-derived component
 * as each frame is implemented — nothing else in the sim changes.
 * Source file: SmartWeb Pro 2025 H1 (89SpK7vpXh1TxhlGB1rYtJ).
 */
export const MOBILE_REGISTRY: Record<MobileScreenId, ComponentType> = {
  login: LoginScreen,
  menu: MenuScreen,
  "item-detail": stub("item-detail"),
  cart: CartScreen,
  "order-placed": OrderPlacedScreen,
  "order-status": stub("order-status"),
  bill: BillScreen,
  "bill-loading": BillLoadingScreen,
  "payment-processing": PaymentProcessingScreen,
  "payment-partial": PaymentPartialScreen,
  "payment-success": PaymentSuccessScreen,
};
