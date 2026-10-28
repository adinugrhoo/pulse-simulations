import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "../_lib/files";
import { rejectUnlessStudioRequest } from "../_lib/guard";

const MAX_BYTES = 5 * 1024 * 1024;

/** Raster only: an uploaded SVG could carry script and is served from this origin. */
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** The file's own header must match its claimed type; the browser-sent type is not proof. */
const MAGIC: Record<string, (b: Uint8Array) => boolean> = {
  png: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  jpg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  gif: (b) => String.fromCharCode(...b.slice(0, 4)) === "GIF8",
  webp: (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
};

const slug = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "image";

/** Save a dish photo under public/uploads. Form field: `file`. Returns its public path. */
export async function POST(request: Request) {
  const rejected = rejectUnlessStudioRequest(request);
  if (rejected) return rejected;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Expected a `file` field" }, { status: 400 });

  const ext = EXT[file.type];
  if (!ext) return Response.json({ error: "Use a PNG, JPG, WebP or GIF" }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Images must be 5 MB or smaller" }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!MAGIC[ext](bytes)) return Response.json({ error: "File content is not a valid image" }, { status: 415 });

  const name = `${slug(file.name)}-${randomBytes(4).toString("hex")}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), bytes);
  return Response.json({ url: `/uploads/${name}` });
}
