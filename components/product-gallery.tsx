"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

export const ProductGallery = ({ images, alt }: ProductGalleryProps) => {
  const [index, setIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const prev = () => setIndex((current) => (current - 1 + images.length) % images.length);
  const next = () => setIndex((current) => (current + 1) % images.length);

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
        onTouchStart={(event) => setTouchStartX(event.changedTouches[0].screenX)}
        onTouchEnd={(event) => {
          if (touchStartX === null) return;
          const diff = event.changedTouches[0].screenX - touchStartX;
          if (diff > 50) prev();
          if (diff < -50) next();
          setTouchStartX(null);
        }}
      >
        <Image
          src={images[index]}
          alt={alt}
          width={700}
          height={700}
          className="aspect-square w-full object-cover"
          priority
        />
        <button
          type="button"
          aria-label="Previous image"
          onClick={prev}
          className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next image"
          onClick={next}
          className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {images.map((image, imageIndex) => (
          <button
            key={`${image}-${imageIndex}`}
            type="button"
            onClick={() => setIndex(imageIndex)}
            className={`overflow-hidden rounded-lg border ${
              index === imageIndex ? "border-[var(--primary)]" : "border-[var(--border)]"
            }`}
          >
            <Image src={image} alt={`${alt} ${imageIndex + 1}`} width={140} height={140} className="aspect-square w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};
