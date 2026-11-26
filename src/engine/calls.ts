import type { Table, WaiterCall } from "./types";

/** Only a table with a party at it can call for a waiter. */
export const canCall = (t: Table) => t.status === "occupied" || t.status === "partial" || t.status === "billed";

/** Hotkey 2: the first seated table on the floor that has no call yet, so presses walk the floor in order. */
export const nextCaller = (tables: Table[]): Table | undefined => tables.find((t) => canCall(t) && !t.call);

/**
 * Hotkey 3: the first table on the floor with an open call that hasn't rung again yet, the
 * same floor order as hotkey 2. Accepting a call clears `again`, so that table can ring again.
 */
export const nextRecaller = (tables: Table[]): Table | undefined => tables.find((t) => t.call && !t.call.again);

/** Hotkey 4: the first table on the floor with an open call, whatever its state, cancels it. */
export const nextDismisser = (tables: Table[]): Table | undefined => tables.find((t) => t.call);

export type ActiveCall = { table: Table; call: WaiterCall };

/** Every open call, longest wait first. */
export const activeCalls = (tables: Table[]): ActiveCall[] =>
  tables.flatMap((table) => (table.call ? [{ table, call: table.call }] : [])).sort((a, b) => a.call.at - b.call.at);

/** How long a guest has waited: "8s", "2m 05s", "1h 12m". */
export const formatWaited = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};
