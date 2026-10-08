import { itemsFor } from "./bill";
import { SECTIONS, tableLabel } from "./sections";
import { MENU_CATALOG } from "./menuCatalog";
import type { CartLine, MenuItem, Order, Table } from "./types";

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

/* ------------------------ Phase 2.0: sectioned floor ----------------------- */

const GUESTS = ["Lewis", "Moreno", "Morris", "Guest", "Nadia", "Kenji", "Priya", "Adi"];

/** Deterministic mix of vacant / seated / part-paid / paid / just-closed so every section has some of each. */
const generatedTable = (sectionIndex: number, sectionId: string, id: string, label: string, n: number): Table => {
  const base = { id, label, section: sectionId };
  const roll = (sectionIndex * 7 + n * 3) % 10;
  if (roll < 5) return { ...base, status: "vacant" };

  const guestName = GUESTS[(sectionIndex + n) % GUESTS.length];
  const guests = 1 + ((n + sectionIndex) % 6);
  const seatedMinutes = 15 + ((n * 17 + sectionIndex * 11) % 150);
  const bill = 12 + ((n * 37 + sectionIndex * 19) % 8000) / 100;
  const amount = Math.round(bill * 100) / 100;

  if (roll <= 6) return { ...base, status: "occupied", guestName, guests, seatedMinutes, totalBill: amount };
  if (roll === 7) {
    const paidBill = Math.round(amount * 0.3 * 100) / 100;
    return { ...base, status: "partial", guestName, guests, seatedMinutes, paidBill, tips: Math.round(amount * 0.05 * 100) / 100, balance: Math.round((amount - paidBill) * 100) / 100 };
  }
  if (roll === 8) return { ...base, status: "billed", guestName, guests, seatedMinutes, paidBill: amount };
  // a party that paid and left a moment ago: the table is vacant but remembers them
  return { ...base, status: "vacant", lastSession: { paidBill: amount, minutesAgo: 1 + ((n * 5 + sectionIndex * 3) % 28) } };
};

/**
 * Every table across the 25 sections. Main Dining keeps the 15 hand-placed tables from the
 * Pulse frame (t01-t15, so the scripted flow still seats Table 03) and generates 16-20.
 */
export const seedTablesV2 = (): Table[] =>
  SECTIONS.flatMap((section, sectionIndex) =>
    Array.from({ length: section.to - section.from + 1 }, (_, i) => {
      const n = section.from + i;
      if (sectionIndex === 0 && n <= SEED_TABLES.length) return { ...SEED_TABLES[n - 1], section: section.id };
      const id = sectionIndex === 0 ? `t${String(n).padStart(2, "0")}` : `${section.id}-${String(n).padStart(2, "0")}`;
      return generatedTable(sectionIndex, section.id, id, tableLabel(section, n), n);
    }),
  );

/* ------------------------------ seeded orders ------------------------------ */

/** What a seated table owes in total, read the same way the order detail reads it. */
const tableBill = (t: Table): number => {
  if (t.status === "occupied") return t.totalBill ?? 0;
  if (t.status === "partial") return (t.paidBill ?? 0) + (t.balance ?? 0);
  if (t.status === "billed") return t.paidBill ?? 0;
  return 0;
};

/** Small seeded PRNG so every reset fills each table with the same dishes. */
const rngFor = (seed: string) => {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    return h / 4294967296;
  };
};

/**
 * Catalog dishes that add up to exactly `bill`. Dishes fill it until none fits the
 * remainder; whatever is left goes on a service charge line, so the lines always match
 * the bill the floor card already shows (and recalcTableBill keeps it when items are added).
 */
const linesForBill = (tableId: string, bill: number): CartLine[] => {
  const rand = rngFor(tableId);
  const cents = (n: number) => Math.round(n * 100);
  let remaining = cents(bill);
  const lines: CartLine[] = [];
  for (;;) {
    const fits = MENU_CATALOG.filter((d) => cents(d.price) <= remaining);
    if (!fits.length) break;
    const dish = fits[Math.floor(rand() * fits.length)];
    const existing = lines.find((l) => l.itemId === dish.id);
    if (existing) existing.qty += 1;
    else lines.push({ lineId: `${tableId}-${dish.id}`, itemId: dish.id, name: dish.name, unitPrice: dish.price, qty: 1 });
    remaining -= cents(dish.price);
  }
  if (remaining > 0) {
    lines.push({ lineId: `${tableId}-svc`, itemId: "svc", name: "Service charge & GST", unitPrice: remaining / 100, qty: 1 });
  }
  return lines;
};

/**
 * One already-served order per seated table, so a table whose card carries a bill opens
 * with the items behind it. Freshly opened and vacant tables stay empty.
 */
export const seedOrders = (tables: Table[]): Order[] =>
  tables.flatMap((t) => {
    const bill = tableBill(t);
    if (bill <= 0) return [];
    // the bill is a grand total (items + service + GST), so the order behind it holds the items
    const items = itemsFor(bill);
    const lines = linesForBill(t.id, items);
    return [
      {
        id: `seed-${t.id}`,
        tableId: t.id,
        source: "customer" as const,
        status: t.status === "billed" ? ("paid" as const) : ("served" as const),
        lines,
        placedAtTick: 0,
        total: items,
      },
    ];
  });
