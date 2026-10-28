import path from "node:path";
import { PHASES } from "@/config/phases";

/**
 * Dev-only file access for the Menu Studio. Production deploys are read-only, so every
 * studio route answers 404 there and the studio keeps edits in the browser instead.
 */
export const studioEnabled = () => process.env.NODE_ENV === "development";

export const notAvailable = () => Response.json({ error: "Menu Studio file access is dev-only" }, { status: 404 });

// paths are only touched on `pnpm dev`; keep the build from tracing the whole project
const ROOT = process.cwd();
export const PUBLIC_DIR = path.join(/*turbopackIgnore: true*/ ROOT, "public");
export const UPLOAD_DIR = path.join(/*turbopackIgnore: true*/ PUBLIC_DIR, "uploads");

/**
 * The menu.json behind a layer key. Only keys that name a real phase/theme resolve, so
 * a request can never pick its own path.
 */
export const layerFile = (key: string): string | null => {
  if (key === "global") return path.join(/*turbopackIgnore: true*/ ROOT, "src/config/global/menu.json");
  const [phaseId, themeId, ...rest] = key.split("/");
  if (rest.length) return null;
  const phase = PHASES.find((p) => p.id === phaseId);
  if (!phase) return null;
  const phaseDir = path.join(/*turbopackIgnore: true*/ ROOT, "src/config/phases", phase.folder);
  if (themeId === undefined) return path.join(/*turbopackIgnore: true*/ phaseDir, "menu.json");
  return phase.themes.some((t) => t.id === themeId) ? path.join(/*turbopackIgnore: true*/ phaseDir, "themes", themeId, "menu.json") : null;
};
