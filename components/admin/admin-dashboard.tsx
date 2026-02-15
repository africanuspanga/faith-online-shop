"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Bell, LoaderCircle, LogOut, Package, Pencil, RefreshCcw, Trash2, X } from "lucide-react";
import { categories } from "@/lib/categories";
import { formatTZS } from "@/lib/format";
import type { CategorySlug, OrderRecord } from "@/lib/types";
import { ADMIN_STORAGE_KEY } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type AdminOrder = OrderRecord & {
  productName?: string;
};

type AdminProduct = {
  id?: string | number;
  name: string;
  category: string;
  sale_price?: number;
  salePrice?: number;
  original_price?: number;
  originalPrice?: number;
  rating?: number;
  sold?: number;
  in_stock?: boolean;
  inStock?: boolean;
  is_new?: boolean;
  isNew?: boolean;
  best_selling?: boolean;
  bestSelling?: boolean;
  description_sw?: string;
  descriptionSw?: string;
  who_for_sw?: string;
  whoForSw?: string;
  benefits_sw?: string[] | string;
  benefitsSw?: string[] | string;
  gallery?: string[] | string;
  image?: string;
};

const defaultProductForm = {
  name: "",
  category: categories[0].slug,
  originalPrice: "",
  salePrice: "",
  image: "/placeholder.svg",
  rating: "4.5",
  sold: "0",
  inStock: true,
  isNew: false,
  bestSelling: false,
  descriptionSw: "",
  whoForSw: "",
  benefitsSw: "",
  gallery: ""
};

const toStringList = (value: string[] | string | undefined) => {
  if (!value) return "";
  if (Array.isArray(value)) return value.join("\n");
  return value;
};

