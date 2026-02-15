import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MapPin, MessageCircle, Phone, Shield } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { phoneNumber, whatsappLink } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact Faith Online Shop Tanzania",
  description:
    "Wasiliana na Faith Online Shop kupitia simu au WhatsApp kwa maswali ya oda, usafiri, au bidhaa. Tunapatikana kila siku."
};

export default function ContactPage() {
  return (
    <section className="space-y-6">
      <article className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <p className="text-xs font-black uppercase tracking-wide text-[var(--primary)]">Customer Support</p>
        <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Wasiliana na Faith Online Shop</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          Tuna timu ya huduma kwa wateja inayojibu haraka kuhusu oda, delivery, na maelezo ya bidhaa. Chagua njia
          rahisi kwako hapa chini.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`tel:${phoneNumber}`}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--primary)] px-4 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white"
          >
            <Phone className="h-4 w-4" /> Piga Simu
          </Link>
          <Link
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white transition hover:brightness-95"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp Sasa
          </Link>
        </div>
      </article>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        <article className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-xl font-black">Maelezo ya Mawasiliano</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <Phone className="mt-0.5 h-4 w-4 text-[var(--primary)]" />
              <div>
                <p className="text-xs font-bold uppercase text-[var(--muted)]">Simu</p>
                <Link href={`tel:${phoneNumber}`} className="text-sm font-semibold hover:text-[var(--primary)]">
                  {phoneNumber}
                </Link>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <Clock className="mt-0.5 h-4 w-4 text-[var(--primary)]" />
              <div>
                <p className="text-xs font-bold uppercase text-[var(--muted)]">Muda wa Huduma</p>
                <p className="text-sm font-semibold">Mon - Sun: 08:00 - 22:00</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <MapPin className="mt-0.5 h-4 w-4 text-[var(--primary)]" />
              <div>
                <p className="text-xs font-bold uppercase text-[var(--muted)]">Location</p>
                <p className="text-sm font-semibold">Dar es Salaam, Tanzania</p>
              </div>
            </div>
          </div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
            <Shield className="h-4 w-4 text-[var(--accent)]" /> Oda zote zinathibitishwa kwa simu kabla ya kutumwa.
          </p>
        </article>
        <ContactForm />
      </div>
    </section>
  );
}
