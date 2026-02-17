"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { FirstVisitCapture } from "@/components/first-visit-capture";

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <>
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
    </>
  );
};
