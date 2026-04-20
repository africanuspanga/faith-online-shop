import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | Faith Online Shop",
  description:
    "Faith Online Shop terms and conditions covering orders, pricing, product availability, and customer information.",
  alternates: {
    canonical: "/terms-and-conditions"
  }
};

export default function TermsAndConditionsPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <header className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--primary)]">Faith Online Shop</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Terms and Conditions</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          These are the general terms for using our online shop, written in clear language to help customers understand how orders work.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-black">Placing an Order</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            By placing an order, you confirm that the information you provided is accurate. Your order may be confirmed by phone before it is dispatched.
          </p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-black">Pricing and Availability</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Prices and stock levels may change depending on product availability without prior notice.
          </p>
        </article>
      </div>

      <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-lg font-black">Accepting or Declining an Order</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          We may decline or cancel an order if there is a pricing error, incomplete information, or the product becomes unavailable.
        </p>
      </article>

      <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-lg font-black">Contact</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          If you have questions about these terms, please use the Contact page and our team will help you quickly.
        </p>
      </article>
    </section>
  );
}
