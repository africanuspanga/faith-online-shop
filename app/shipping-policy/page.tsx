import type { Metadata } from "next";
import { formatTZS } from "@/lib/format";
import { darDeliveryFeeRange, darDeliveryRates, upcountryFlatShippingFee } from "@/lib/shipping-fees";

export const metadata: Metadata = {
  title: "Shipping Policy Tanzania | Faith Online Shop",
  description:
    "Soma utaratibu wa usafiri wa Faith Online Shop: gharama ya usafiri kulingana na eneo, muda wa kufika oda, na uthibitisho wa oda kwa simu.",
  alternates: {
    canonical: "/shipping-policy"
  }
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
            Dar es Salaam: gharama huanzia {formatTZS(darDeliveryFeeRange.min)} hadi {formatTZS(darDeliveryFeeRange.max)}
            kulingana na area. Mikoani: flat rate ya {formatTZS(upcountryFlatShippingFee)}.
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
        <h2 className="text-lg font-black">Dar es Salaam Delivery Fees (Updated)</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Kwa maelekezo ya sasa: kuanzia delivery ya 4,000 na kuendelea imeongezwa 1,000.
        </p>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="py-2">Area / Route</th>
                <th className="py-2">Final Fee</th>
              </tr>
            </thead>
            <tbody>
              {darDeliveryRates.map((item) => (
                <tr key={item.area} className="border-b border-[var(--border)]">
                  <td className="py-2">
                    <p className="font-semibold">{item.area}</p>
                    {item.notes ? <p className="text-xs text-[var(--muted)]">{item.notes}</p> : null}
                  </td>
                  <td className="py-2 font-bold text-[var(--primary)]">{formatTZS(item.finalFee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-lg font-black">Mikoani Delivery Fee</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Mikoa yote nje ya Dar es Salaam: <strong>{formatTZS(upcountryFlatShippingFee)}</strong> (flat rate).
        </p>
      </article>

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
          Tunakubali <strong>Cash on Delivery, Pesapal, na Bank Deposit</strong>. Kwa installment, unaweza kulipa
          kiasi cha awali na kumalizia kabla ya kuchukua oda.
        </p>
      </article>
    </section>
  );
}
