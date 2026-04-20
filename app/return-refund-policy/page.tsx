import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return & Refund Policy | Faith Online Shop",
  description:
    "Faith Online Shop return and refund policy for faulty items or verified product quality issues.",
  alternates: {
    canonical: "/return-refund-policy"
  }
};

export default function ReturnRefundPolicyPage() {
  return (
    <section className="max-w-3xl rounded-2xl border border-[var(--border)] bg-white p-6">
      <h1 className="text-3xl font-black">Return & Refund Policy</h1>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--muted)]">
        <p>You can return a faulty product within 48 hours of receiving it.</p>
        <p>The product should remain in the same condition it was delivered in, together with its packaging.</p>
        <p>Refunds are processed after the issue has been verified.</p>
      </div>
    </section>
  );
}
