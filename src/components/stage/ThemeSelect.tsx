"use client";

import { cn } from "@/lib/cn";
import { useSim } from "@/sim/store";
import { THEMES, useTheme } from "@/sim/theme";
import { Popover } from "./Popover";

/** Header dropdown next to the phase picker: the tablet's look. Only Phase 2.0 has themes. */
export function ThemeSelect() {
  const phase = useSim((s) => s.phase);
  const themeId = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const theme = THEMES.find((t) => t.id === themeId)!;

  if (phase !== "2.0") return null;

  return (
    <Popover
      label={`Theme: ${theme.label}`}
      chip={
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-300">
          {theme.chip}
        </span>
      }
      width={220}
    >
      {(close) => (
        <>
          <p className="px-1 pb-2 text-[10px] leading-tight text-neutral-500">
            Applies to the Select Dish page (tablet POS) only.
          </p>
          <ul className="flex flex-col gap-1">
            {THEMES.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => {
                    setTheme(t.id);
                    close();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border p-2 text-left transition",
                    t.id === themeId
                      ? "border-white/40 bg-white/10"
                      : "border-neutral-800 bg-neutral-900/30 hover:border-neutral-700",
                  )}
                >
                  <span className="text-xs font-medium text-neutral-200">
                    {t.label}
                  </span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-300">
                    {t.chip}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Popover>
  );
}
