import type { Step } from "@/engine/scenario";
import { SCENARIO } from "./scenario";

/**
 * Dynamic QR flow. Same screens as the static flow; the steps that differ (how the table
 * gets its code, how the customer lands on it) get replaced here. Until then it replays
 * the static steps.
 */
export const DYNAMIC_SCENARIO: Step[] = [...SCENARIO];
