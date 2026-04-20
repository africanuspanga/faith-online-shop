import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MapPin, MessageCircle, Phone, Shield } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { phoneNumber, serviceHours, shopLocation, whatsappLink } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact Faith Online Shop Tanzania",
  description:
    "Contact Faith Online Shop by phone or WhatsApp for product questions, delivery help, or order support every day from 09:00 to 19:00.",
  alternates: {
    canonical: "/contact"
  }
};

export default function ContactPage() {
  return (
    <section className="space-y-6">
      <article className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <p className="text-xs font-black uppercase tracking-wide text-[var(--primary)]">Customer Support</p>
        <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Contact Faith Online Shop</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          Our support team is ready to help with orders, delivery questions, and product details. Pick the easiest way to reach us below.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`tel:${phoneNumber}`}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--primary)] px-4 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white"
          >
            <Phone className="h-4 w-4" /> Call Now
          </Link>
          <Link
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white transition hover:brightness-95"
          >
            <MessageCircle className="h-4 w-4" /> Open WhatsApp
          </Link>
        </div>
      </article>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        <article className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-xl font-black">Contact Details</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <Phone className="mt-0.5 h-4 w-4 text-[var(--primary)]" />
              <div>
                <p className="text-xs font-bold uppercase text-[var(--muted)]">Phone</p>
                <Link href={`tel:${phoneNumber}`} className="text-sm font-semibold hover:text-[var(--primary)]">
                  {phoneNumber}
                </Link>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <Clock className="mt-0.5 h-4 w-4 text-[var(--primary)]" />
              <div>
                <p className="text-xs font-bold uppercase text-[var(--muted)]">Support Hours</p>
                <p className="text-sm font-semibold">Mon - Sun: {serviceHours}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <MapPin className="mt-0.5 h-4 w-4 text-[var(--primary)]" />
              <div>
                <p className="text-xs font-bold uppercase text-[var(--muted)]">Location</p>
                <p className="text-sm font-semibold">{shopLocation}</p>
              </div>
            </div>
          </div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
            <Shield className="h-4 w-4 text-[var(--accent)]" /> Orders are confirmed by phone before dispatch.
          </p>
        </article>
        <ContactForm />
      </div>
    </section>
  );
}
