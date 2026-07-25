import type { Product } from "@/lib/types";

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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.image_url}
        alt={product.name}
        className="h-14 w-14 shrink-0 rounded-[var(--radius-sm)] object-cover"
      />
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
