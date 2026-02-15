import type { MetadataRoute } from "next";
import { categories } from "@/lib/categories";
import { getCatalogProducts } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.faithshop.co.tz";
  const products = await getCatalogProducts();
  const staticPages = [
    "",
    "/shop",
    "/contact",
    "/shipping-policy",
    "/return-refund-policy",
    "/terms-and-conditions",
    "/privacy-policy"
  ];

  return [
    ...staticPages.map((path) => ({
      url: `${base}${path}`,
      lastModified: new Date()
    })),
    ...categories.map((category) => ({
      url: `${base}/categories/${category.slug}`,
      lastModified: new Date()
    })),
    ...products.map((product) => ({
      url: `${base}/checkout/${product.id}`,
      lastModified: new Date(product.createdAt)
    }))
  ];
}
