"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid3X3, Home, Search, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Categories", icon: Grid3X3 },
  { href: "/shop", label: "Search", icon: Search },
  { href: "/shop", label: "Cart", icon: ShoppingCart },
  { href: "/contact", label: "Account", icon: User }
];

export const MobileBottomNav = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-white md:hidden" aria-label="Mobile navigation">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
                  active ? "text-[var(--primary)]" : "text-[var(--muted)]"
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
