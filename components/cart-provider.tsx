"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";

const cartStorageKey = "faith_cart_v2";

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  image: string;
  unitPrice: number;
  originalUnitPrice: number;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  sizeOptions: string[];
  colorOptions: string[];
}

interface CartContextValue {
  items: CartItem[];
  cartCount: number;
  subtotal: number;
  addToCart: (
    product: Product,
    quantity?: number,
    options?: {
      selectedSize?: string;
      selectedColor?: string;
    }
  ) => Promise<void>;
  removeFromCart: (itemId: string) => void;
  setItemQuantity: (itemId: string, quantity: number) => void;
  updateItemOptions: (itemId: string, options: { selectedSize?: string; selectedColor?: string }) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const roundMoney = (value: number) => Number(value.toFixed(2));

const buildItemId = (productId: string, selectedSize: string, selectedColor: string) =>
  `${productId}::${selectedSize || "-"}::${selectedColor || "-"}`;

const sanitizeQuantity = (value: number) => Math.max(1, Math.min(99, Math.floor(value || 1)));

const parseStoredItems = (value: string | null): CartItem[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        id: String(item.id ?? ""),
        productId: String(item.productId ?? ""),
        productName: String(item.productName ?? ""),
        image: String(item.image ?? "/placeholder.svg"),
        unitPrice: Number(item.unitPrice ?? 0),
        originalUnitPrice: Number(item.originalUnitPrice ?? item.unitPrice ?? 0),
        quantity: sanitizeQuantity(Number(item.quantity ?? 1)),
        selectedSize: String(item.selectedSize ?? ""),
        selectedColor: String(item.selectedColor ?? ""),
        sizeOptions: Array.isArray(item.sizeOptions)
          ? item.sizeOptions.map((entry: unknown) => String(entry).trim()).filter(Boolean)
          : [],
        colorOptions: Array.isArray(item.colorOptions)
          ? item.colorOptions.map((entry: unknown) => String(entry).trim()).filter(Boolean)
          : []
      }))
      .filter((item) => item.id && item.productId && item.productName && item.unitPrice > 0);
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    return parseStoredItems(window.localStorage.getItem(cartStorageKey));
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
  }, [items]);

  const addToCart: CartContextValue["addToCart"] = async (product, quantity = 1, options) => {
    const selectedSize = options?.selectedSize ?? product.sizeOptions[0] ?? "";
    const selectedColor = options?.selectedColor ?? product.colorOptions[0] ?? "";
    const safeQuantity = sanitizeQuantity(quantity);
    const itemId = buildItemId(product.id, selectedSize, selectedColor);

    setItems((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing) {
        return prev.map((item) =>
          item.id === itemId
            ? { ...item, quantity: sanitizeQuantity(item.quantity + safeQuantity) }
            : item
        );
      }

      return [
        ...prev,
        {
          id: itemId,
          productId: product.id,
          productName: product.name,
          image: product.image,
          unitPrice: product.salePrice,
          originalUnitPrice: product.originalPrice,
          quantity: safeQuantity,
          selectedSize,
          selectedColor,
          sizeOptions: product.sizeOptions,
          colorOptions: product.colorOptions
        }
      ];
    });

    toast.success(`${product.name} imeongezwa kwenye cart`);
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const setItemQuantity = (itemId: string, quantity: number) => {
    const safeQuantity = sanitizeQuantity(quantity);
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: safeQuantity } : item))
    );
  };

  const updateItemOptions = (itemId: string, options: { selectedSize?: string; selectedColor?: string }) => {
    setItems((prev) => {
      const current = prev.find((item) => item.id === itemId);
      if (!current) return prev;

      const selectedSize = options.selectedSize ?? current.selectedSize;
      const selectedColor = options.selectedColor ?? current.selectedColor;
      const nextId = buildItemId(current.productId, selectedSize, selectedColor);

      const withoutCurrent = prev.filter((item) => item.id !== itemId);
      const existingVariant = withoutCurrent.find((item) => item.id === nextId);

      if (existingVariant) {
        return withoutCurrent.map((item) =>
          item.id === nextId
            ? {
                ...item,
                quantity: sanitizeQuantity(item.quantity + current.quantity)
              }
            : item
        );
      }

      return [
        ...withoutCurrent,
        {
          ...current,
          id: nextId,
          selectedSize,
          selectedColor
        }
      ];
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const value = useMemo(
    () => ({
      items,
      cartCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: roundMoney(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)),
      addToCart,
      removeFromCart,
      setItemQuantity,
      updateItemOptions,
      clearCart
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
