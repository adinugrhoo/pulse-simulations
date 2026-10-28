import { writeFile } from "node:fs/promises";
import { checkLayer } from "@/menu/validate";
import { layerFile } from "../_lib/files";
import { rejectUnlessStudioRequest } from "../_lib/guard";

/** Write one menu layer back to its menu.json. Body: { layer: "2.0/dark", data: {...} }. */
export async function PUT(request: Request) {
  const rejected = rejectUnlessStudioRequest(request);
  if (rejected) return rejected;

  const body = (await request.json().catch(() => null)) as { layer?: unknown; data?: unknown } | null;
  if (!body || typeof body.layer !== "string") {
    return Response.json({ error: "Expected { layer, data }" }, { status: 400 });
  }
  const file = layerFile(body.layer);
  if (!file) return Response.json({ error: `Unknown layer "${body.layer}"` }, { status: 400 });

  const problem = checkLayer(body.layer, body.data);
  if (problem) return Response.json({ error: problem }, { status: 422 });

  await writeFile(file, `${JSON.stringify(body.data, null, 2)}\n`, "utf8");
  return Response.json({ ok: true, file: file.slice(process.cwd().length + 1) });
}
