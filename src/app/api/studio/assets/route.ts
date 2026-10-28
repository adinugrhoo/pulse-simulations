import { readdir } from "node:fs/promises";
import path from "node:path";
import { PUBLIC_DIR, notAvailable, studioEnabled } from "../_lib/files";

const IMAGE = /\.(png|jpe?g|gif|webp)$/i;

/** Folders the photo gallery browses. */
const ROOTS = ["figma", "uploads"];

/** Every raster image under the gallery folders, grouped by folder. */
export async function GET() {
  if (!studioEnabled()) return notAvailable();

  const groups: { folder: string; images: string[] }[] = [];
  for (const root of ROOTS) {
    const entries = await readdir(path.join(/*turbopackIgnore: true*/ PUBLIC_DIR, root), { recursive: true, withFileTypes: true }).catch(
      () => [],
    );
    const byFolder = new Map<string, string[]>();
    for (const e of entries) {
      if (!e.isFile() || !IMAGE.test(e.name)) continue;
      const rel = path.relative(PUBLIC_DIR, path.join(/*turbopackIgnore: true*/ e.parentPath, e.name)).split(path.sep).join("/");
      const folder = rel.slice(0, rel.lastIndexOf("/"));
      byFolder.set(folder, [...(byFolder.get(folder) ?? []), `/${rel}`]);
    }
    for (const [folder, images] of [...byFolder].sort()) groups.push({ folder, images: images.sort() });
  }
  return Response.json({ groups });
}
