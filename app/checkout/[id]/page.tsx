import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, Check, MapPin, Shield, Truck } from "lucide-react";
import { getCatalogProductById } from "@/lib/catalog";
import { formatTZS } from "@/lib/format";
import {
  getDescriptionHighlights,
  getDescriptionParagraphs,
  getStorefrontProductBenefits,
  getStorefrontProductDescription,
  getStorefrontProductWhoFor,
  humanizeSlug
} from "@/lib/storefront-copy";
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
      title: "Product Not Found",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return {
    title: product.name,
    description: `${product.name} for ${formatTZS(product.salePrice)} with Cash on Delivery, Pesapal, and M-Pesa / Bank Transfer available.`,
    alternates: {
      canonical: `/checkout/${product.id}`
    },
    openGraph: {
      title: product.name,
      description: `${formatTZS(product.salePrice)} - Faith Online Shop`,
      url: `/checkout/${product.id}`,
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

  const productDescription = getStorefrontProductDescription(product);
  const productBenefits = getStorefrontProductBenefits(product);
  const productWhoFor = getStorefrontProductWhoFor(product);
  const descriptionParagraphs = getDescriptionParagraphs(productDescription);
  const descriptionHighlights = getDescriptionHighlights(productDescription, productBenefits);
  const summaryParagraph = descriptionParagraphs[0] ?? productDescription;
  const detailParagraphs = descriptionParagraphs.slice(1);
  const discountPercent =
    product.originalPrice > 0
      ? Math.max(0, Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100))
      : 0;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.gallery,
    description: productDescription,
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
            {discountPercent > 0 ? (
              <span className="rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-black">-{discountPercent}%</span>
            ) : null}
          </div>
          <p className="text-base leading-7 text-[var(--muted)]">{summaryParagraph}</p>
          <div className="grid gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs sm:grid-cols-3 sm:text-sm">
            <p><span className="font-bold">SKU:</span> {product.sku}</p>
            <p><span className="font-bold">Brand:</span> {product.brand}</p>
            <p>
              <span className="font-bold">Category:</span> {humanizeSlug(product.category)}
              {product.subCategory ? ` / ${humanizeSlug(product.subCategory)}` : ""}
            </p>
          </div>

          <section className="grid grid-cols-2 gap-2 text-xs font-semibold text-[var(--muted)] sm:text-sm">
            <p className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-[var(--primary)]" /> Reliable delivery across Tanzania</p>
            <p className="inline-flex items-center gap-2"><Shield className="h-4 w-4 text-[var(--primary)]" /> Cash on Delivery, Pesapal, or M-Pesa / Bank Transfer</p>
            <p className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[var(--primary)]" /> Shipping cost depends on your location</p>
            <p className={`inline-flex items-center gap-2 ${product.inStock ? "" : "text-red-700"}`}>
              {product.inStock ? <Check className="h-4 w-4 text-[var(--primary)]" /> : <AlertTriangle className="h-4 w-4 text-red-700" />}
              {product.inStock ? "In Stock Now" : "Out of Stock"}
            </p>
          </section>

          {product.inStock ? (
            <CheckoutOrderForm product={product} />
          ) : (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-base font-black text-red-700">This product is currently out of stock.</p>
              <p className="mt-1 text-sm text-red-700">
                Please choose another item from the shop or contact us to check when it will be available again.
              </p>
            </div>
          )}
        </article>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <h2 className="text-lg font-black">Product Details</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
            {(detailParagraphs.length ? detailParagraphs : [summaryParagraph]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <h2 className="text-lg font-black">Key Highlights</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {descriptionHighlights.map((highlight) => (
              <li key={highlight} className="inline-flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <h2 className="text-lg font-black">Why Customers Choose It</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {productBenefits.map((benefit) => (
              <li key={benefit} className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-[var(--accent)]" /> {benefit}
            </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <h2 className="text-lg font-black">Best For</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{productWhoFor}</p>
        </article>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </section>
  );
}
