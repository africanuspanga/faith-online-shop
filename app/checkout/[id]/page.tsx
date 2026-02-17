import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, MapPin, Shield, Truck } from "lucide-react";
import { getCatalogProductById } from "@/lib/catalog";
import { formatTZS } from "@/lib/format";
import { StarRating } from "@/components/star-rating";
import { ProductGallery } from "@/components/product-gallery";
import { CheckoutOrderForm } from "@/components/checkout-order-form";
import { Breadcrumbs } from "@/components/breadcrumbs";

interface CheckoutPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getCatalogProductById(id);

  if (!product) {
    return {
      title: "Product Not Found"
    };
  }

  return {
    title: product.name,
    description: `${product.name} kwa ${formatTZS(product.salePrice)}. Chagua malipo (COD, Pesapal, au Bank Deposit) na usafiri wa uhakika Tanzania.`,
    openGraph: {
      title: product.name,
      description: `${formatTZS(product.salePrice)} - Faith Online Shop`,
      images: [{ url: product.image }]
    }
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { id } = await params;
  const product = await getCatalogProductById(id);

  if (!product) {
    notFound();
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.gallery,
    description: product.descriptionSw,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: "TZS",
      price: product.salePrice,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  return (
    <section className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: product.name }
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <article className="space-y-4">
          <ProductGallery images={product.gallery} alt={product.name} />
        </article>

        <article className="space-y-4">
          <h1 className="text-3xl font-black leading-tight sm:text-4xl">{product.name}</h1>
          <StarRating rating={product.rating} />
          <div className="flex items-end gap-3">
            <p className="text-3xl font-black text-[var(--primary)]">{formatTZS(product.salePrice)}</p>
            <p className="text-base text-[var(--muted)] line-through">{formatTZS(product.originalPrice)}</p>
            <span className="rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-black">-30%</span>
          </div>
          <p className="leading-relaxed text-[var(--muted)]">{product.descriptionSw}</p>
          <div className="grid gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs sm:grid-cols-3 sm:text-sm">
            <p><span className="font-bold">SKU:</span> {product.sku}</p>
            <p><span className="font-bold">Brand:</span> {product.brand}</p>
            <p>
              <span className="font-bold">Category:</span> {product.category}
              {product.subCategory ? ` / ${product.subCategory}` : ""}
            </p>
          </div>

          <section className="grid grid-cols-2 gap-2 text-xs font-semibold text-[var(--muted)] sm:text-sm">
            <p className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-[var(--primary)]" /> Usafiri wa uhakika Tanzania nzima</p>
            <p className="inline-flex items-center gap-2"><Shield className="h-4 w-4 text-[var(--primary)]" /> COD, Pesapal, au Bank Deposit</p>
            <p className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[var(--primary)]" /> Gharama ya usafiri hutegemea eneo</p>
            <p className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[var(--primary)]" /> In Stock Now</p>
          </section>

          <CheckoutOrderForm product={product} />
        </article>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
        <h2 className="text-lg font-black">FAIDA ZA BIDHAA</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {product.benefitsSw.map((benefit) => (
            <li key={benefit} className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-[var(--accent)]" /> {benefit}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
        <h2 className="text-lg font-black">INAFAA KWA</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{product.whoForSw}</p>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </section>
  );
}
