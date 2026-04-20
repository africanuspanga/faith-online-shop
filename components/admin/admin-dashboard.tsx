"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import useSWR from "swr";
import { Bell, LoaderCircle, LogOut, Package, Pencil, Printer, RefreshCcw, Trash2, X } from "lucide-react";
import { categories } from "@/lib/categories";
import { bankDetails, mpesaDetails, phoneNumber, shopLocation } from "@/lib/constants";
import { formatTZS } from "@/lib/format";
import { getPaymentMethodLabel } from "@/lib/payment-utils";
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
  out_of_stock?: boolean;
  outOfStock?: boolean;
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

type AdminCategory = {
  id?: string;
  slug?: string;
  label?: string;
  description?: string;
  image?: string;
  sub_categories?: string[] | string;
  subCategories?: string[] | string;
  created_at?: string;
};

const defaultCategoryChoices = categories.map((item) => item.slug);
const defaultCategoryForm = {
  label: "",
  slug: "",
  description: "",
  image: "/placeholder.svg",
  subCategories: ""
};

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
  outOfStock: false,
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

const toSlugArray = (value: string[] | string | undefined) => {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join("\n") : value;
  return [...new Set(raw.split(/\r?\n|,/).map((item) => normalizeCategorySlug(item)).filter(Boolean))];
};

