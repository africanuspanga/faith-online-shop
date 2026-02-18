"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Heart, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "All Products" },
  { href: "/categories", label: "Categories" },
  { href: "/contact", label: "Contact Us" }
];

export const SiteHeader = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [term, setTerm] = useState(searchParams.get("q") ?? "");
  const { cartCount } = useCart();

  const queryString = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (term.trim()) {
      params.set("q", term.trim());
    } else {
      params.delete("q");
    }
    return params.toString();
  }, [searchParams, term]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    router.push(`/shop${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <header className="sticky top-[35px] z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur sm:top-10">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border)] md:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" className="shrink-0">
          <Image
            src="/logo-main.png"
            alt="Faith Online Shop"
            width={180}
            height={48}
            className="h-9 w-auto sm:h-10 md:h-11"
            priority
          />
        </Link>

        <form onSubmit={onSubmit} className="hidden flex-1 items-center md:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search products..."
              className="pl-9"
              aria-label="Search products"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/account"
            aria-label="Account"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border)] hover:border-[var(--primary)]"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            href="/shop"
            aria-label="Wishlist"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border)] hover:border-[var(--primary)]"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border)] hover:border-[var(--primary)]"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-semibold text-white">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-3 md:hidden">
        <form onSubmit={onSubmit} className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search products..."
            className="pl-9"
            aria-label="Search products"
          />
        </form>
      </div>

      <nav className="hidden border-t border-[var(--border)] md:block" aria-label="Primary navigation">
        <ul className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-3 text-sm font-semibold">
          {links.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={pathname === item.href ? "text-[var(--primary)]" : "text-[var(--foreground)] hover:text-[var(--primary)]"}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/cart"
              className={pathname === "/cart" ? "text-[var(--primary)]" : "text-[var(--foreground)] hover:text-[var(--primary)]"}
            >
              Cart
            </Link>
          </li>
          <li>
            <Link
              href="/account"
              className={pathname === "/account" ? "text-[var(--primary)]" : "text-[var(--foreground)] hover:text-[var(--primary)]"}
            >
              Account
            </Link>
          </li>
        </ul>
      </nav>

      <div
        className={`fixed inset-0 z-50 bg-black/35 transition-opacity md:hidden ${menuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setMenuOpen(false)}
      >
        <aside
          className={`absolute left-0 top-0 h-full w-72 bg-white p-4 transition-transform ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
          onClick={(event) => event.stopPropagation()}
          aria-label="Mobile menu"
        >
          <div className="mb-6 flex items-center justify-between">
            <p className="text-base font-black">Menu</p>
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ul className="space-y-1">
            {links.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[var(--surface)]"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/cart"
                className="block rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[var(--surface)]"
                onClick={() => setMenuOpen(false)}
              >
                Cart
              </Link>
            </li>
            <li>
              <Link
                href="/account"
                className="block rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[var(--surface)]"
                onClick={() => setMenuOpen(false)}
              >
                Account
              </Link>
            </li>
          </ul>
        </aside>
      </div>
    </header>
  );
};
