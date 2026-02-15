import Link from "next/link";
import Image from "next/image";
import { categories } from "@/lib/categories";
import { phoneNumber, whatsappLink } from "@/lib/constants";

export const SiteFooter = () => {
  return (
    <footer className="mt-14 bg-[#1a1a1a] pb-20 text-white md:pb-10">
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="grid grid-cols-3 overflow-hidden rounded-b-2xl border-x border-b border-white/15">
          <p className="bg-[var(--primary)] px-3 py-2 text-center text-[11px] font-black uppercase tracking-wide text-white">
            Lipa Unapopokea
          </p>
          <p className="bg-[var(--secondary)] px-3 py-2 text-center text-[11px] font-black uppercase tracking-wide text-[var(--foreground)]">
            Usafirishaji Bure
          </p>
          <p className="bg-[var(--accent)] px-3 py-2 text-center text-[11px] font-black uppercase tracking-wide text-[var(--foreground)]">
            Stock Ipo Tayari
          </p>
        </div>
      </div>

      <div className="mx-auto mt-8 grid w-full max-w-7xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
        <section>
          <Image src="/logo-main.png" alt="Faith Online Shop" width={200} height={56} className="h-11 w-auto" />
          <p className="mt-3 text-sm leading-relaxed text-gray-300">
            Duka la mtandaoni la Tanzania lenye bidhaa bora, usafirishaji bure, na malipo baada ya kupokea.
          </p>
          <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
            Tunahudumia wateja 10,000+ Tanzania
          </p>
        </section>

        <section>
          <h3 className="text-sm font-black uppercase tracking-[0.08em]">Quick Links</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-300">
            <li><Link href="/" className="transition hover:text-[var(--secondary)]">Home</Link></li>
            <li><Link href="/shop" className="transition hover:text-[var(--secondary)]">All Products</Link></li>
            <li><Link href="/categories" className="transition hover:text-[var(--secondary)]">Categories</Link></li>
            <li><Link href="/contact" className="transition hover:text-[var(--secondary)]">Contact</Link></li>
            <li><Link href="/shipping-policy" className="transition hover:text-[var(--secondary)]">Shipping Policy</Link></li>
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-black uppercase tracking-[0.08em]">Policies & Categories</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-300">
            <li><Link href="/return-refund-policy" className="transition hover:text-[var(--secondary)]">Return & Refund</Link></li>
            <li><Link href="/terms-and-conditions" className="transition hover:text-[var(--secondary)]">Terms</Link></li>
            <li><Link href="/privacy-policy" className="transition hover:text-[var(--secondary)]">Privacy</Link></li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link href={`/categories/${category.slug}`} className="transition hover:text-[var(--secondary)]">
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-black uppercase tracking-[0.08em]">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-300">
            <li><a href={`tel:${phoneNumber}`} className="transition hover:text-[var(--secondary)]">{phoneNumber}</a></li>
            <li>
              <Link href={whatsappLink} target="_blank" rel="noopener noreferrer" className="transition hover:text-[var(--secondary)]">
                WhatsApp Support
              </Link>
            </li>
            <li>Mon - Sun: 08:00 - 22:00</li>
            <li>Dar es Salaam, Tanzania</li>
          </ul>
        </section>
      </div>
      <p className="mt-8 border-t border-white/15 pt-5 text-center text-xs text-gray-400">
        © 2026 Faith Online Shop. All rights reserved.
        <Link
          href="https://www.driftmark.co.tz/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-[10px] text-white/5 transition hover:text-white/25"
          aria-label="Driftmark"
        >
          dm
        </Link>
      </p>
    </footer>
  );
};
