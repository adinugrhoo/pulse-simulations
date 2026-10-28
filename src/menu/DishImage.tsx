import Image from "next/image";
import { cn } from "@/lib/cn";
import { imageUrl, isOptimisable } from "./resolve";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

/**
 * A dish or category photo that fills its (relatively positioned) parent. Dishes without a
 * photo get a lettered tile. Remote URLs, query strings and studio uploads skip the
 * optimiser, which only accepts plain committed /public paths.
 */
export function DishImage({
  src,
  alt,
  className,
  sizes,
  eager,
}: {
  src?: string;
  alt: string;
  className?: string;
  sizes?: string;
  eager?: boolean;
}) {
  if (!src) {
    return (
      <span
        aria-label={alt}
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-[#e9e6e2] text-xl font-bold text-[#8a857c]",
          className,
        )}
      >
        {initials(alt)}
      </span>
    );
  }
  const url = imageUrl(src);
  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes={sizes}
      loading={eager ? "eager" : undefined}
      unoptimized={!isOptimisable(url)}
      className={className}
    />
  );
}
