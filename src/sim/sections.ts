/**
 * Floor sections for the Phase 2.0 table management view. Each section owns a run of
 * numbered tables; labels repeat across sections (Indoor and Main Dining both have a
 * "Table 01"), so tables are keyed by section, not by label.
 */
export type SectionDef = {
  id: string;
  name: string;
  /** Label prefix: "Table 01", "Bar 01", "Seat 01"... */
  prefix: string;
  from: number;
  to: number;
};

const section = (name: string, prefix: string, from: number, to: number): SectionDef => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name,
  prefix,
  from,
  to,
});

export const SECTIONS: SectionDef[] = [
  section("Main Dining", "Table", 1, 20),
  section("Outdoor", "Table", 21, 30),
  section("Indoor", "Table", 1, 15),
  section("Terrace", "Table", 31, 35),
  section("Patio", "Table", 36, 40),
  section("Rooftop", "Table", 41, 48),
  section("Garden", "Table", 49, 55),
  section("Bar", "Bar", 1, 8),
  section("Lounge", "Lounge", 1, 6),
  section("Private Room", "Room", 1, 3),
  section("VIP Room", "VIP", 1, 2),
  section("Semi-Private", "Table", 56, 60),
  section("Smoking Area", "Table", 61, 68),
  section("Non-Smoking", "Table", 69, 80),
  section("Window Side", "Table", 81, 85),
  section("Counter", "Seat", 1, 10),
  section("High Table", "High", 1, 5),
  section("Family Area", "Table", 86, 92),
  section("Kids Area", "Table", 93, 96),
  section("Couple Area", "Table", 97, 100),
  section("Event Area", "Table", 101, 110),
  section("Mezzanine", "Table", 111, 118),
  section("Second Floor", "Table", 119, 130),
  section("Ground Floor", "Table", 1, 30),
  section("Waiting Area", "Seat", 1, 10),
];

const pad = (n: number) => String(n).padStart(2, "0");

export const tableLabel = (s: SectionDef, n: number) => `${s.prefix} ${pad(n)}`;

/** "Table 01–20" */
export const rangeLabel = (s: SectionDef) => `${tableLabel(s, s.from)}–${pad(s.to)}`;
