import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { bankDetails, whatsappLink } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { OrderReviewForm } from "@/components/order-review-form";

export const metadata: Metadata = {
  title: "Order Confirmed | Faith Online Shop",
  description:
    "Asante kwa kuagiza Faith Online Shop. Oda yako imepokelewa na timu yetu itakupigia kuthibitisha usafirishaji na malipo.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function ThankYouPage({
  searchParams
}: {
  searchParams: Promise<{ order?: string; payment?: string }>;
}) {
  const { order, payment } = await searchParams;

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-white p-6 text-center sm:p-10">
      <CheckCircle2 className="mx-auto h-20 w-20 animate-pulse text-[var(--accent)]" />
      <h1 className="mt-4 text-3xl font-black sm:text-4xl">Thank You. Order Placed Successfully.</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        Tumepokea oda yako. Timu yetu itakupigia ndani ya masaa 24 kuthibitisha oda, usafirishaji, na mpango wa malipo.
      </p>
      <div className="mx-auto mt-6 max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Order ID</p>
        <p className="text-base font-bold">{order ?? "Pending"}</p>
        <p className="mt-3 text-xs uppercase tracking-wide text-[var(--muted)]">Shipping Timeline</p>
        <p className="text-sm font-semibold">Dar es Salaam: 1-2 days</p>
        <p className="text-sm font-semibold">Outside Dar: 2-5 days</p>
        <p className="mt-2 text-xs text-[var(--muted)]">Gharama ya usafiri hutegemea eneo la mteja.</p>
        {payment === "bank-deposit" ? (
          <div className="mt-3 rounded-lg border border-[var(--border)] bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Bank Deposit Details</p>
            <p className="mt-1 text-sm"><span className="font-semibold">Bank:</span> {bankDetails.bankName}</p>
            <p className="text-sm"><span className="font-semibold">Account Name:</span> {bankDetails.accountName}</p>
            <p className="text-sm"><span className="font-semibold">A/C Number:</span> {bankDetails.accountNumber}</p>
          </div>
        ) : null}
      </div>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/" className={buttonVariants()}>
          Continue Shopping
        </Link>
        <Link href="/account" className={buttonVariants({ variant: "secondary" })}>
          Track My Order
        </Link>
        <Link href={whatsappLink} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
          Wasiliana WhatsApp
        </Link>
      </div>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left">
        <h2 className="text-lg font-black">Toa Review Baada ya Oda Kukamilika</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Ukisha-deliveriwa oda, unaweza kuandika review hapa kusaidia wateja wengine.
        </p>
        <div className="mt-3">
          <OrderReviewForm orderId={order} />
        </div>
      </div>
    </section>
  );
}
