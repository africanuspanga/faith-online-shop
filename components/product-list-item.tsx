import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatTZS } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";

export const ProductListItem = ({ product }: { product: Product }) => {
  return (
    <article className="grid grid-cols-[120px_1fr] gap-4 rounded-[20px] border border-[var(--border)] bg-white p-3 shadow-[0_2px_0_rgba(26,26,26,0.08)] transition hover:shadow-[0_10px_26px_rgba(244,94,2,0.10)] sm:grid-cols-[180px_1fr_auto] sm:items-center">
      <Link href={`/checkout/${product.id}`} className="relative block overflow-hidden rounded-xl border border-[var(--border)]">
        <span className="absolute left-2 top-2 z-10 inline-flex rounded-full border border-[var(--foreground)] bg-[var(--secondary)] px-2 py-0.5 text-[10px] font-black text-[var(--foreground)]">
          -30%
        </span>
        <Image src={product.image} alt={product.name} width={220} height={220} className="aspect-square w-full object-cover" />
      </Link>
      <div>
        <Link href={`/checkout/${product.id}`} className="line-clamp-2 text-sm font-semibold leading-relaxed">
          {product.name}
        </Link>
        <p className="mt-1 text-[11px] font-semibold text-[var(--muted)]">{product.brand} • {product.sku}</p>
        {product.subCategory ? (
          <p className="text-[11px] font-semibold text-[var(--muted)]">
            {product.category} • {product.subCategory}
          </p>
        ) : (
          <p className="text-[11px] font-semibold text-[var(--muted)]">{product.category}</p>
        )}
        <p className="text-[11px] text-[var(--muted)]">
          Size: {product.sizeOptions.join(", ") || "Standard"} | Color: {product.colorOptions.join(", ") || "Standard"}
        </p>
        <StarRating rating={product.rating} className="mt-2" />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-xl font-extrabold text-[var(--primary)]">{formatTZS(product.salePrice)}</p>
          <p className="text-sm text-[var(--muted)] line-through">{formatTZS(product.originalPrice)}</p>
        </div>
        <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{product.sold} sold</p>
      </div>
      <Link href={`/checkout/${product.id}`} className={`${buttonVariants({ variant: "outline" })} w-full sm:w-auto`}>
        Order Now
      </Link>
    </article>
  );
};
