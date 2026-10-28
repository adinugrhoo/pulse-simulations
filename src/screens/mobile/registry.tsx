import type { MobileRegistry } from "@/config/types";
import type { MobileScreenId } from "@/engine/screens";
import { ScreenStub } from "@/stage/device/ScreenStub";
import { BillScreen } from "./bill/BillScreen";
import { CartScreen } from "./cart/CartScreen";
import { LoginScreen } from "./login/LoginScreen";
import { MenuScreen } from "./menu/MenuScreen";
import { OrderPlacedScreen } from "./order/OrderPlacedScreen";
import { PaymentSuccessScreen } from "./payment/PaymentSuccessScreen";
import { BillLoadingScreen, PaymentPartialScreen, PaymentProcessingScreen } from "./payment/SplitFlowScreens";

const stub = (screenId: MobileScreenId, figmaNode?: string) => {
  const Stub = () => <ScreenStub device="mobile" screenId={screenId} figmaNode={figmaNode} />;
  Stub.displayName = `MobileStub(${screenId})`;
  return Stub;
};

/**
 * Default mobile screens. A phase's `screens.ts` starts from this and a theme's
 * `mobile/screens.ts` can swap any entry. Source file: SmartWeb Pro 2025 H1 (89SpK7vpXh1TxhlGB1rYtJ).
 */
export const MOBILE_REGISTRY: MobileRegistry = {
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
