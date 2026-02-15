import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy Tanzania | Faith Online Shop",
  description:
    "Soma utaratibu wa usafiri wa Faith Online Shop: usafiri bure Tanzania nzima, muda wa kufika oda, na uthibitisho wa oda kwa simu."
};

export default function ShippingPolicyPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <header className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--primary)]">Faith Online Shop</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Shipping Policy</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          Tunalenga kupeleka oda kwa haraka na kwa urahisi kwa wateja wote Tanzania. Hii ni taarifa ya jumla ya namna
          usafiri wetu unavyofanya kazi.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-black">Gharama ya Usafiri</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Usafiri ni <strong>FREE / BURE</strong> Tanzania nzima kwa oda zinazokamilika kwenye mfumo wetu.
          </p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-black">Muda wa Kufika</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Dar es Salaam mara nyingi ni siku 1-2. Mikoa mingine mara nyingi ni siku 2-5 kutegemea umbali na ratiba ya usafiri.
          </p>
        </article>
      </div>

      <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-lg font-black">Uthibitisho wa Oda</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Oda nyingi huthibitishwa kwa simu au WhatsApp kabla ya kutumwa. Tafadhali hakikisha namba ya simu ni sahihi
          ili kuepusha kuchelewa.
        </p>
      </article>

      <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-lg font-black">Malipo</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Tunatumia mfumo wa <strong>Lipa Unapopokea</strong>. Hakuna ulazima wa kulipa kabla ya bidhaa kufika.
        </p>
      </article>
    </section>
  );
}
