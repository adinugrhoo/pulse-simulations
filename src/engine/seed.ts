import { SEED_TABLES, SECTIONS, tableLabel } from "@/config/global";
import type { Dish } from "@/menu/types";
import { itemsFor } from "./bill";
import type { CartLine, Order, Table } from "./types";

/** Phase 1.0 floor: a fresh copy of the 15 Pulse tables. */
export const seedTablesV1 = (): Table[] => SEED_TABLES.map((t) => ({ ...t }));

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
const linesForBill = (catalog: Dish[], tableId: string, bill: number): CartLine[] => {
  const rand = rngFor(tableId);
  const cents = (n: number) => Math.round(n * 100);
  let remaining = cents(bill);
  const lines: CartLine[] = [];
  for (;;) {
    // free dishes never shrink the remainder; skipping them keeps the loop finite
    const fits = catalog.filter((d) => cents(d.price) > 0 && cents(d.price) <= remaining);
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
 * with the items behind it. Freshly opened and vacant tables stay empty. `catalog` is the
 * customer menu of the active phase + theme.
 */
export const seedOrders = (tables: Table[], catalog: Dish[]): Order[] =>
  tables.flatMap((t) => {
    const bill = tableBill(t);
    if (bill <= 0) return [];
    // the bill is a grand total (items + service + GST), so the order behind it holds the items
    const items = itemsFor(bill);
    const lines = linesForBill(catalog, t.id, items);
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
