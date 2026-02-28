"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatTZS } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { useCart } from "@/components/cart-provider";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const isOutOfStock = !product.inStock;

  const onAdd = async () => {
    setAdding(true);
    try {
      await addToCart(product, 1);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-[var(--border)] bg-white shadow-[0_2px_0_rgba(26,26,26,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(244,94,2,0.12)]">
      <div className="relative overflow-hidden border-b border-[var(--border)]">
        {isOutOfStock ? (
          <span className="absolute left-3 top-3 z-10 inline-flex rounded-full border border-red-600 bg-red-100 px-3 py-1 text-xs font-black text-red-700">
            OUT OF STOCK
          </span>
        ) : (
          <span className="absolute left-3 top-3 z-10 inline-flex rounded-full border border-[var(--foreground)] bg-[var(--secondary)] px-3 py-1 text-xs font-black text-[var(--foreground)]">
            -30%
          </span>
        )}

        <Link href={`/checkout/${product.id}`}>
          <Image
            src={product.image}
            alt={product.name}
            width={400}
            height={400}
            className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          href={`/checkout/${product.id}`}
          className="line-clamp-2 min-h-11 text-sm font-semibold leading-relaxed text-[var(--foreground)]"
        >
          {product.name}
        </Link>
        <p className="text-[11px] font-semibold text-[var(--muted)]">{product.brand} • {product.sku}</p>
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
        <p className="text-xl font-extrabold text-[var(--primary)]">{formatTZS(product.salePrice)}</p>
        <p className="text-sm text-[var(--muted)] line-through">{formatTZS(product.originalPrice)}</p>
        <StarRating rating={product.rating} />
        <p className="text-xs font-semibold text-[var(--muted)]">{product.sold} sold</p>
        {isOutOfStock ? <p className="text-xs font-bold text-red-700">Currently unavailable</p> : null}
        <div className="mt-auto grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={() => void onAdd()} disabled={adding || isOutOfStock}>
            {isOutOfStock ? "Out of Stock" : adding ? "Adding..." : "Add To Cart"}
          </Button>
          {isOutOfStock ? (
            <span className={`${buttonVariants({ variant: "outline" })} pointer-events-none w-full opacity-60`}>Unavailable</span>
          ) : (
            <Link href={`/checkout/${product.id}`} className={`${buttonVariants()} w-full`}>
              Order Now
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};
