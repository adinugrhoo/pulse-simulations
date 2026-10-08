export const PHASES = [
  { id: "1.0", label: "Phase 1.0", chip: "Design Ready", tone: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" },
  { id: "2.0", label: "Phase 2.0", chip: "Ongoing", tone: "bg-amber-500/15 text-amber-300 ring-amber-500/30" },
] as const;

export type PhaseId = (typeof PHASES)[number]["id"];

export const DEFAULT_PHASE: PhaseId = "1.0";
