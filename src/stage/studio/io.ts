"use client";

import { FILE_LAYERS, type LayerKey } from "@/menu/layers";
import { layerOf, useMenuStore } from "@/menu/store";

/**
 * Where studio edits go. `pnpm dev` writes straight into the config folders; a deployed
 * build is read-only, so edits stay in this browser (localStorage) and can be exported.
 */
export const STUDIO_MODE: "file" | "local" = process.env.NODE_ENV === "development" ? "file" : "local";

export const layerPath = (key: LayerKey, folderOf: (phaseId: string) => string) => {
  if (key === "global") return "src/config/global/menu.json";
  const [phaseId, themeId] = key.split("/");
  const dir = `src/config/phases/${folderOf(phaseId)}`;
  return themeId ? `${dir}/themes/${themeId}/menu.json` : `${dir}/menu.json`;
};

/** Write a layer's draft to its menu.json (dev) and mark it clean. */
export async function saveLayer(key: LayerKey): Promise<string | null> {
  if (STUDIO_MODE === "local") return "Read-only deploy: edits stay in this browser. Use Export to commit them.";
  const data = layerOf(useMenuStore.getState(), key);
  const res = await fetch("/api/studio/menu", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ layer: key, data }),
  }).catch(() => null);
  if (!res) return "Dev server not reachable";
  if (!res.ok) return ((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? `HTTP ${res.status}`;
  useMenuStore.getState().commit(key, data);
  return null;
}

/** Download a layer as JSON, ready to drop into its config folder. */
export function exportLayer(key: LayerKey) {
  const data = layerOf(useMenuStore.getState(), key);
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `menu.${key.replace(/[/.]/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Longest side of a photo kept in localStorage; keeps drafts well under the quota. */
const LOCAL_MAX_SIDE = 640;

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, LOCAL_MAX_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => reject(new Error("Not an image"));
    img.src = URL.createObjectURL(file);
  });

/** Upload a photo: into public/uploads on dev, a downscaled data URL otherwise. */
export async function uploadImage(file: File): Promise<{ url: string } | { error: string }> {
  if (STUDIO_MODE === "local") {
    return toDataUrl(file).then(
      (url) => ({ url }),
      (e: Error) => ({ error: e.message }),
    );
  }
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/studio/upload", { method: "POST", body: form }).catch(() => null);
  if (!res) return { error: "Dev server not reachable" };
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  return json.url ? { url: json.url } : { error: json.error ?? `HTTP ${res.status}` };
}

export type AssetGroup = { folder: string; images: string[] };

/** Photos to pick from: every image under public/figma and public/uploads on dev, else the ones the menu already uses. */
export async function listAssets(): Promise<AssetGroup[]> {
  if (STUDIO_MODE === "file") {
    const res = await fetch("/api/studio/assets").catch(() => null);
    if (res?.ok) return ((await res.json()) as { groups: AssetGroup[] }).groups;
  }
  const s = useMenuStore.getState();
  const used = new Set<string>();
  const keys = ["global", ...Object.keys(FILE_LAYERS.patches)];
  for (const k of keys) {
    const layer = layerOf(s, k) as { dishes?: unknown; added?: { image?: string }[]; categories?: unknown };
    const dishes = Array.isArray(layer.dishes) ? (layer.dishes as { image?: string }[]) : [];
    for (const d of [...dishes, ...(layer.added ?? [])]) if (d.image && d.image.startsWith("/")) used.add(d.image);
  }
  const byFolder = new Map<string, string[]>();
  for (const img of [...used].sort()) {
    const folder = img.slice(1, img.lastIndexOf("/"));
    byFolder.set(folder, [...(byFolder.get(folder) ?? []), img]);
  }
  return [...byFolder].map(([folder, images]) => ({ folder, images }));
}