const toImageSource = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "/placeholder.svg";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed) || trimmed.startsWith("/")) return trimmed;
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return `/${trimmed}`;
};
const getExternalImageWarning = (value: string) => {
  const source = toImageSource(value);
  if (!/^https?:\/\//i.test(source)) return "";

  try {
    const host = new URL(source).hostname.toLowerCase();
    if (host.includes("nidadanish.com")) {
      return "Links za nidadanish.com sasa zinarudisha 403 kwa hotlinking. Tumia upload hapa chini au host picha kwenye storage yako kwanza.";
    }
  } catch {
    return "";
  }

  return "External image links zinaweza kukataliwa na source site. Ikiwa preview inagoma, upload picha hapa chini badala ya ku-hotlink.";
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
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);
  const [categoryChoices, setCategoryChoices] = useState<string[]>(defaultCategoryChoices);
  const [categoryForm, setCategoryForm] = useState(defaultCategoryForm);
  const [productForm, setProductForm] = useState(defaultProductForm);
  const [productSearch, setProductSearch] = useState("");
  const imagePreviewSrc = useMemo(() => toImageSource(productForm.image), [productForm.image]);
  const imageSourceWarning = useMemo(() => getExternalImageWarning(productForm.image), [productForm.image]);

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

  const { data: categoriesData, mutate: refreshCategories, isLoading: loadingCategories, error: categoriesError } = useSWR<{
    source: string;
    categories: AdminCategory[];
  }, Error>(adminPassword ? ["/api/admin/categories", adminPassword] : null, fetcher, {
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
  const managedCategories = useMemo(() => categoriesData?.categories ?? [], [categoriesData]);

  const categoryLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((item) => map.set(item.slug, item.label));
    managedCategories.forEach((item) => {
      const slug = normalizeCategorySlug(String(item.slug ?? ""));
      if (!slug) return;
      const label = String(item.label ?? "").trim();
      map.set(slug, label || categoryLabel(slug));
    });
    return map;
  }, [managedCategories]);

  const subCategoryChoicesByCategory = useMemo(() => {
    const map = new Map<string, string[]>();

    managedCategories.forEach((item) => {
      const slug = normalizeCategorySlug(String(item.slug ?? ""));
      if (!slug) return;
      const current = map.get(slug) ?? [];
      map.set(slug, [...new Set([...current, ...toSlugArray(item.subCategories ?? item.sub_categories)].filter(Boolean))].sort((a, b) => a.localeCompare(b)));
    });

    products.forEach((item) => {
      const category = normalizeCategorySlug(item.category);
      const subCategory = normalizeCategorySlug(String(item.subCategory ?? item.sub_category ?? ""));
      if (!category || !subCategory) return;
      const current = map.get(category) ?? [];
      map.set(category, [...new Set([...current, subCategory])].sort((a, b) => a.localeCompare(b)));
    });

    return map;
  }, [managedCategories, products]);

  const selectedCategorySlug = useMemo(
    () => normalizeCategorySlug(productForm.category) || defaultProductForm.category,
    [productForm.category]
  );

  const selectedCategorySubCategories = useMemo(
    () => subCategoryChoicesByCategory.get(selectedCategorySlug) ?? [],
    [selectedCategorySlug, subCategoryChoicesByCategory]
  );

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) =>
      [
        product.name,
        String(product.sku ?? ""),
        String(product.brand ?? ""),
        String(product.category ?? ""),
        String(product.subCategory ?? product.sub_category ?? "")
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [products, productSearch]);

  const previousOrderIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  useEffect(() => {
    const message = `${ordersError?.message ?? ""} ${productsError?.message ?? ""} ${categoriesError?.message ?? ""}`.toLowerCase();
    if (!message.includes("unauthorized")) return;
    window.localStorage.removeItem(ADMIN_STORAGE_KEY);
    router.replace("/admin/login");
  }, [ordersError, productsError, categoriesError, router]);

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
      managedCategories.forEach((item) => merged.add(normalizeCategorySlug(String(item.slug ?? ""))));
      products.forEach((item) => merged.add(normalizeCategorySlug(item.category)));
      const next = [...merged].filter(Boolean).sort((a, b) => a.localeCompare(b));
      const prevSorted = [...prev].sort((a, b) => a.localeCompare(b));
      return next.join("|") === prevSorted.join("|") ? prev : next;
    });
  }, [products, managedCategories]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pending = orders.filter((order) => order.status === "pending").length;
    const confirmed = orders.filter((order) => order.status === "confirmed").length;
    const delivered = orders.filter((order) => order.status === "delivered").length;
    const cancelled = orders.filter((order) => order.status === "cancelled").length;
    const totalProducts = products.length;
    const revenue = orders.reduce((sum, order) => sum + getOrderAmountPaid(order), 0);
    const outstanding = orders.reduce((sum, order) => sum + getOrderBalance(order), 0);

    return { totalOrders, pending, confirmed, delivered, cancelled, totalProducts, revenue, outstanding };
  }, [orders, products]);

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

  const saveMainCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedSlug = normalizeCategorySlug(categoryForm.slug || categoryForm.label);
    const normalizedLabel = categoryForm.label.trim() || categoryLabel(normalizedSlug);
    const normalizedSubCategories = toSlugArray(categoryForm.subCategories);

    if (!normalizedSlug || !normalizedLabel) {
      toast.error("Weka label au slug ya category.");
      return;
    }

    setSavingCategory(true);

    try {
      const response = await fetch("/api/admin/categories", {
        method: editingCategoryId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({
          id: editingCategoryId,
          label: normalizedLabel,
          slug: normalizedSlug,
          description: categoryForm.description,
          image: categoryForm.image,
          subCategories: normalizedSubCategories
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save category");
      }

      toast.success(editingCategoryId ? "Category updated" : "Category added");
      if (payload.warning) {
        toast.info(String(payload.warning));
      }
      setEditingCategoryId(null);
      setCategoryForm(defaultCategoryForm);
      setProductForm((prev) => ({ ...prev, category: normalizedSlug }));
      await refreshCategories();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save category";
      if (/supabase|relation .* does not exist|could not find .* relation/i.test(message)) {
        setCategoryChoices((prev) => (prev.includes(normalizedSlug) ? prev : [...prev, normalizedSlug].sort((a, b) => a.localeCompare(b))));
        setProductForm((prev) => ({ ...prev, category: normalizedSlug }));
        toast.info("Category imeongezwa kwa matumizi ya product form. Run latest DB schema ili ihifadhiwe rasmi upande wa categories.");
      } else {
        toast.error(message);
      }
    } finally {
      setSavingCategory(false);
    }
  };

  const editMainCategory = (category: AdminCategory) => {
    setEditingCategoryId(String(category.id ?? ""));
    setCategoryForm({
      label: String(category.label ?? ""),
      slug: String(category.slug ?? ""),
      description: String(category.description ?? ""),
      image: String(category.image ?? "/placeholder.svg"),
      subCategories: toStringList(category.subCategories ?? category.sub_categories)
    });
  };

  const cancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setCategoryForm(defaultCategoryForm);
  };

  const deleteMainCategory = async (id: string) => {
    const proceed = window.confirm("Delete this category? Products using it will keep their category slug.");
    if (!proceed) return;

    setDeletingCategoryId(id);
    try {
      const response = await fetch(`/api/admin/categories?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": adminPassword
        }
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to delete category");
      }

      toast.success("Category deleted");
      if (editingCategoryId === id) {
        cancelCategoryEdit();
      }
      await refreshCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete category");
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const syncManagedSubCategory = async (categorySlug: string, subCategorySlug: string) => {
    if (!subCategorySlug) return;

    const target = managedCategories.find((item) => normalizeCategorySlug(String(item.slug ?? "")) === categorySlug);
    if (!target?.id) return;

    const current = toSlugArray(target.subCategories ?? target.sub_categories);
    if (current.includes(subCategorySlug)) return;

    const response = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword
      },
      body: JSON.stringify({
        id: target.id,
        label: String(target.label ?? categoryLabel(categorySlug)),
        slug: categorySlug,
        description: String(target.description ?? ""),
        image: String(target.image ?? "/placeholder.svg"),
        subCategories: [...current, subCategorySlug]
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(String(payload.error ?? "Unable to sync sub category"));
    }
  };

  const saveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const normalizedCategory = normalizeCategorySlug(productForm.category);
    const normalizedSubCategory = normalizeCategorySlug(productForm.subCategory);

    try {
      if (!normalizedCategory) {
        throw new Error("Weka main category sahihi.");
      }

      setCategoryChoices((prev) =>
        prev.includes(normalizedCategory) ? prev : [...prev, normalizedCategory].sort((a, b) => a.localeCompare(b))
      );

      const response = await fetch("/api/admin/products", {
        method: editingProductId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({
          id: editingProductId,
          name: productForm.name,
          category: normalizedCategory,
          subCategory: normalizedSubCategory,
          sku: productForm.sku,
          brand: productForm.brand,
          originalPrice: Number(productForm.originalPrice),
          salePrice: Number(productForm.salePrice),
          image: productForm.image,
          rating: Number(productForm.rating),
          sold: Number(productForm.sold),
          sizeOptions: productForm.sizeOptions,
          colorOptions: productForm.colorOptions,
          inStock: !productForm.outOfStock,
          outOfStock: productForm.outOfStock,
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

      try {
        await syncManagedSubCategory(normalizedCategory, normalizedSubCategory);
      } catch (error) {
        console.warn("Failed to sync sub category registry", error);
      }

      setEditingProductId(null);
      setProductForm(defaultProductForm);
      setImageFile(null);
      await Promise.all([refreshProducts(), refreshCategories()]);
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
      outOfStock: !Boolean(product.inStock ?? product.in_stock ?? true),
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

    const paymentMethodLabel = getPaymentMethodLabel(order.paymentMethod);

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
            .payment-box {
              margin-top: 18px;
              border: 1px solid #f8b057;
              background: #fff4e6;
              padding: 12px;
            }
            .payment-box p {
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
              <div class="payment-box">
                <p><strong>Manual Payment Details</strong></p>
                <p><strong>M-Pesa Number:</strong> ${escapeHtml(mpesaDetails.phone)}</p>
                <p><strong>M-Pesa Name:</strong> ${escapeHtml(mpesaDetails.accountName)}</p>
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
    await Promise.all([refreshOrders(), refreshProducts(), refreshCategories(), refreshAnalytics()]);
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
          {(loadingOrders || loadingProducts || loadingCategories || loadingAnalytics) ? (
            <span className="ml-auto inline-flex items-center gap-2 text-xs text-[var(--muted)]">
              <LoaderCircle className="h-4 w-4 animate-spin" /> Syncing...
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
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
          <p className="text-xs font-bold uppercase text-[var(--muted)]">Cancelled</p>
          <p className="mt-1 text-2xl font-black text-red-600">{stats.cancelled}</p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-bold uppercase text-[var(--muted)]">Products Posted</p>
          <p className="mt-1 text-2xl font-black">{stats.totalProducts}</p>
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
                  Payment: {getPaymentMethodLabel(order.paymentMethod || "cash-on-delivery")} • {order.paymentStatus || "unpaid"}
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
                      <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                        {getPaymentMethodLabel(order.paymentMethod || "cash-on-delivery")}
                      </p>
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
              <h2 className="text-xl font-black">{editingCategoryId ? "Edit Main Category" : "Add Main Category"}</h2>
              {editingCategoryId ? (
                <Button type="button" variant="outline" onClick={cancelCategoryEdit}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
              ) : null}
            </div>

            <form onSubmit={saveMainCategory} className="mt-3 space-y-2">
              <Input
                placeholder="Category label (e.g Electronics)"
                value={categoryForm.label}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, label: event.target.value }))}
                required
              />
              <Input
                placeholder="Category slug (optional, e.g electronics)"
                value={categoryForm.slug}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, slug: event.target.value }))}
              />
              <Input
                placeholder="Category image URL"
                value={categoryForm.image}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, image: event.target.value }))}
              />
              <textarea
                placeholder="Category description"
                value={categoryForm.description}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))}
                className="min-h-20 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm"
              />
              <textarea
                placeholder="Sub categories (comma/new line separated)"
                value={categoryForm.subCategories}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, subCategories: event.target.value }))}
                className="min-h-20 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm"
              />
              <p className="text-xs text-[var(--muted)]">
                Andika subcategories za category hii. Ukisave product mpya, subcategory mpya itaongezwa hapa pia.
              </p>
              <Button type="submit" className="w-full" disabled={savingCategory}>
                {savingCategory ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingCategoryId ? "Update Category" : "Save Category"}
              </Button>
            </form>

            <div className="mt-3 max-h-56 space-y-2 overflow-auto">
              {managedCategories.map((category) => {
                const categoryId = String(category.id ?? category.slug ?? "");
                const categorySlug = normalizeCategorySlug(String(category.slug ?? ""));
                const categoryName = String(category.label ?? "").trim() || categoryLabel(categorySlug);
                if (!categoryId) return null;

                return (
                  <article key={categoryId} className="rounded-xl border border-[var(--border)] p-3 text-sm">
                    <p className="font-semibold">{categoryName}</p>
                    <p className="text-xs text-[var(--muted)]">{categorySlug || "-"}</p>
                    <p className="line-clamp-2 text-xs text-[var(--muted)]">{String(category.description ?? "-")}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Sub categories: {toSlugArray(category.subCategories ?? category.sub_categories).join(", ") || "-"}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button type="button" variant="outline" onClick={() => editMainCategory(category)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void deleteMainCategory(categoryId)}
                        disabled={deletingCategoryId === categoryId}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        {deletingCategoryId === categoryId ? (
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
              {!managedCategories.length ? (
                <p className="text-xs text-[var(--muted)]">No custom categories yet. Add one above.</p>
              ) : null}
              {categoriesError ? (
                <p className="text-xs text-red-600">{categoriesError.message}</p>
              ) : null}
            </div>
          </div>

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

              <div className="space-y-2">
                <Input
                  list="main-category-options"
                  placeholder="Main category (select existing or type new)"
                  value={productForm.category}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value as CategorySlug }))}
                  required
                />
                <datalist id="main-category-options">
                  {categoryChoices.map((slug) => (
                    <option key={slug} value={slug}>
                      {categoryLabelMap.get(slug) ?? categoryLabel(slug)}
                    </option>
                  ))}
                </datalist>
                <p className="text-xs text-[var(--muted)]">
                  Category iliyochaguliwa: {categoryLabelMap.get(selectedCategorySlug) ?? categoryLabel(selectedCategorySlug)}.
                  Unaweza kuchagua iliyopo au kuandika mpya.
                </p>
              </div>
              <Input
                list={`sub-category-options-${selectedCategorySlug}`}
                placeholder="Sub category (select existing or type new)"
                value={productForm.subCategory}
                onChange={(event) => setProductForm((prev) => ({ ...prev, subCategory: event.target.value }))}
              />
              <datalist id={`sub-category-options-${selectedCategorySlug}`}>
                {selectedCategorySubCategories.map((subCategory) => (
                  <option key={subCategory} value={subCategory}>
                    {categoryLabel(subCategory)}
                  </option>
                ))}
              </datalist>
              <p className="-mt-1 text-xs text-[var(--muted)]">
                Subcategories za {categoryLabelMap.get(selectedCategorySlug) ?? categoryLabel(selectedCategorySlug)}:{" "}
                {selectedCategorySubCategories.map((item) => categoryLabel(item)).join(", ") || "hakuna bado"}
              </p>

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
                {imageSourceWarning ? (
                  <p className="mt-2 text-xs font-semibold text-amber-700">{imageSourceWarning}</p>
                ) : null}
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
                placeholder="Quantity Offers (one line: Title|Paid Units|Free Units|Discount %|Subtitle|Badge)"
                value={productForm.quantityOptions}
                onChange={(event) => setProductForm((prev) => ({ ...prev, quantityOptions: event.target.value }))}
                className="min-h-24 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm"
              />
              <p className="-mt-2 text-xs text-[var(--muted)]">
                Mfano: Buy 2 Get 10% Discount|2|0|10|10% OFF EACH ITEM|MOST POPULAR
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={productForm.inStock}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        inStock: event.target.checked,
                        outOfStock: !event.target.checked
                      }))
                    }
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  In Stock
                </label>
                <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={productForm.outOfStock}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        outOfStock: event.target.checked,
                        inStock: !event.target.checked
                      }))
                    }
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  Out of Stock
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Products Posted</h2>
                <p className="text-xs text-[var(--muted)]">
                  Showing {filteredProducts.length} of {products.length} products
                </p>
              </div>
              <div className="w-full sm:w-72">
                <Input
                  placeholder="Search by product name, SKU, brand..."
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                />
              </div>
            </div>
            <div className="mt-3 max-h-[36rem] space-y-2 overflow-auto">
              {filteredProducts.map((product, index) => {
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
              {!filteredProducts.length ? (
                <p className="text-sm text-[var(--muted)]">No products match that search.</p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
