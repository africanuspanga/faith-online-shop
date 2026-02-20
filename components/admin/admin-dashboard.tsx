"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import useSWR from "swr";
import { Bell, LoaderCircle, LogOut, Package, Pencil, Printer, RefreshCcw, Trash2, X } from "lucide-react";
import { categories } from "@/lib/categories";
import { bankDetails, phoneNumber, shopLocation } from "@/lib/constants";
import { formatTZS } from "@/lib/format";
import { defaultQuantityOffers, quantityOffersToText, toQuantityOffers } from "@/lib/quantity-offers";
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
  sub_category?: string;
  subCategory?: string;
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
  quantity_options?: unknown;
  quantityOptions?: unknown;
};

const defaultCategoryChoices = categories.map((item) => item.slug);

const defaultProductForm = {
  name: "",
  category: defaultCategoryChoices[0] ?? "general",
  subCategory: "",
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
  gallery: "",
  quantityOptions: quantityOffersToText(defaultQuantityOffers)
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

const toImageSource = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "/placeholder.svg";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed) || trimmed.startsWith("/")) return trimmed;
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return `/${trimmed}`;
};
const placeholderPattern = /(^|\/)placeholder\.svg(?:[?#].*)?$/i;
const isPlaceholderImage = (value: string | null | undefined) => {
  const normalized = value?.trim() ?? "";
  return !normalized || placeholderPattern.test(normalized);
};
const toImageList = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

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

const getOrderAmountPaid = (order: AdminOrder) => {
  const fallback =
    order.paymentStatus === "paid"
      ? Number(order.total || 0)
      : order.paymentStatus === "partial"
        ? Number(order.depositAmount || 0)
        : 0;
  const value = Number(order.amountPaid ?? fallback);
  return Number.isFinite(value) ? value : fallback;
};

const getOrderBalance = (order: AdminOrder) => {
  const fallback = Math.max(Number(order.total || 0) - getOrderAmountPaid(order), 0);
  const value = Number(order.balanceDue ?? fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(value, 0);
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
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [categoryChoices, setCategoryChoices] = useState<string[]>(defaultCategoryChoices);
  const [productForm, setProductForm] = useState(defaultProductForm);
  const imagePreviewSrc = useMemo(() => toImageSource(productForm.image), [productForm.image]);

  useEffect(() => {
    setImagePreviewFailed(false);
  }, [imagePreviewSrc]);

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
    const revenue = orders.reduce((sum, order) => sum + getOrderAmountPaid(order), 0);
    const outstanding = orders.reduce((sum, order) => sum + getOrderBalance(order), 0);

    return { totalOrders, pending, confirmed, delivered, revenue, outstanding };
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
    const image = toImageSource(productForm.image);
    if (isPlaceholderImage(image)) {
      toast.error("Set cover image first");
      return;
    }

    const current = toImageList(toStringList(productForm.gallery)).map((item) => toImageSource(item));

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
          subCategory: normalizeCategorySlug(productForm.subCategory),
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
          gallery: productForm.gallery,
          quantityOptions: productForm.quantityOptions
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
      subCategory: String(product.subCategory ?? product.sub_category ?? ""),
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
      gallery: toStringList(product.gallery),
      quantityOptions: quantityOffersToText(toQuantityOffers(product.quantityOptions ?? product.quantity_options))
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
      paymentAmount?: number;
      paymentMethod?: "manual" | "cash-on-delivery" | "bank-deposit" | "pesapal";
      paymentNote?: string;
      shippingAdjustment?: number;
      shippingAdjustmentNote?: string;
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
          paymentStatus: updates.paymentStatus,
          paymentAmount: updates.paymentAmount,
          paymentMethod: updates.paymentMethod,
          paymentNote: updates.paymentNote,
          shippingAdjustment: updates.shippingAdjustment,
          shippingAdjustmentNote: updates.shippingAdjustmentNote
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

  const recordOrderPayment = async (order: AdminOrder) => {
    const currentBalance = getOrderBalance(order);
    if (currentBalance <= 0) {
      toast.info("Order hii tayari imelipwa yote.");
      return;
    }

    const amountInput = window.prompt(
      `Weka kiasi kilichopokelewa (balance ${formatTZS(currentBalance)}):`,
      String(Math.floor(currentBalance))
    );
    if (!amountInput) return;

    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Kiasi si sahihi.");
      return;
    }

    const note = window.prompt("Maelezo ya malipo (hiari):", "Payment received by admin") ?? "";

    await updateOrder(order, {
      paymentAmount: amount,
      paymentMethod: "manual",
      paymentNote: note
    });
  };

  const adjustFreight = async (order: AdminOrder) => {
    const currentAdjustment = Number(order.shippingAdjustment || 0);
    const input = window.prompt(
      "Weka shipping adjustment mpya (unaweza kuweka negative):",
      String(currentAdjustment)
    );
    if (input === null) return;

    const shippingAdjustment = Number(input);
    if (!Number.isFinite(shippingAdjustment)) {
      toast.error("Shipping adjustment si sahihi.");
      return;
    }

    const note =
      window.prompt("Andika sababu ya adjustment (hiari):", order.shippingAdjustmentNote || "") ?? "";

    await updateOrder(order, {
      shippingAdjustment,
      shippingAdjustmentNote: note
    });
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

    const paidAmount = getOrderAmountPaid(order);
    const balanceDue = getOrderBalance(order);
    const shippingAdjustment = Number(order.shippingAdjustment || 0);

    const createdAt = new Date(order.createdAt);
    const invoiceDate = Number.isNaN(createdAt.getTime()) ? new Date() : createdAt;
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + (balanceDue > 0 ? 7 : 0));

    const formatDate = (value: Date) =>
      value.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

    const dateStamp = `${invoiceDate.getFullYear()}${String(invoiceDate.getMonth() + 1).padStart(2, "0")}${String(
      invoiceDate.getDate()
    ).padStart(2, "0")}`;
    const compactOrderId = order.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "ORDER";
    const invoiceNumber = `FaithSop${dateStamp}${compactOrderId}`;
    const logoPrimary = `${window.location.origin}/logo-main.png`;
    const logoFallback = `${window.location.origin}/favicon-faith-logo.png`;

    const itemsRowsHtml = (order.orderItems ?? [])
      .map((item) => {
        const details = [
          item.selectedSize ? `Size: ${item.selectedSize}` : "",
          item.selectedColor ? `Color: ${item.selectedColor}` : ""
        ]
          .filter(Boolean)
          .join(" • ");

        return `
          <tr>
            <td>
              <div class="product-name">${escapeHtml(item.productName)}</div>
              ${details ? `<div class="product-meta">${escapeHtml(details)}</div>` : ""}
            </td>
            <td class="qty-cell">${escapeHtml(String(item.quantity))}</td>
            <td class="price-cell">${escapeHtml(formatTZS(item.lineSubtotal))}</td>
          </tr>
        `;
      })
      .join("");

    const paymentsHtml = (order.payments ?? [])
      .map(
        (payment) => `
          <tr>
            <td>${escapeHtml(String(payment.method).toUpperCase())}</td>
            <td>${escapeHtml(payment.status)}</td>
            <td>${escapeHtml(new Date(payment.createdAt).toLocaleString())}</td>
            <td class="price-cell">${escapeHtml(formatTZS(payment.amount))}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>Invoice ${escapeHtml(order.id)}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 18px;
              background: #f1f1f1;
              color: #111111;
              font-family: Arial, Helvetica, sans-serif;
            }
            .sheet {
              max-width: 960px;
              margin: 0 auto;
              background: #ffffff;
              padding: 28px 34px 34px;
            }
            .top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 24px;
            }
            .brand-logo {
              width: 360px;
              max-width: 100%;
              height: auto;
              display: block;
            }
            .company-block {
              width: 320px;
              font-size: 16px;
              line-height: 1.4;
            }
            .company-name {
              margin: 0;
              font-size: 28px;
              font-weight: 800;
            }
            .company-block p {
              margin: 2px 0;
            }
            .title {
              margin: 26px 0 18px;
              font-size: 44px;
              letter-spacing: 0.6px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1.25fr;
              gap: 20px;
              margin-bottom: 18px;
            }
            .meta-grid h3 {
              margin: 0 0 6px;
              font-size: 22px;
            }
            .meta-grid p {
              margin: 2px 0;
              font-size: 18px;
              line-height: 1.35;
            }
            .invoice-meta-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin: 3px 0;
              font-size: 18px;
              line-height: 1.35;
            }
            .invoice-meta-row strong {
              font-weight: 700;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            .items thead th {
              background: #000000;
              color: #ffffff;
              text-align: left;
              padding: 10px 12px;
              font-size: 18px;
            }
            .items tbody td {
              border-bottom: 1px solid #d9d9d9;
              padding: 10px 12px;
              font-size: 18px;
              vertical-align: top;
            }
            .product-name {
              font-weight: 600;
            }
            .product-meta {
              margin-top: 3px;
              color: #6b6b6b;
              font-size: 14px;
            }
            .qty-cell {
              width: 120px;
            }
            .price-cell {
              width: 190px;
              text-align: right;
              white-space: nowrap;
            }
            .summary-wrap {
              display: flex;
              justify-content: flex-end;
              margin-top: 12px;
            }
            .summary {
              width: 360px;
            }
            .summary td {
              border-bottom: 1px solid #cdcdcd;
              padding: 8px 0;
              font-size: 17px;
            }
            .summary td:last-child {
              text-align: right;
            }
            .summary .value-note {
              color: #5f5f5f;
              font-size: 12px;
              margin-top: 2px;
            }
            .summary tr.total td {
              border-top: 2px solid #111111;
              border-bottom: 2px solid #111111;
              font-size: 28px;
              font-weight: 800;
              padding: 10px 0;
            }
            .summary tr.balance td {
              font-weight: 700;
            }
            .bank-box {
              margin-top: 18px;
              border: 1px solid #f8b057;
              background: #fff4e6;
              padding: 12px;
            }
            .bank-box p {
              margin: 3px 0;
              font-size: 14px;
            }
            .payments {
              margin-top: 16px;
            }
            .payments h4 {
              margin: 0 0 6px;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .payments th,
            .payments td {
              border: 1px solid #e2e2e2;
              padding: 6px 8px;
              font-size: 12px;
              text-align: left;
            }
            .payments th:last-child,
            .payments td:last-child {
              text-align: right;
            }
            @page {
              size: A4;
              margin: 12mm;
            }
            @media print {
              body {
                padding: 0;
                background: #ffffff;
              }
              .sheet {
                padding: 0;
                max-width: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="top">
              <img
                class="brand-logo"
                src="${escapeHtml(logoPrimary)}"
                alt="Faith Online Shop"
                onerror="this.onerror=null;this.src='${escapeHtml(logoFallback)}';"
              />
              <div class="company-block">
                <p class="company-name">Faith Online Shop - Tanzania</p>
                <p>Corner Uhuru/Bibi Titi Moh'd Road, Near Police Post, Mnazi Mmoja</p>
                <p>Ilala, Dar es Salaam, Tanzania</p>
              </div>
            </div>

            <h1 class="title">INVOICE</h1>

            <div class="meta-grid">
              <div>
                <h3>From:</h3>
                <p>Faithshop Admin</p>
                <p>hello@faithshop.co.tz</p>
                <p>${escapeHtml(shopLocation)}</p>
                <p>${escapeHtml(phoneNumber)}</p>
              </div>
              <div>
                <h3>Ship To:</h3>
                <p>${escapeHtml(order.fullName)}</p>
                <p>${escapeHtml(order.phone)}</p>
                <p>${escapeHtml(order.address)}</p>
                <p>${escapeHtml(order.regionCity)}</p>
              </div>
              <div>
                <div class="invoice-meta-row"><span>Invoice Number:</span><strong>${escapeHtml(invoiceNumber)}</strong></div>
                <div class="invoice-meta-row"><span>Invoice Date:</span><strong>${escapeHtml(formatDate(invoiceDate))}</strong></div>
                <div class="invoice-meta-row"><span>Due Date:</span><strong>${escapeHtml(formatDate(dueDate))}</strong></div>
                <div class="invoice-meta-row"><span>Order Number:</span><strong>${escapeHtml(order.id)}</strong></div>
                <div class="invoice-meta-row"><span>Order Date:</span><strong>${escapeHtml(formatDate(invoiceDate))}</strong></div>
                <div class="invoice-meta-row"><span>Payment Method:</span><strong>${escapeHtml(paymentMethodLabel)}</strong></div>
                <div class="invoice-meta-row"><span>Payment Status:</span><strong>${escapeHtml(order.paymentStatus || "unpaid")}</strong></div>
              </div>
            </div>

            <table class="items">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th style="text-align:right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml || '<tr><td>-</td><td>0</td><td class="price-cell">TZS 0.00</td></tr>'}
              </tbody>
            </table>

            <div class="summary-wrap">
              <table class="summary">
                <tbody>
                  <tr>
                    <td>Subtotal</td>
                    <td>${escapeHtml(formatTZS(order.subtotal || 0))}</td>
                  </tr>
                  <tr>
                    <td>Shipping</td>
                    <td>
                      ${escapeHtml(formatTZS(order.shippingFee || 0))}
                      ${order.shippingLabel ? `<div class="value-note">${escapeHtml(order.shippingLabel)}</div>` : ""}
                    </td>
                  </tr>
                  ${
                    shippingAdjustment !== 0
                      ? `
                    <tr>
                      <td>Adjustment</td>
                      <td>${escapeHtml(formatTZS(shippingAdjustment))}</td>
                    </tr>
                  `
                      : ""
                  }
                  <tr class="total">
                    <td>Total</td>
                    <td>${escapeHtml(formatTZS(order.total || 0))}</td>
                  </tr>
                  <tr>
                    <td>Paid</td>
                    <td>${escapeHtml(formatTZS(paidAmount))}</td>
                  </tr>
                  <tr class="balance">
                    <td>Balance</td>
                    <td>${escapeHtml(formatTZS(balanceDue))}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            ${
              order.paymentMethod === "bank-deposit"
                ? `
              <div class="bank-box">
                <p><strong>Bank Deposit Details</strong></p>
                <p><strong>Bank:</strong> ${escapeHtml(bankDetails.bankName)}</p>
                <p><strong>Account Name:</strong> ${escapeHtml(bankDetails.accountName)}</p>
                <p><strong>A/C Number:</strong> ${escapeHtml(bankDetails.accountNumber)}</p>
              </div>
            `
                : ""
            }

            ${
              paymentsHtml
                ? `
              <div class="payments">
                <h4>Payment History</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${paymentsHtml}
                  </tbody>
                </table>
              </div>
            `
                : ""
            }
          </div>
          <script>
            window.onload = () => {
              window.focus();
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
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
        <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-bold uppercase text-[var(--muted)]">Outstanding Balance</p>
          <p className="mt-1 text-2xl font-black text-red-600">{formatTZS(stats.outstanding)}</p>
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
                  Subtotal/Shipping: {formatTZS(order.subtotal || 0)} / {formatTZS(order.shippingFee || 0)}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Size/Color: {order.selectedSize || "-"} / {order.selectedColor || "-"}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Payment: {order.paymentMethod || "cash-on-delivery"} • {order.paymentStatus || "unpaid"}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Paid/Balance: {formatTZS(getOrderAmountPaid(order))} / {formatTZS(getOrderBalance(order))}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Shipping adj: {formatTZS(Number(order.shippingAdjustment || 0))}
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
                <Button type="button" variant="outline" className="mt-2 w-full" onClick={() => void recordOrderPayment(order)}>
                  Record Payment
                </Button>
                <Button type="button" variant="outline" className="mt-2 w-full" onClick={() => void adjustFreight(order)}>
                  Adjust Freight
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
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Paid: {formatTZS(getOrderAmountPaid(order))}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        Balance: {formatTZS(getOrderBalance(order))}
                      </p>
                    </td>
                    <td className="py-3">
                      <p className="font-bold text-[var(--primary)]">{formatTZS(order.total)}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {formatTZS(order.subtotal || 0)} + {formatTZS(order.shippingFee || 0)} + {formatTZS(Number(order.shippingAdjustment || 0))}
                      </p>
                    </td>
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
                      <Button type="button" variant="outline" onClick={() => printOrder(order)} className="mb-2 w-full">
                        <Printer className="mr-2 h-4 w-4" /> Print
                      </Button>
                      <Button type="button" variant="outline" onClick={() => void recordOrderPayment(order)} className="mb-2 w-full">
                        Record Payment
                      </Button>
                      <Button type="button" variant="outline" onClick={() => void adjustFreight(order)} className="w-full">
                        Adjust Freight
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
              <Input
                placeholder="Sub category (e.g smart-watch, skincare, shoes)"
                value={productForm.subCategory}
                onChange={(event) => setProductForm((prev) => ({ ...prev, subCategory: event.target.value }))}
              />

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
                <div className="mt-2 overflow-hidden rounded-xl border border-[var(--border)] bg-white">
                  <div className="relative aspect-square bg-[var(--surface)]">
                    {imagePreviewFailed ? (
                      <div className="flex h-full items-center justify-center px-4 text-center text-xs text-[var(--muted)]">
                        Preview imeshindikana. Angalia kama URL ni sahihi na ina ruhusa ya kuonekana public.
                      </div>
                    ) : (
                      <Image
                        src={imagePreviewSrc}
                        alt="Cover preview"
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 360px"
                        className="object-cover"
                        onError={() => setImagePreviewFailed(true)}
                      />
                    )}
                  </div>
                  <p className="truncate border-t border-[var(--border)] px-3 py-2 text-[11px] text-[var(--muted)]">{imagePreviewSrc}</p>
                </div>
              </div>
              <Input
                placeholder="Gallery URLs (comma or new line separated)"
                value={productForm.gallery}
                onChange={(event) => {
                  const nextGallery = event.target.value;
                  setProductForm((prev) => {
                    const nextImage = toImageList(nextGallery)
                      .map((item) => toImageSource(item))
                      .find((item) => !isPlaceholderImage(item));

                    if (!nextImage || !isPlaceholderImage(prev.image)) {
                      return { ...prev, gallery: nextGallery };
                    }

                    return {
                      ...prev,
                      gallery: nextGallery,
                      image: nextImage
                    };
                  });
                }}
              />
              <textarea
                placeholder="Quantity Offers (one line: Title|Paid Units|Free Units|Subtitle|Badge)"
                value={productForm.quantityOptions}
                onChange={(event) => setProductForm((prev) => ({ ...prev, quantityOptions: event.target.value }))}
                className="min-h-24 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm"
              />
              <p className="-mt-2 text-xs text-[var(--muted)]">
                Mfano: Buy 2 Get 1 Free|2|1|MOST POPULAR|MOST POPULAR
              </p>
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
                      {product.category}
                      {(product.subCategory ?? product.sub_category) ? ` / ${String(product.subCategory ?? product.sub_category)}` : ""}
                      {" • "}
                      {inStock ? "in-stock" : "out-of-stock"} • {product.brand ?? "Faith Select"} • {product.sku ?? "-"}
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
