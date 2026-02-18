"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { formatTZS } from "@/lib/format";
import { useCart } from "@/components/cart-provider";
import { Button, buttonVariants } from "@/components/ui/button";

export const CartPage = () => {
  const { items, subtotal, removeFromCart, setItemQuantity, updateItemOptions, clearCart } = useCart();

  const totalOriginal = items.reduce((sum, item) => sum + item.originalUnitPrice * item.quantity, 0);
  const savings = Math.max(0, totalOriginal - subtotal);

  if (!items.length) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-white p-6 text-center sm:p-8">
        <ShoppingBag className="mx-auto h-14 w-14 text-[var(--muted)]" />
        <h1 className="mt-3 text-2xl font-black">Cart yako iko tupu</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Ongeza bidhaa kadhaa kwenye cart ili ufanye checkout mara moja.</p>
        <Link href="/shop" className={`${buttonVariants()} mt-5`}>
          Endelea Kununua
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">Shopping Cart</h1>
          <p className="text-sm text-[var(--muted)]">{items.length} bidhaa tofauti cart</p>
        </div>
        <Button type="button" variant="outline" onClick={clearCart}>
          Futa Cart Yote
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 sm:grid-cols-[120px_1fr]">
              <div className="relative overflow-hidden rounded-xl border border-[var(--border)]">
                <Image src={item.image} alt={item.productName} width={240} height={240} className="aspect-square w-full object-cover" />
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-base font-bold">{item.productName}</h2>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-black text-[var(--primary)]">{formatTZS(item.unitPrice)}</p>
                  <p className="text-sm text-[var(--muted)] line-through">{formatTZS(item.originalUnitPrice)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--muted)]">Quantity</span>
                  <div className="inline-flex items-center rounded-lg border border-[var(--border)]">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center"
                      onClick={() => setItemQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="inline-flex min-w-10 justify-center text-sm font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center"
                      onClick={() => setItemQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {(item.sizeOptions.length > 0 || item.colorOptions.length > 0) ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {item.sizeOptions.length ? (
                      <label className="space-y-1 text-xs font-semibold text-[var(--muted)]">
                        Size
                        <select
                          value={item.selectedSize}
                          onChange={(event) => updateItemOptions(item.id, { selectedSize: event.target.value })}
                          className="h-10 w-full rounded-lg border border-[var(--border)] px-2 text-sm text-[var(--foreground)]"
                        >
                          {item.sizeOptions.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    {item.colorOptions.length ? (
                      <label className="space-y-1 text-xs font-semibold text-[var(--muted)]">
                        Color
                        <select
                          value={item.selectedColor}
                          onChange={(event) => updateItemOptions(item.id, { selectedColor: event.target.value })}
                          className="h-10 w-full rounded-lg border border-[var(--border)] px-2 text-sm text-[var(--foreground)]"
                        >
                          {item.colorOptions.map((color) => (
                            <option key={color} value={color}>
                              {color}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </div>
                ) : null}

                <p className="text-xs font-semibold text-[var(--muted)]">
                  Line Total: <span className="text-[var(--foreground)]">{formatTZS(item.unitPrice * item.quantity)}</span>
                </p>
              </div>
            </article>
          ))}
        </div>

        <aside className="h-fit space-y-3 rounded-2xl border border-[var(--border)] bg-white p-4">
          <h2 className="text-lg font-black">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">{formatTZS(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Original Total</span>
              <span className="font-semibold">{formatTZS(totalOriginal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>You Save</span>
              <span className="font-semibold text-green-700">{formatTZS(savings)}</span>
            </div>
          </div>
          <p className="text-xs text-[var(--muted)]">Shipping itahesabiwa checkout kulingana na area yako.</p>
          <Link href="/checkout" className={`${buttonVariants()} w-full`}>
            Endelea Checkout
          </Link>
          <Link href="/shop" className={`${buttonVariants({ variant: "outline" })} w-full`}>
            Continue Shopping
          </Link>
        </aside>
      </div>
    </section>
  );
};
