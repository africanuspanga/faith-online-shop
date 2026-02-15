import { PackageSearch } from "lucide-react";

export const EmptyState = () => {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center">
      <PackageSearch className="mx-auto h-12 w-12 text-[var(--muted)]" />
      <h3 className="mt-4 text-lg font-bold text-[var(--foreground)]">Hakuna bidhaa zilizopatikana</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">Badilisha filters zako au bonyeza Clear All Filters kuona bidhaa zote.</p>
    </div>
  );
};
