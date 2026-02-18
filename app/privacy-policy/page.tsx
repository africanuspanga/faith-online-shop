import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Faith Online Shop",
  description:
    "Sera ya faragha ya Faith Online Shop: aina ya taarifa tunazokusanya, jinsi tunavyotumia data ya oda, na namna ya kuwasiliana nasi.",
  alternates: {
    canonical: "/privacy-policy"
  }
};

export default function PrivacyPolicyPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <header className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--primary)]">Faith Online Shop</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          Tunaheshimu faragha yako. Sera hii inaeleza kwa ujumla data tunazokusanya na jinsi tunavyoitumia kwenye huduma za oda.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-black">Data Tunazochukua</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Tunachukua taarifa za msingi za oda kama jina, simu, mkoa/mji, na anuani ya usafiri.
          </p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-black">Kwa Nini Tunazitumia</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Taarifa hutumika kuthibitisha oda, kupanga delivery, na kuwasiliana kuhusu hali ya oda.
          </p>
        </article>
      </div>

      <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-lg font-black">Ulinzi wa Taarifa</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Tunazingatia usalama wa taarifa kwa kutumia mifumo salama na kufikia data kwa wahusika wachache wanaohusika na oda.
        </p>
      </article>

      <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-lg font-black">Mawasiliano ya Faragha</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Ikiwa una swali kuhusu faragha ya data yako, wasiliana nasi kupitia ukurasa wa Contact.
        </p>
      </article>
    </section>
  );
}
