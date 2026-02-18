import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return & Refund Policy | Faith Online Shop",
  description:
    "Sera ya kurudisha bidhaa na marejesho ya fedha ya Faith Online Shop kwa bidhaa zenye hitilafu au changamoto za ubora.",
  alternates: {
    canonical: "/return-refund-policy"
  }
};

export default function ReturnRefundPolicyPage() {
  return (
    <section className="max-w-3xl rounded-2xl border border-[var(--border)] bg-white p-6">
      <h1 className="text-3xl font-black">Return & Refund Policy</h1>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--muted)]">
        <p>Unaweza kurudisha bidhaa yenye tatizo ndani ya masaa 48 baada ya kupokea.</p>
        <p>Bidhaa inapaswa kuwa katika hali ile ile ilivyopokelewa na vifungashio vyake.</p>
        <p>Marejesho ya fedha hufanyika baada ya uthibitisho wa hitilafu ya bidhaa.</p>
      </div>
    </section>
  );
}
