import type { Metadata } from "next";
import { formatTZS } from "@/lib/format";
import { darDeliveryFeeRange, darDeliveryRates, upcountryFlatShippingFee } from "@/lib/shipping-fees";

export const metadata: Metadata = {
  title: "Shipping Policy Tanzania | Faith Online Shop",
  description:
    "Read the Faith Online Shop shipping policy for delivery fees, estimated timelines, and order confirmation details.",
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
          We aim to deliver orders quickly and smoothly for customers across Tanzania. This page explains how our delivery process works.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-black">Delivery Cost</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Dar es Salaam delivery ranges from {formatTZS(darDeliveryFeeRange.min)} to {formatTZS(darDeliveryFeeRange.max)}
            depending on the area. Upcountry delivery is a flat rate of {formatTZS(upcountryFlatShippingFee)}.
          </p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-black">Estimated Delivery Time</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Dar es Salaam orders usually arrive within 1 to 2 days. Other regions usually take 2 to 5 days depending on distance and transport schedules.
          </p>
        </article>
      </div>

      <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-lg font-black">Dar es Salaam Delivery Fees (Updated)</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Based on the latest pricing guide, delivery fees from TZS 4,000 upward increase in TZS 1,000 steps depending on route.
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
        <h2 className="text-lg font-black">Upcountry Delivery Fee</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          All regions outside Dar es Salaam: <strong>{formatTZS(upcountryFlatShippingFee)}</strong> flat rate.
        </p>
      </article>

      <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-lg font-black">Order Confirmation</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Most orders are confirmed by phone call or WhatsApp before dispatch. Please make sure your phone number is correct to avoid delays.
        </p>
      </article>

      <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-lg font-black">Payments</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          We accept <strong>Cash on Delivery, Pesapal, and M-Pesa / Bank Transfer</strong>. For installment orders, you can pay a deposit first and clear the balance before collection or final handoff.
        </p>
      </article>
    </section>
  );
}
