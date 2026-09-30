import type { MenuItem, Table } from "./types";

/** Floor plan mirrors the Pulse tablet frame (1802:11665): 15 tables, 3 rows of 5. */
export const SEED_TABLES: Table[] = [
  { id: "t01", label: "Table 01", status: "vacant" },
  { id: "t02", label: "Table 02", status: "vacant" },
  { id: "t03", label: "Table 03", status: "vacant" },
  { id: "t04", label: "Table 04", status: "partial", guestName: "Lewis", guests: 6, seatedMinutes: 80, balance: 75, paidBill: 25 },
  { id: "t05", label: "Table 05", status: "vacant" },
  { id: "t06", label: "Table 06", status: "occupied", guestName: "Lewis", guests: 1, seatedMinutes: 135, totalBill: 25.4 },
  { id: "t07", label: "Table 07", status: "vacant" },
  { id: "t08", label: "Table 08", status: "billed", guestName: "Guest", guests: 4, seatedMinutes: 135, paidBill: 42.5 },
  { id: "t09", label: "Table 09", status: "vacant" },
  { id: "t10", label: "Table 10", status: "vacant" },
  { id: "t11", label: "Table 11", status: "billed", guestName: "Guest", guests: 4, seatedMinutes: 135, paidBill: 39.75 },
  { id: "t12", label: "Table 12", status: "occupied", guestName: "Morris", guests: 4, seatedMinutes: 135, totalBill: 20.35 },
  { id: "t13", label: "Table 13", status: "vacant" },
  { id: "t14", label: "Table 14", status: "occupied", guestName: "Guest", guests: 4, seatedMinutes: 135, totalBill: 36.75 },
  { id: "t15", label: "Table 15", status: "vacant" },
];

export const SEED_MENU: MenuItem[] = [
  { id: "m1", name: "Truffle Fries", price: 9.5, category: "Starters", description: "Parmesan, truffle oil, chives" },
  { id: "m2", name: "Crispy Calamari", price: 14.0, category: "Starters", description: "Lemon aioli" },
  { id: "m3", name: "Berczy Burger", price: 22.0, category: "Mains", description: "Double patty, aged cheddar" },
  { id: "m4", name: "Grilled Salmon", price: 28.5, category: "Mains", description: "Charred lemon, asparagus" },
  { id: "m5", name: "Margherita Pizza", price: 19.0, category: "Mains", description: "San Marzano, basil" },
  { id: "m6", name: "Sticky Date Pudding", price: 11.0, category: "Desserts", description: "Butterscotch, vanilla ice cream" },
  { id: "m7", name: "Iced Latte", price: 6.5, category: "Drinks" },
  { id: "m8", name: "Craft Lager", price: 12.0, category: "Drinks" },
];

/** The table the customer scans into by default. */
export const DEFAULT_TABLE_ID = "t03";
