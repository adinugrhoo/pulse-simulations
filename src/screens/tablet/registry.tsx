import type { TabletRegistry } from "@/config/types";
import type { TabletScreenId } from "@/engine/screens";
import { ScreenStub } from "@/stage/device/ScreenStub";
import { PosOrderScreen } from "./pos/PosOrderScreen";
import { TablesScreen } from "./tables/TablesScreen";

const stub = (screenId: TabletScreenId, figmaNode?: string) => {
  const Stub = () => <ScreenStub device="tablet" screenId={screenId} figmaNode={figmaNode} />;
  Stub.displayName = `TabletStub(${screenId})`;
  return Stub;
};

/**
 * Default tablet screens. A phase's `screens.ts` starts from this (Phase 2.0 swaps
 * `tables` for the sectioned floor) and a theme's `tablet/screens.ts` can swap any entry.
 * Source file: Pulse (1dQY9JolNmatfdpcDsUEfW).
 */
export const TABLET_REGISTRY: TabletRegistry = {
  tables: TablesScreen,
  "table-detail": stub("table-detail"),
  orders: stub("orders"),
  "order-detail": stub("order-detail"),
  "pos-order": PosOrderScreen,
  menu: stub("menu"),
  settings: stub("settings"),
};
