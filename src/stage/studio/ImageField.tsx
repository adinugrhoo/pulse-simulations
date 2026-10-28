"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { DishImage } from "@/menu/DishImage";
import { isImageRef } from "@/menu/resolve";
import { STUDIO_MODE, listAssets, uploadImage, type AssetGroup } from "./io";

/**
 * Photo picker: preview, gallery of existing assets, upload, or a pasted path/URL.
 * Key it by the value (`key={value}`) so the URL box resets when the photo changes.
 */
export function ImageField({
  value,
  alt,
  onChange,
  size = 132,
}: {
  value?: string;
  alt: string;
  onChange: (url: string) => void;
  size?: number;
}) {
  const [gallery, setGallery] = useState<AssetGroup[] | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [url, setUrl] = useState(value ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showGallery && !gallery) listAssets().then(setGallery);
  }, [showGallery, gallery]);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    const res = await uploadImage(file);
    setBusy(false);
    if ("error" in res) setError(res.error);
    else {
      onChange(res.url);
      setGallery(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <div
          className="relative shrink-0 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900"
          style={{ width: size, height: size }}
        >
          <DishImage src={value} alt={alt} sizes={`${size}px`} className="object-cover" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setShowGallery((v) => !v)} className={btn(showGallery)}>
              Gallery
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={btn()}>
              {busy ? "Uploading…" : "Upload"}
            </button>
            {value ? (
              <button type="button" onClick={() => onChange("")} className={btn()}>
                Remove
              </button>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
          <input
            value={url.startsWith("data:") ? "(uploaded in this browser)" : url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => {
              const next = url.trim();
              if (next === (value ?? "") || next.startsWith("data:")) return;
              if (isImageRef(next)) onChange(next);
              else setError("Use a path under /public (e.g. /figma/x.png) or an https:// URL, without a query string.");
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            placeholder="/figma/... or https://..."
            className={input}
          />
          <p className="text-[10px] leading-snug text-neutral-500">
            {STUDIO_MODE === "file"
              ? "Uploads land in public/uploads; commit them with the menu."
              : "Read-only deploy: uploads are stored in this browser only."}
          </p>
          {error ? <p className="text-[10px] text-red-400">{error}</p> : null}
        </div>
      </div>

      {showGallery ? (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-900/60 p-2">
          {!gallery ? (
            <p className="p-2 text-[11px] text-neutral-500">Loading…</p>
          ) : gallery.length === 0 ? (
            <p className="p-2 text-[11px] text-neutral-500">No images found.</p>
          ) : (
            gallery.map((g) => (
              <div key={g.folder} className="mb-2">
                <p className="px-1 pb-1 font-mono text-[10px] text-neutral-500">{g.folder}</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {g.images.map((img) => (
                    <button
                      key={img}
                      type="button"
                      title={img}
                      onClick={() => {
                        onChange(img);
                        setShowGallery(false);
                      }}
                      className={cn(
                        "relative aspect-square overflow-hidden rounded-md border bg-neutral-800",
                        img === value ? "border-white" : "border-transparent hover:border-neutral-500",
                      )}
                    >
                      <DishImage src={img} alt="" sizes="64px" className="object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export const input =
  "w-full rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-500";

export const btn = (active?: boolean) =>
  cn(
    "rounded-md border px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-40",
    active
      ? "border-neutral-500 bg-neutral-800 text-white"
      : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-600",
  );
