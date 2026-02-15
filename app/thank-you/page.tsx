import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { whatsappLink } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Order Confirmed | Faith Online Shop",
  description:
    "Asante kwa kuagiza Faith Online Shop. Oda yako imepokelewa na timu yetu itakupigia kuthibitisha delivery."
};

export default async function ThankYouPage({
  searchParams
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-white p-6 text-center sm:p-10">
      <CheckCircle2 className="mx-auto h-20 w-20 animate-pulse text-[var(--accent)]" />
      <h1 className="mt-4 text-3xl font-black sm:text-4xl">Thank You. Order Placed Successfully.</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        Tumepokea oda yako. Timu yetu itakupigia ndani ya masaa 24 kuthibitisha na kupanga delivery.
      </p>
      <div className="mx-auto mt-6 max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Order ID</p>
        <p className="text-base font-bold">{order ?? "Pending"}</p>
        <p className="mt-3 text-xs uppercase tracking-wide text-[var(--muted)]">Shipping Timeline</p>
        <p className="text-sm font-semibold">Dar es Salaam: 1-2 days</p>
        <p className="text-sm font-semibold">Outside Dar: 2-5 days</p>
      </div>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/" className={buttonVariants()}>
          Continue Shopping
        </Link>
        <Link href={whatsappLink} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
          Wasiliana WhatsApp
        </Link>
      </div>
    </section>
  );
}
