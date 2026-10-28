import type { Table } from "@/engine/types";

/** Floor plan mirrors the Pulse tablet frame (1802:11665): 15 tables, 3 rows of 5. */
export const SEED_TABLES: Table[] = [
  { id: "t01", label: "Table 01", status: "vacant" },
  { id: "t02", label: "Table 02", status: "vacant" },
  { id: "t03", label: "Table 03", status: "vacant" },
  { id: "t04", label: "Table 04", status: "partial", guestName: "Lewis", guests: 6, seatedMinutes: 80, balance: 75, paidBill: 25, tips: 10 },
  { id: "t05", label: "Table 05", status: "vacant" },
  { id: "t06", label: "Table 06", status: "occupied", guestName: "Lewis", guests: 1, seatedMinutes: 135, totalBill: 25.4 },
  { id: "t07", label: "Table 07", status: "vacant" },
  { id: "t08", label: "Table 08", status: "billed", guestName: "Ash", guests: 4, seatedMinutes: 135, paidBill: 42.5, overpaid: 2.5 },
  { id: "t09", label: "Table 09", status: "vacant" },
  { id: "t10", label: "Table 10", status: "vacant" },
  { id: "t11", label: "Table 11", status: "billed", guestName: "Guest", guests: 4, seatedMinutes: 135, paidBill: 39.75 },
  { id: "t12", label: "Table 12", status: "occupied", guestName: "Morris", guests: 4, seatedMinutes: 135, totalBill: 20.35 },
  { id: "t13", label: "Table 13", status: "vacant" },
  { id: "t14", label: "Table 14", status: "occupied", guestName: "Guest", guests: 4, seatedMinutes: 135, totalBill: 36.75 },
  { id: "t15", label: "Table 15", status: "vacant" },
];

/** The table the customer scans into by default. */
export const DEFAULT_TABLE_ID = "t03";
