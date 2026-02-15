import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | Faith Online Shop",
  description:
    "Masharti ya jumla ya matumizi ya Faith Online Shop kuhusu oda, bei, upatikanaji wa bidhaa, na uthibitisho wa taarifa."
};

export default function TermsAndConditionsPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <header className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--primary)]">Faith Online Shop</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Terms and Conditions</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          Haya ni masharti ya jumla ya kutumia duka letu mtandaoni. Yameandikwa kwa lugha rahisi kwa ufahamu wa wateja.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-black">Kuweka Oda</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Kwa kuagiza, unathibitisha kuwa taarifa ulizoweka ni sahihi. Oda inaweza kuthibitishwa kwa simu kabla ya kutumwa.
          </p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-black">Bei na Upatikanaji</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Bei na stock vinaweza kubadilika kulingana na upatikanaji wa bidhaa bila taarifa ya mapema.
          </p>
        </article>
      </div>

      <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-lg font-black">Kukubali au Kukataa Oda</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Tunaweza kukataa au kughairi oda ikiwa kuna hitilafu ya bei, taarifa zisizo kamili, au bidhaa kuisha.
        </p>
      </article>

      <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-lg font-black">Mawasiliano</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Kwa maswali kuhusu masharti haya, tumia ukurasa wa mawasiliano. Tutakusaidia haraka.
        </p>
      </article>
    </section>
  );
}
