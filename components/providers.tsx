"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { CartProvider } from "@/components/cart-provider";
import { FirstVisitCapture } from "@/components/first-visit-capture";

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <CartProvider>
      {children}
      <FirstVisitCapture />
      <Toaster
        richColors
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: "12px"
          }
        }}
      />
    </CartProvider>
  );
};
