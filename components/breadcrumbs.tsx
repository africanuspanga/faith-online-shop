import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

export const Breadcrumbs = ({ items }: { items: Crumb[] }) => {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-[var(--muted)] sm:text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="inline-flex items-center gap-1">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-[var(--primary)]">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "font-semibold text-[var(--foreground)]" : ""}>{item.label}</span>
              )}
              {!isLast ? <ChevronRight className="h-3.5 w-3.5" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
