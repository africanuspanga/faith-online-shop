import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Faith Online Shop",
  description:
    "Faith Online Shop privacy policy covering the data we collect, how we use order information, and how to contact us.",
  alternates: {
    canonical: "/privacy-policy"
  }
};

export default function PrivacyPolicyPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <header className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--primary)]">Faith Online Shop</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          We respect your privacy. This policy explains the customer data we collect and how we use it to support orders and service communication.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-black">Data We Collect</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            We collect the basic details needed to complete an order, such as your name, phone number, region or city, and delivery address.
          </p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-black">Why We Use It</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            This information is used to confirm orders, arrange delivery, and contact you about order progress.
          </p>
        </article>
      </div>

      <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-lg font-black">Data Protection</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          We take data protection seriously by using secure systems and limiting access to people who need the information to manage orders.
        </p>
      </article>

      <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-lg font-black">Privacy Questions</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          If you have any question about your data or privacy, please contact us through the Contact page.
        </p>
      </article>
    </section>
  );
}
