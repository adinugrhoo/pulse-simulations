import type { ComponentType } from "react";
import type { TabletScreenId } from "@/sim/screens";
import { ScreenStub } from "@/components/stage/ScreenStub";
import { TablesScreen } from "./TablesScreen";

const stub = (screenId: TabletScreenId, figmaNode?: string) => {
  const Stub = () => <ScreenStub device="tablet" screenId={screenId} figmaNode={figmaNode} />;
  Stub.displayName = `TabletStub(${screenId})`;
  return Stub;
};

/**
 * Tablet screen registry. Source file: Pulse (1dQY9JolNmatfdpcDsUEfW).
 */
export const TABLET_REGISTRY: Record<TabletScreenId, ComponentType> = {
  tables: TablesScreen,
  "table-detail": stub("table-detail"),
  orders: stub("orders"),
  "order-detail": stub("order-detail"),
  menu: stub("menu"),
  settings: stub("settings"),
};
