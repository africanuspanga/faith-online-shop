import type { MetadataRoute } from "next";
import { getCatalogCategories, getCatalogProducts } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.faithshop.co.tz";
  const products = await getCatalogProducts();
  const categories = await getCatalogCategories();
  const now = new Date();
  const staticPages = [
    "",
    "/shop",
    "/categories",
    "/contact",
    "/shipping-policy",
    "/return-refund-policy",
    "/terms-and-conditions",
    "/privacy-policy"
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/shop" ? 0.95 : 0.8
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${base}/categories/${category.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${base}/checkout/${product.id}`,
    lastModified: new Date(product.createdAt),
    changeFrequency: "weekly",
    priority: 0.9
  }));

  return [
    ...staticEntries,
    ...categoryEntries,
    ...productEntries
  ];
}
