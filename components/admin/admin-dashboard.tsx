"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Bell, LoaderCircle, LogOut, Package, Pencil, Printer, RefreshCcw, Trash2, X } from "lucide-react";
import { categories } from "@/lib/categories";
import { formatTZS } from "@/lib/format";
import type { CategorySlug, OrderRecord, PaymentStatus } from "@/lib/types";
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
  sku?: string;
  brand?: string;
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
  size_options?: string[] | string;
  sizeOptions?: string[] | string;
  color_options?: string[] | string;
  colorOptions?: string[] | string;
};

const defaultCategoryChoices = categories.map((item) => item.slug);

const defaultProductForm = {
  name: "",
  category: defaultCategoryChoices[0] ?? "general",
  sku: "",
  brand: "Faith Select",
  originalPrice: "",
  salePrice: "",
  image: "/placeholder.svg",
  rating: "4.5",
  sold: "0",
  sizeOptions: "",
  colorOptions: "",
  inStock: true,
  isNew: false,
  bestSelling: false,
  descriptionSw: "",
  whoForSw: "",
  benefitsSw: "",
  gallery: ""
};

const orderStatusOptions: OrderRecord["status"][] = ["pending", "confirmed", "delivered", "cancelled"];
const paymentStatusOptions: PaymentStatus[] = [
  "unpaid",
  "pending",
  "partial",
  "paid",
  "failed",
  "pending-verification"
];

const toStringList = (value: string[] | string | undefined) => {
  if (!value) return "";
  if (Array.isArray(value)) return value.join("\n");
  return value;
};

const normalizeCategorySlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const categoryLabel = (value: string) =>
  value
    .split("-")
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");

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
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [categoryChoices, setCategoryChoices] = useState<string[]>(defaultCategoryChoices);
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

  const { data: analyticsData, mutate: refreshAnalytics, isLoading: loadingAnalytics } = useSWR<{
    source: string;
    totalViews: number;
    todayViews: number;
    totalSignups: number;
  }, Error>(adminPassword ? ["/api/admin/analytics", adminPassword] : null, fetcher, {
    refreshInterval: 12000,
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

  useEffect(() => {
    setCategoryChoices((prev) => {
      const merged = new Set(prev.map((item) => normalizeCategorySlug(item)).filter(Boolean));
      categories.forEach((item) => merged.add(normalizeCategorySlug(item.slug)));
      products.forEach((item) => merged.add(normalizeCategorySlug(item.category)));
      const next = [...merged].filter(Boolean).sort((a, b) => a.localeCompare(b));
      const prevSorted = [...prev].sort((a, b) => a.localeCompare(b));
      return next.join("|") === prevSorted.join("|") ? prev : next;
    });
  }, [products]);

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

    const current = toStringList(productForm.gallery)
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

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

  const addCategoryChoice = () => {
    const normalized = normalizeCategorySlug(newCategoryInput);
    if (!normalized) {
      toast.error("Andika category mpya kwanza.");
      return;
    }

    setCategoryChoices((prev) => {
      if (prev.includes(normalized)) return prev;
      return [...prev, normalized].sort((a, b) => a.localeCompare(b));
    });
    setProductForm((prev) => ({ ...prev, category: normalized }));
    setNewCategoryInput("");
    toast.success("Category imeongezwa.");
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
          category: normalizeCategorySlug(productForm.category),
          sku: productForm.sku,
          brand: productForm.brand,
          originalPrice: Number(productForm.originalPrice),
          salePrice: Number(productForm.salePrice),
          image: productForm.image,
          rating: Number(productForm.rating),
          sold: Number(productForm.sold),
          sizeOptions: productForm.sizeOptions,
          colorOptions: productForm.colorOptions,
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
    const selectedCategory = normalizeCategorySlug(product.category) || defaultProductForm.category;
    setCategoryChoices((prev) => (prev.includes(selectedCategory) ? prev : [...prev, selectedCategory]));

    setEditingProductId(String(product.id ?? ""));
    setProductForm({
      name: product.name ?? "",
      category: selectedCategory,
      sku: String(product.sku ?? ""),
      brand: String(product.brand ?? "Faith Select"),
      originalPrice: String(product.originalPrice ?? product.original_price ?? ""),
      salePrice: String(product.salePrice ?? product.sale_price ?? ""),
      image: product.image ?? "/placeholder.svg",
      rating: String(product.rating ?? 4.5),
      sold: String(product.sold ?? 0),
      sizeOptions: toStringList(product.sizeOptions ?? product.size_options),
      colorOptions: toStringList(product.colorOptions ?? product.color_options),
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

  const updateOrder = async (
    order: AdminOrder,
    updates: {
      status?: AdminOrder["status"];
      paymentStatus?: PaymentStatus;
    }
  ) => {
    setUpdatingOrderId(order.id);

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({
          orderId: order.id,
          status: updates.status ?? order.status,
          paymentStatus: updates.paymentStatus ?? order.paymentStatus
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Order update failed");
      }

      toast.success("Order updated");
      await refreshOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Order update failed");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const printOrder = (order: AdminOrder) => {
    const printWindow = window.open("", "_blank", "width=960,height=720");
    if (!printWindow) {
      toast.error("Ruhusu popup ili kuchapisha oda.");
      return;
    }

    const paymentMethodLabel =
      order.paymentMethod === "pesapal"
        ? "Pesapal"
        : order.paymentMethod === "bank-deposit"
          ? "Bank Deposit"
          : "Cash on Delivery";

    const html = `
      <html>
        <head>
          <title>Order ${escapeHtml(order.id)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a; }
            h1 { margin-bottom: 4px; }
            p { margin: 4px 0; }
            .card { border: 1px solid #d7d7d7; border-radius: 12px; padding: 16px; margin-top: 16px; }
            .muted { color: #616161; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>Faith Online Shop - Order Print</h1>
          <p class="muted">Created: ${escapeHtml(new Date(order.createdAt).toLocaleString())}</p>
          <div class="card">
            <p><strong>Order ID:</strong> ${escapeHtml(order.id)}</p>
            <p><strong>Product:</strong> ${escapeHtml(order.productName ?? order.productId)}</p>
            <p><strong>Quantity:</strong> ${order.quantity}</p>
            <p><strong>Total:</strong> ${escapeHtml(formatTZS(order.total))}</p>
            <p><strong>Customer:</strong> ${escapeHtml(order.fullName)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(order.phone)}</p>
            <p><strong>Address:</strong> ${escapeHtml(order.address)}</p>
            <p><strong>Region/City:</strong> ${escapeHtml(order.regionCity)}</p>
            <p><strong>Size/Color:</strong> ${escapeHtml(order.selectedSize || "-")} / ${escapeHtml(order.selectedColor || "-")}</p>
            <p><strong>Payment:</strong> ${escapeHtml(paymentMethodLabel)} (${escapeHtml(order.paymentStatus || "unpaid")})</p>
            <p><strong>Deposit:</strong> ${escapeHtml(formatTZS(order.depositAmount || 0))}</p>
            <p><strong>Status:</strong> ${escapeHtml(order.status)}</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const refreshAll = async () => {
    await Promise.all([refreshOrders(), refreshProducts(), refreshAnalytics()]);
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
          {(loadingOrders || loadingProducts || loadingAnalytics) ? (
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

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-bold uppercase text-[var(--muted)]">Site Views (All)</p>
          <p className="mt-1 text-2xl font-black">{analyticsData?.totalViews ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-bold uppercase text-[var(--muted)]">Site Views (Today)</p>
          <p className="mt-1 text-2xl font-black text-[var(--secondary)]">{analyticsData?.todayViews ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-bold uppercase text-[var(--muted)]">First-Time Signups</p>
          <p className="mt-1 text-2xl font-black text-[var(--accent)]">{analyticsData?.totalSignups ?? 0}</p>
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
                <p className="text-xs text-[var(--muted)]">
                  Size/Color: {order.selectedSize || "-"} / {order.selectedColor || "-"}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Payment: {order.paymentMethod || "cash-on-delivery"} • {order.paymentStatus || "unpaid"}
                </p>

                <div className="mt-2 space-y-2">
                  <label className="text-xs font-semibold text-[var(--muted)]">Status</label>
                  <select
                    value={order.status}
                    disabled={updatingOrderId === order.id}
                    onChange={(event) =>
                      void updateOrder(order, {
                        status: event.target.value as AdminOrder["status"]
                      })
                    }
                    className="h-10 w-full rounded-lg border border-[var(--border)] px-3 capitalize"
                  >
                    {orderStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-2 space-y-2">
                  <label className="text-xs font-semibold text-[var(--muted)]">Payment Status</label>
                  <select
                    value={order.paymentStatus || "unpaid"}
                    disabled={updatingOrderId === order.id}
                    onChange={(event) =>
                      void updateOrder(order, {
                        paymentStatus: event.target.value as PaymentStatus
                      })
                    }
                    className="h-10 w-full rounded-lg border border-[var(--border)] px-3"
                  >
                    {paymentStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <Button type="button" variant="outline" className="mt-2 w-full" onClick={() => printOrder(order)}>
                  <Printer className="mr-2 h-4 w-4" /> Print Order
                </Button>
              </article>
            ))}
          </div>

          <div className="mt-3 hidden overflow-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                  <th className="py-2">Order</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Payment</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-[var(--border)] align-top">
                    <td className="py-3">
                      <p className="font-semibold">{order.productName ?? `#${order.productId}`}</p>
                      <p className="text-xs text-[var(--muted)]">{new Date(order.createdAt).toLocaleString()}</p>
                      <p className="text-xs text-[var(--muted)]">Size/Color: {order.selectedSize || "-"} / {order.selectedColor || "-"}</p>
                    </td>
                    <td className="py-3">
                      <p className="font-semibold">{order.fullName}</p>
                      <p className="text-xs text-[var(--muted)]">{order.phone}</p>
                      <p className="text-xs text-[var(--muted)]">{order.address}</p>
                    </td>
                    <td className="py-3">
                      <p className="text-xs font-semibold uppercase text-[var(--muted)]">{order.paymentMethod || "cash-on-delivery"}</p>
                      <select
                        value={order.paymentStatus || "unpaid"}
                        disabled={updatingOrderId === order.id}
                        onChange={(event) =>
                          void updateOrder(order, {
                            paymentStatus: event.target.value as PaymentStatus
                          })
                        }
                        className="mt-1 h-9 rounded-lg border border-[var(--border)] px-2 text-xs"
                      >
                        {paymentStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 font-bold text-[var(--primary)]">{formatTZS(order.total)}</td>
                    <td className="py-3">
                      <select
                        value={order.status}
                        disabled={updatingOrderId === order.id}
                        onChange={(event) =>
                          void updateOrder(order, {
                            status: event.target.value as AdminOrder["status"]
                          })
                        }
                        className="h-10 rounded-lg border border-[var(--border)] px-3 capitalize"
                      >
                        {orderStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3">
                      <Button type="button" variant="outline" onClick={() => printOrder(order)}>
                        <Printer className="mr-2 h-4 w-4" /> Print
                      </Button>
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

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  value={productForm.category}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, category: normalizeCategorySlug(event.target.value) as CategorySlug }))
                  }
                  className="h-12 w-full rounded-xl border border-[var(--border)] px-4"
                >
                  {categoryChoices.map((slug) => (
                    <option key={slug} value={slug}>
                      {categoryLabel(slug)}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Input
                    placeholder="New category"
                    value={newCategoryInput}
                    onChange={(event) => setNewCategoryInput(event.target.value)}
                  />
                  <Button type="button" variant="outline" onClick={addCategoryChoice}>
                    Add
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="SKU (e.g ELC-0001)"
                  value={productForm.sku}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, sku: event.target.value }))}
                />
                <Input
                  placeholder="Brand"
                  value={productForm.brand}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, brand: event.target.value }))}
                />
              </div>

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

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Sizes (comma/new line)"
                  value={productForm.sizeOptions}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, sizeOptions: event.target.value }))}
                />
                <Input
                  placeholder="Colors (comma/new line)"
                  value={productForm.colorOptions}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, colorOptions: event.target.value }))}
                />
              </div>

              <div>
                <Input
                  placeholder="Image URL (paste link)"
                  value={productForm.image}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, image: event.target.value }))}
                />
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Unaweza kupaste URL moja kwa moja au kutumia upload hapa chini.
                </p>
              </div>
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
                    <p className="text-xs text-[var(--muted)]">
                      {product.category} • {inStock ? "in-stock" : "out-of-stock"} • {product.brand ?? "Faith Select"} • {product.sku ?? "-"}
                    </p>
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
