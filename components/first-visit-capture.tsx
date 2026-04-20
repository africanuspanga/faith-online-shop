"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, Share2, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const installDismissKey = "faith_install_prompt_dismissed_at";
const installAcceptedKey = "faith_install_prompt_installed";
const visitSessionPrefix = "faith_visit_";
const promptDelayMs = 15000;
const dismissCooldownMs = 1000 * 60 * 60 * 24 * 7;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const isStandalone = () => {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
};

const isIosSafari = () => {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
  const isSafariBrowser = /safari/.test(userAgent) && !/crios|fxios|edgios|chrome/.test(userAgent);

  return isIosDevice && isSafariBrowser;
};

const isMobileViewport = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 820px)").matches;
};

export const FirstVisitCapture = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosSafari, setIosSafari] = useState(false);

  const primaryButtonLabel = useMemo(() => {
    if (deferredPrompt) return "Add to Home Screen";
    if (showInstructions) return "Got It";
    return "Show Quick Steps";
  }, [deferredPrompt, showInstructions]);

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
    setIosSafari(isIosSafari());

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // Ignore registration failures and continue with instruction-based install help.
      });
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      localStorage.setItem(installAcceptedKey, "1");
      setDeferredPrompt(null);
      setOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (!isMobileViewport()) return;

    if (isStandalone()) {
      localStorage.setItem(installAcceptedKey, "1");
      return;
    }

    if (localStorage.getItem(installAcceptedKey) === "1") return;

    const dismissedAt = Number(localStorage.getItem(installDismissKey) ?? 0);
    if (dismissedAt && Date.now() - dismissedAt < dismissCooldownMs) {
      return;
    }

    const timer = window.setTimeout(() => setOpen(true), promptDelayMs);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const close = () => {
    setOpen(false);
    setShowInstructions(false);
    localStorage.setItem(installDismissKey, String(Date.now()));
  };

  const onPrimaryAction = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice.catch(() => null);

      if (choice?.outcome === "accepted") {
        localStorage.setItem(installAcceptedKey, "1");
        setOpen(false);
      } else {
        localStorage.setItem(installDismissKey, String(Date.now()));
      }

      setDeferredPrompt(null);
      return;
    }

    if (showInstructions) {
      close();
      return;
    }

    setShowInstructions(true);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/40 px-4 py-6">
      <div className="mx-auto flex min-h-full max-w-md items-end sm:items-center">
        <div className="w-full rounded-lg border border-[var(--border)] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="space-y-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--secondary)]/35 text-[var(--foreground)]">
                <Smartphone className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-[var(--primary)]">Faith Online Shop</p>
                <h2 className="mt-1 text-2xl font-black leading-tight">Save this shop to your home screen</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)]"
              aria-label="Close install prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Keep Faith Online Shop one tap away for faster browsing, smoother checkout, and quick order tracking from your phone.
          </p>

          <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--foreground)]">
            <p className="font-semibold">Why it helps</p>
            <p className="mt-1 text-[var(--muted)]">It opens like an app and makes it much easier to come back when you want to shop again.</p>
          </div>

          {showInstructions ? (
            <div className="mt-4 rounded-lg border border-[var(--primary)]/25 bg-[var(--primary)]/6 p-3 text-sm leading-relaxed text-[var(--foreground)]">
              <p className="font-semibold">Quick steps</p>
              {iosSafari ? (
                <p className="mt-1">
                  Tap the <span className="font-semibold">Share</span> button in Safari, then choose <span className="font-semibold">Add to Home Screen</span>.
                </p>
              ) : (
                <p className="mt-1">
                  Open your browser menu and choose <span className="font-semibold">Install app</span> or <span className="font-semibold">Add to Home Screen</span>.
                </p>
              )}
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button type="button" onClick={() => void onPrimaryAction()} className="w-full">
              {deferredPrompt ? <Download className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
              {primaryButtonLabel}
            </Button>
            <Button type="button" variant="outline" onClick={close} className="w-full">
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
