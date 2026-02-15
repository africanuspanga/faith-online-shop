"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <>
      {children}
      <Toaster
        richColors
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: "12px"
          }
        }}
      />
    </>
  );
};
