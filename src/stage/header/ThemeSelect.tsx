"use client";

import { cn } from "@/lib/cn";
import { getPhase } from "@/config/phases";
import { useSim } from "@/engine/store";
import { useThemeConfig } from "@/theme/hooks";
import { useThemeChoice } from "@/theme/store";
import { Popover } from "./Popover";

/** Header dropdown next to the phase picker: the themes of the current phase. */
export function ThemeSelect() {
  const phaseId = useSim((s) => s.phase);
  const theme = useThemeConfig();
  const setTheme = useThemeChoice((s) => s.setTheme);
  const themes = getPhase(phaseId).themes;

  return (
    <Popover
      label={`Theme: ${theme.label}`}
      chip={
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-300">
          {theme.chip}
        </span>
      }
      width={240}
    >
      {(close) => (
        <>
          <p className="px-1 pb-2 text-[10px] leading-tight text-neutral-500">
            Themes of {getPhase(phaseId).label}. Each sets mobile and tablet tokens, screens and menu.
          </p>
          <ul className="flex flex-col gap-1">
            {themes.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => {
                    setTheme(phaseId, t.id);
                    close();
                  }}
                  className={cn(
                    "flex w-full flex-col gap-1 rounded-lg border p-2 text-left transition",
                    t.id === theme.id
                      ? "border-white/40 bg-white/10"
                      : "border-neutral-800 bg-neutral-900/30 hover:border-neutral-700",
                  )}
                >
                  <span className="flex w-full items-center justify-between">
                    <span className="text-xs font-medium text-neutral-200">{t.label}</span>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-300">
                      {t.chip}
                    </span>
                  </span>
                  {t.description ? (
                    <span className="text-[10px] leading-snug text-neutral-500">{t.description}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Popover>
  );
}
