import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { whatsappLink } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { ManualPaymentDetails } from "@/components/manual-payment-details";
import { OrderReviewForm } from "@/components/order-review-form";

export const metadata: Metadata = {
  title: "Order Confirmed | Faith Online Shop",
  description:
    "Thank you for ordering from Faith Online Shop. Your order has been received and our team will contact you to confirm delivery and payment details.",
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
        We have received your order. Our team will contact you within 24 hours to confirm the order, delivery plan, and payment details.
      </p>
      <div className="mx-auto mt-6 max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Order ID</p>
        <p className="text-base font-bold">{order ?? "Pending"}</p>
        <p className="mt-3 text-xs uppercase tracking-wide text-[var(--muted)]">Shipping Timeline</p>
        <p className="text-sm font-semibold">Dar es Salaam: 1-2 days</p>
        <p className="text-sm font-semibold">Outside Dar: 2-5 days</p>
        <p className="mt-2 text-xs text-[var(--muted)]">Shipping cost depends on the customer&apos;s location.</p>
        {payment === "bank-deposit" ? (
          <div className="mt-3">
            <ManualPaymentDetails title="M-Pesa / Bank Transfer Details" note="Send your payment proof on WhatsApp so the team can confirm your order quickly." />
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
          Contact on WhatsApp
        </Link>
      </div>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left">
        <h2 className="text-lg font-black">Leave a Review After Delivery</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Once your order has been delivered, you can leave a review here to help other customers.
        </p>
        <div className="mt-3">
          <OrderReviewForm orderId={order} />
        </div>
      </div>
    </section>
  );
}
