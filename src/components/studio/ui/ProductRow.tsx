"use client";

import { useState } from "react";
import { catalogImageUrl } from "@/lib/catalogImage";
import type { Product } from "@/lib/types";

// Sephora's CDN answers Access Denied outside its regions, so skip the request entirely.
const BLOCKED_IMAGE_HOSTS = ["sephora.com"];

function isReachable(src: string): boolean {
  if (!src) return false;
  if (src.startsWith("/")) return true; // our own catalog copy
  try {
    const host = new URL(src).hostname;
    return !BLOCKED_IMAGE_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
  } catch {
    return false;
  }
}

// Warm tints from the palette, picked deterministically so a brand always wears the same tile.
const TILE_TINTS = [
  "var(--color-accent-soft)",
  "var(--color-petal-3)",
  "var(--color-petal-1)",
  "var(--color-surface-2)",
  "var(--color-accent)",
];

function tintFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return TILE_TINTS[hash % TILE_TINTS.length];
}

/** "The Ordinary" -> "TO", "LANEIGE" -> "LA", "Saie" -> "SA". */
function initialsFor(brand: string): string {
  const words = brand.replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "·";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Brand mark on the product's own shade - a designed stand-in, not a broken image.
function BrandTile({ product }: { product: Product }) {
  const swatch = /^#[0-9a-f]{6}$/i.test(product.primary_color_hex ?? "")
    ? product.primary_color_hex
    : null;

  return (
    <span
      className="absolute inset-0 flex flex-col items-center justify-center gap-1"
      style={{ background: swatch ?? tintFor(product.brand ?? product.id) }}
      aria-hidden
    >
      <span className="font-heading text-[13px] leading-none tracking-[0.06em] text-ink/80 mix-blend-multiply">
        {initialsFor(product.brand ?? "")}
      </span>
      {!swatch && product.finish && (
        <span className="font-body text-[8px] uppercase leading-none tracking-[0.1em] text-ink/50">
          {product.finish.slice(0, 8)}
        </span>
      )}
    </span>
  );
}

// The tile sits underneath and the photo lays on top with an empty alt, so a broken image
// shows the tile rather than spilled alt text.
function Thumb({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  const src = catalogImageUrl(product.image_url);
  const showImage = Boolean(src) && isReachable(src) && !failed;

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-accent-soft">
      <BrandTile product={product} />
      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}

export function ProductRow({ product }: { product: Product }) {
  const meta = [product.material, product.fit && `${product.fit} fit`, product.shade, product.finish]
    .filter(Boolean)
    .join(" · ");

  return (
    <a
      href={product.product_url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3.5 rounded-[var(--radius-md)] bg-surface-card p-3 transition-colors hover:bg-accent-soft/40"
    >
      <Thumb product={product} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-semibold text-ink">{product.name}</p>
        {meta && <p className="truncate font-body text-xs text-ink-muted">{meta}</p>}
      </div>
      <span className="shrink-0 rounded-full bg-accent-soft px-4 py-2 font-body text-xs font-semibold text-ink">
        Shop
      </span>
    </a>
  );
}
