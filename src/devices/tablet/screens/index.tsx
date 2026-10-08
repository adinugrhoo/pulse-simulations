import type { ComponentType } from "react";
import type { TabletScreenId } from "@/sim/screens";
import { ScreenStub } from "@/components/stage/ScreenStub";
import { PosOrderScreen } from "./PosOrderScreen";
import { TablesScreen } from "./TablesScreen";
import { TablesScreenV2 } from "./TablesScreenV2";
import { useSim } from "@/sim/store";

const stub = (screenId: TabletScreenId, figmaNode?: string) => {
  const Stub = () => <ScreenStub device="tablet" screenId={screenId} figmaNode={figmaNode} />;
  Stub.displayName = `TabletStub(${screenId})`;
  return Stub;
};

/** Phase 2.0 swaps in the sectioned table management floor; Phase 1.0 keeps the original plan. */
function TablesRoute() {
  const phase = useSim((s) => s.phase);
  return phase === "2.0" ? <TablesScreenV2 /> : <TablesScreen />;
}

/**
 * Tablet screen registry. Source file: Pulse (1dQY9JolNmatfdpcDsUEfW).
 */
export const TABLET_REGISTRY: Record<TabletScreenId, ComponentType> = {
  tables: TablesRoute,
  "table-detail": stub("table-detail"),
  orders: stub("orders"),
  "order-detail": stub("order-detail"),
  "pos-order": PosOrderScreen,
  menu: stub("menu"),
  settings: stub("settings"),
};
