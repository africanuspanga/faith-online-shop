import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  createPageLink: (page: number) => string;
}

export const Pagination = ({ totalPages, currentPage, createPageLink }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 8);

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
      <Link
        href={createPageLink(Math.max(1, currentPage - 1))}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border)] px-3 text-sm"
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> Previous
      </Link>
      {pages.map((page) => (
        <Link
          key={page}
          href={createPageLink(page)}
          className={`inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold ${
            page === currentPage
              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
              : "border-[var(--border)] bg-white text-[var(--foreground)]"
          }`}
        >
          {page}
        </Link>
      ))}
      <Link
        href={createPageLink(Math.min(totalPages, currentPage + 1))}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border)] px-3 text-sm"
      >
        Next <ChevronRight className="ml-1 h-4 w-4" />
      </Link>
    </nav>
  );
};
