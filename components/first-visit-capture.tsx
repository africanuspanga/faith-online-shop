"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const signupStorageKey = "faith_signup_completed";
const signupDismissKey = "faith_signup_dismissed";
const visitSessionPrefix = "faith_visit_";

export const FirstVisitCapture = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "+255",
    email: ""
  });

  useEffect(() => {
    const visitKey = `${visitSessionPrefix}${pathname}`;
    if (!sessionStorage.getItem(visitKey)) {
      sessionStorage.setItem(visitKey, "1");
      void fetch("/api/visits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          path: pathname,
          referrer: document.referrer,
          userAgent: navigator.userAgent
        })
      });
    }
  }, [pathname]);

  useEffect(() => {
    const signed = localStorage.getItem(signupStorageKey);
    const dismissed = localStorage.getItem(signupDismissKey);
    if (!signed && !dismissed) {
      const timer = window.setTimeout(() => setOpen(true), 1200);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const close = (dismiss = true) => {
    setOpen(false);
    if (dismiss) {
      localStorage.setItem(signupDismissKey, "1");
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error("Jaza jina na namba ya simu.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/signups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          email: form.email
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Imeshindikana kuhifadhi taarifa.");
      }

      localStorage.setItem(signupStorageKey, "1");
      localStorage.removeItem(signupDismissKey);
      setOpen(false);
      toast.success("Asante, taarifa zako zimehifadhiwa.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Imeshindikana kuhifadhi taarifa.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/45 px-4 py-8">
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--primary)]">Faith Online Shop</p>
            <h2 className="mt-1 text-2xl font-black">Karibu. Jiandikishe Mara ya Kwanza</h2>
          </div>
          <button
            type="button"
            onClick={() => close(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)]"
            aria-label="Close signup prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-[var(--muted)]">
          Tunahifadhi kumbukumbu za wateja wapya ili kuboresha huduma na kufuatilia idadi ya wanaotembelea tovuti.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <Input
            placeholder="Jina kamili"
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            required
          />
          <Input
            placeholder="+2557XXXXXXXX"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            required
          />
          <Input
            type="email"
            placeholder="Email (hiari)"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              Hifadhi Taarifa
            </Button>
            <Button type="button" variant="outline" onClick={() => close(true)}>
              Baadaye
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