const fetcher = async ([url, adminPassword]: [string, string]) => {
  const response = await fetch(url, {
    headers: {
      "x-admin-password": adminPassword
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Request failed");
  }

  return response.json();
};

export const AdminDashboard = () => {
  const router = useRouter();
  const [adminPassword, setAdminPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [importingStarter, setImportingStarter] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [productForm, setProductForm] = useState(defaultProductForm);

  useEffect(() => {
    const current = window.localStorage.getItem(ADMIN_STORAGE_KEY) ?? "";
    if (!current) {
      router.replace("/admin/login");
      return;
    }
    setAdminPassword(current);
  }, [router]);

  const { data: ordersData, mutate: refreshOrders, isLoading: loadingOrders, error: ordersError } = useSWR<{
    source: string;
    orders: AdminOrder[];
  }, Error>(adminPassword ? ["/api/orders", adminPassword] : null, fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true
  });

  const { data: productsData, mutate: refreshProducts, isLoading: loadingProducts, error: productsError } = useSWR<{
    source: string;
    products: AdminProduct[];
  }, Error>(adminPassword ? ["/api/admin/products", adminPassword] : null, fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true
  });

  const orders = useMemo(() => ordersData?.orders ?? [], [ordersData]);
  const products = useMemo(() => productsData?.products ?? [], [productsData]);

  const previousOrderIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  useEffect(() => {
    const message = `${ordersError?.message ?? ""} ${productsError?.message ?? ""}`.toLowerCase();
    if (!message.includes("unauthorized")) return;
    window.localStorage.removeItem(ADMIN_STORAGE_KEY);
    router.replace("/admin/login");
  }, [ordersError, productsError, router]);

  useEffect(() => {
    const next = new Set(orders.map((order) => order.id));

    if (!firstLoad.current) {
      const newCount = orders.filter((order) => !previousOrderIds.current.has(order.id)).length;
      if (newCount > 0) {
        toast.info(`${newCount} new order${newCount > 1 ? "s" : ""} received`, {
          icon: <Bell className="h-4 w-4" />
        });
      }
    }

    firstLoad.current = false;
    previousOrderIds.current = next;
  }, [orders]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pending = orders.filter((order) => order.status === "pending").length;
    const confirmed = orders.filter((order) => order.status === "confirmed").length;
    const delivered = orders.filter((order) => order.status === "delivered").length;
    const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);

    return { totalOrders, pending, confirmed, delivered, revenue };
  }, [orders]);

  const logout = () => {
    window.localStorage.removeItem(ADMIN_STORAGE_KEY);
    router.push("/admin/login");
    router.refresh();
  };

  const uploadImage = async () => {
    if (!imageFile) {
      toast.error("Choose an image first");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          "x-admin-password": adminPassword
        },
        body: formData
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed");
      }

      setProductForm((prev) => ({ ...prev, image: payload.url }));
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const addCurrentImageToGallery = () => {
    const image = productForm.image.trim();
    if (!image) {
      toast.error("Set cover image first");
      return;
    }

    const current = toStringList(productForm.gallery).split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
    if (current.includes(image)) {
      toast.info("Image already in gallery");
      return;
    }

    setProductForm((prev) => ({
      ...prev,
      gallery: [...current, image].join("\n")
    }));
    toast.success("Image added to gallery");
  };

  const saveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/products", {
        method: editingProductId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({
          id: editingProductId,
          name: productForm.name,
          category: productForm.category,
          originalPrice: Number(productForm.originalPrice),
          salePrice: Number(productForm.salePrice),
          image: productForm.image,
          rating: Number(productForm.rating),
          sold: Number(productForm.sold),
          inStock: productForm.inStock,
          isNew: productForm.isNew,
          bestSelling: productForm.bestSelling,
          descriptionSw: productForm.descriptionSw,
          whoForSw: productForm.whoForSw,
          benefitsSw: productForm.benefitsSw,
          gallery: productForm.gallery
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save product");
      }

      toast.success(editingProductId ? "Product updated" : "Product added");
      if (payload.warning) {
        toast.info(String(payload.warning));
      }
      setEditingProductId(null);
      setProductForm(defaultProductForm);
      setImageFile(null);
      await refreshProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save product");
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (product: AdminProduct) => {
    const selectedCategory = categories.some((item) => item.slug === product.category)
      ? (product.category as CategorySlug)
      : categories[0].slug;

    setEditingProductId(String(product.id ?? ""));
    setProductForm({
      name: product.name ?? "",
      category: selectedCategory,
      originalPrice: String(product.originalPrice ?? product.original_price ?? ""),
      salePrice: String(product.salePrice ?? product.sale_price ?? ""),
      image: product.image ?? "/placeholder.svg",
      rating: String(product.rating ?? 4.5),
      sold: String(product.sold ?? 0),
      inStock: Boolean(product.inStock ?? product.in_stock ?? true),
      isNew: Boolean(product.isNew ?? product.is_new ?? false),
      bestSelling: Boolean(product.bestSelling ?? product.best_selling ?? false),
      descriptionSw: product.descriptionSw ?? product.description_sw ?? "",
      whoForSw: product.whoForSw ?? product.who_for_sw ?? "",
      benefitsSw: toStringList(product.benefitsSw ?? product.benefits_sw),
      gallery: toStringList(product.gallery)
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setProductForm(defaultProductForm);
    setImageFile(null);
  };

  const deleteProduct = async (id: string) => {
    const proceed = window.confirm("Delete this product? This cannot be undone.");
    if (!proceed) return;

    setDeletingProductId(id);
    try {
      const response = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": adminPassword
        }
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete product");
      }

      toast.success("Product deleted");
      if (editingProductId === id) {
        cancelEdit();
      }
      await refreshProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete product");
    } finally {
      setDeletingProductId(null);
    }
  };

  const updateStatus = async (orderId: string, status: AdminOrder["status"]) => {
    setUpdatingOrderId(orderId);

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({ orderId, status })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Status update failed");
      }

      toast.success("Order status updated");
      await refreshOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status update failed");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const refreshAll = async () => {
    await Promise.all([refreshOrders(), refreshProducts()]);
  };

  const importStarterProducts = async () => {
    setImportingStarter(true);
    try {
      const response = await fetch("/api/admin/products", {
        method: "PUT",
        headers: {
          "x-admin-password": adminPassword
        }
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to import starter products");
      }

      toast.success(`Starter products imported (${payload.imported ?? 30})`);
      await refreshProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import starter products");
    } finally {
      setImportingStarter(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => void refreshAll()}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
          {(loadingOrders || loadingProducts) ? (
            <span className="ml-auto inline-flex items-center gap-2 text-xs text-[var(--muted)]">
              <LoaderCircle className="h-4 w-4 animate-spin" /> Syncing...
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-bold uppercase text-[var(--muted)]">Total Orders</p>
          <p className="mt-1 text-2xl font-black">{stats.totalOrders}</p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-bold uppercase text-[var(--muted)]">Pending</p>
          <p className="mt-1 text-2xl font-black text-[var(--secondary)]">{stats.pending}</p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-bold uppercase text-[var(--muted)]">Confirmed</p>
          <p className="mt-1 text-2xl font-black text-[var(--accent)]">{stats.confirmed}</p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-bold uppercase text-[var(--muted)]">Delivered</p>
          <p className="mt-1 text-2xl font-black text-green-700">{stats.delivered}</p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-bold uppercase text-[var(--muted)]">Total Revenue</p>
          <p className="mt-1 text-2xl font-black text-[var(--primary)]">{formatTZS(stats.revenue)}</p>
        </article>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <h2 className="text-xl font-black">Orders</h2>

          <div className="mt-3 space-y-3 md:hidden">
            {orders.map((order) => (
              <article key={order.id} className="rounded-xl border border-[var(--border)] p-3 text-sm">
                <p className="font-bold">{order.productName ?? `#${order.productId}`}</p>
                <p className="text-[var(--muted)]">{order.fullName} • {order.phone}</p>
                <p className="text-[var(--muted)]">{order.address}</p>
                <p className="mt-1 font-semibold">Qty: {order.quantity} • {formatTZS(order.total)}</p>
                <div className="mt-2">
                  <label className="text-xs font-semibold text-[var(--muted)]">Status</label>
                  <select
                    value={order.status}
                    disabled={updatingOrderId === order.id}
                    onChange={(event) => void updateStatus(order.id, event.target.value as AdminOrder["status"])}
                    className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3 capitalize"
                  >
                    <option value="pending">pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-3 hidden overflow-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                  <th className="py-2">Order</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-[var(--border)] align-top">
                    <td className="py-3">
                      <p className="font-semibold">{order.productName ?? `#${order.productId}`}</p>
                      <p className="text-xs text-[var(--muted)]">{new Date(order.createdAt).toLocaleString()}</p>
                    </td>
                    <td className="py-3">
                      <p className="font-semibold">{order.fullName}</p>
                      <p className="text-xs text-[var(--muted)]">{order.phone}</p>
                      <p className="text-xs text-[var(--muted)]">{order.address}</p>
                    </td>
                    <td className="py-3">{order.quantity}</td>
                    <td className="py-3 font-bold text-[var(--primary)]">{formatTZS(order.total)}</td>
                    <td className="py-3">
                      <select
                        value={order.status}
                        disabled={updatingOrderId === order.id}
                        onChange={(event) => void updateStatus(order.id, event.target.value as AdminOrder["status"])}
                        className="h-10 rounded-lg border border-[var(--border)] px-3 capitalize"
                      >
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="delivered">delivered</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">{editingProductId ? "Edit Product" : "Add Product"}</h2>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => void importStarterProducts()} disabled={importingStarter}>
                  {importingStarter ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Import Starter 30
                </Button>
                {editingProductId ? (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    <X className="mr-2 h-4 w-4" /> Cancel Edit
                  </Button>
                ) : null}
              </div>
            </div>
            <form onSubmit={saveProduct} className="mt-3 space-y-3">
              <Input
                placeholder="Product name"
                value={productForm.name}
                onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <select
                value={productForm.category}
                onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value as CategorySlug }))}
                className="h-12 w-full rounded-xl border border-[var(--border)] px-4"
              >
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.label}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Original price (TZS)"
                  value={productForm.originalPrice}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, originalPrice: event.target.value }))}
                  required
                />
                <Input
                  type="number"
                  placeholder="Sale price (TZS)"
                  value={productForm.salePrice}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, salePrice: event.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step="0.1"
                  placeholder="Rating (0-5)"
                  value={productForm.rating}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, rating: event.target.value }))}
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Sold count"
                  value={productForm.sold}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, sold: event.target.value }))}
                />
              </div>

              <Input
                placeholder="Image URL"
                value={productForm.image}
                onChange={(event) => setProductForm((prev) => ({ ...prev, image: event.target.value }))}
              />
              <Input
                placeholder="Gallery URLs (comma or new line separated)"
                value={productForm.gallery}
                onChange={(event) => setProductForm((prev) => ({ ...prev, gallery: event.target.value }))}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={productForm.inStock}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, inStock: event.target.checked }))}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  In Stock
                </label>
                <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={productForm.isNew}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, isNew: event.target.checked }))}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  New Product
                </label>
                <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={productForm.bestSelling}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, bestSelling: event.target.checked }))}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  Best Selling
                </label>
              </div>

              <textarea
                placeholder="Description (Swahili)"
                value={productForm.descriptionSw}
                onChange={(event) => setProductForm((prev) => ({ ...prev, descriptionSw: event.target.value }))}
                className="min-h-24 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm"
              />
              <textarea
                placeholder="Benefits (Swahili, comma or new line separated)"
                value={productForm.benefitsSw}
                onChange={(event) => setProductForm((prev) => ({ ...prev, benefitsSw: event.target.value }))}
                className="min-h-24 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm"
              />
              <textarea
                placeholder="Who is this for? (Swahili)"
                value={productForm.whoForSw}
                onChange={(event) => setProductForm((prev) => ({ ...prev, whoForSw: event.target.value }))}
                className="min-h-20 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm"
              />

              <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Upload image</p>
                <Input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button type="button" variant="outline" onClick={() => void uploadImage()} disabled={uploadingImage}>
                    {uploadingImage ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Upload as Cover
                  </Button>
                  <Button type="button" variant="outline" onClick={addCurrentImageToGallery}>
                    Add Cover To Gallery
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
                {editingProductId ? "Update Product" : "Save Product"}
              </Button>
            </form>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <h2 className="text-xl font-black">Current Products</h2>
            <div className="mt-3 max-h-64 space-y-2 overflow-auto">
              {products.slice(0, 30).map((product, index) => {
                const sale = product.salePrice ?? product.sale_price ?? 0;
                const original = product.originalPrice ?? product.original_price ?? 0;
                const productId = String(product.id ?? index);
                const inStock = Boolean(product.inStock ?? product.in_stock ?? true);

                return (
                  <article key={productId} className="rounded-xl border border-[var(--border)] p-3 text-sm">
                    <p className="font-semibold line-clamp-1">{product.name}</p>
                    <p className="text-xs text-[var(--muted)]">{product.category} • {inStock ? "in-stock" : "out-of-stock"}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-sm font-bold text-[var(--primary)]">{formatTZS(Number(sale))}</p>
                      <p className="text-xs text-[var(--muted)] line-through">{formatTZS(Number(original))}</p>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button type="button" variant="outline" onClick={() => editProduct(product)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void deleteProduct(productId)}
                        disabled={deletingProductId === productId}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        {deletingProductId === productId ? (
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
