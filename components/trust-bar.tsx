import { trustItems } from "@/lib/constants";

export const TrustBar = () => {
  return (
    <section
      aria-labelledby="trust-title"
      className="rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[0_10px_24px_rgba(26,26,26,0.06)] sm:p-6"
    >
      <h2 id="trust-title" className="sr-only">
        Sababu za kuamini Faith Online Shop
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {trustItems.map((item, index) => (
          <article key={item.label} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <span
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                index % 3 === 0
                  ? "bg-[var(--primary)]/15"
                  : index % 3 === 1
                    ? "bg-[var(--secondary)]/50"
                    : "bg-[var(--accent)]/30"
              }`}
            >
              <item.icon className="h-5 w-5 text-[var(--foreground)]" />
            </span>
            <span className="text-sm font-bold text-[var(--foreground)]">{item.label}</span>
          </article>
        ))}
      </div>
    </section>
  );
};
