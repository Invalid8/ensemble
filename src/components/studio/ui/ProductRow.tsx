"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";

// The placeholder tile always sits underneath; the image lays on top with an empty alt, so a
// loading or broken image shows the tile (never spilled alt text that reads as "failed").
function Thumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-accent-soft">
      <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 16l4.5-5 3.5 4 3-3.5L20 16M5 5h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z"
            stroke="var(--color-accent)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {src && !failed && (
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
      <Thumb src={product.image_url} />
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
