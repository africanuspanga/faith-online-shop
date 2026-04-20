import { PackageSearch } from "lucide-react";

export const EmptyState = () => {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center">
      <PackageSearch className="mx-auto h-12 w-12 text-[var(--muted)]" />
      <h3 className="mt-4 text-lg font-bold text-[var(--foreground)]">No products found</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">Adjust your filters or use Clear All Filters to see every product again.</p>
    </div>
  );
};
