"use client";

import { useEffect, useState } from "react";
import { useThemeChoice } from "@/theme/store";
import { scheduleState, type ScheduleState } from "./schedule";
import type { Dish } from "./types";

/**
 * What the POS shows for dishes whose merchant schedule blocks them, or undefined while
 * they can be ordered. Follows the sidebar's schedule clock; the live clock re-checks every 30s.
 */
export function useScheduleState(): (dish: Dish) => ScheduleState | undefined {
  const clock = useThemeChoice((s) => s.scheduleClock);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (dish) => {
    if (!dish.schedule || clock === "available") return undefined;
    return scheduleState(dish.schedule, now, clock === "unavailable");
  };
}
