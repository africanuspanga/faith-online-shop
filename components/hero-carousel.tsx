"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { heroSlides } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";

export const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroSlides.length);
    }, 4500);

    return () => clearInterval(id);
  }, []);

  const slide = heroSlides[current];

  return (
    <section
      className="relative overflow-hidden rounded-2xl border-2 border-[var(--foreground)] bg-white shadow-[0_16px_40px_rgba(26,26,26,0.12)] sm:rounded-[28px]"
      aria-label="Top deals"
    >
      <Image
        src={slide.image}
        alt={slide.title}
        width={1400}
        height={700}
        priority
        className="h-[360px] w-full object-cover sm:h-[420px] lg:h-[460px]"
      />
      <div className="absolute inset-0 bg-black/30" />

      <div className="absolute inset-0 flex items-end md:items-center">
        <div className="m-3 w-[calc(100%-24px)] max-w-xl rounded-2xl border-2 border-[var(--foreground)] bg-white p-4 shadow-[0_10px_30px_rgba(26,26,26,0.18)] sm:m-6 sm:w-auto sm:p-6">
          <p className="inline-flex rounded-full bg-[var(--secondary)] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[var(--foreground)]">
            Faith Online Shop
          </p>
          <h1 className="mt-3 text-2xl font-black leading-[1.05] text-[var(--foreground)] sm:text-4xl lg:text-5xl">
            {slide.title}
          </h1>
          <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-[var(--muted)] sm:mt-3 sm:text-base">{slide.subtitle}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-bold">
              Usafiri BURE
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-bold">
              Lipa Unapopokea
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-bold">
              Ofa ya Leo
            </span>
          </div>
          <Link href="/shop" className={`${buttonVariants({ size: "lg" })} mt-6`}>
            {slide.cta}
          </Link>
        </div>
      </div>

      <aside className="absolute right-5 top-5 hidden w-56 space-y-2 lg:block">
        <article className="rounded-xl border border-[var(--foreground)] bg-[var(--secondary)] p-3">
          <p className="text-[11px] font-black uppercase tracking-wide">Deal Hot</p>
          <p className="mt-1 text-sm font-extrabold">Punguzo la 30% kwa bidhaa zote</p>
        </article>
        <article className="rounded-xl border border-[var(--foreground)] bg-white p-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-[var(--muted)]">Delivery</p>
          <p className="mt-1 text-sm font-bold">Tunafikisha nchi nzima ndani ya siku chache</p>
        </article>
      </aside>

      <div className="absolute bottom-3 right-3 hidden items-center gap-2 sm:flex">
        <button
          type="button"
          aria-label="Previous slide"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--foreground)] bg-white text-[var(--foreground)]"
          onClick={() => setCurrent((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--foreground)] bg-white text-[var(--foreground)]"
          onClick={() => setCurrent((prev) => (prev + 1) % heroSlides.length)}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="absolute bottom-3 left-3 flex gap-2 sm:bottom-4 sm:left-4">
        {heroSlides.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => setCurrent(idx)}
            className={`h-2.5 rounded-full transition-all ${idx === current ? "w-8 bg-[var(--secondary)]" : "w-2.5 bg-white/70"}`}
          />
        ))}
      </div>
    </section>
  );
};
