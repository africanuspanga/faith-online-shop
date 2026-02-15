"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Shield, Truck } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatTZS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type PackageOption = {
  id: "buy-1" | "buy-2" | "buy-3";
  title: string;
  subtitle: string;
  paidUnits: number;
  freeUnits: number;
  badge?: string;
};

const packageOptions: PackageOption[] = [
  {
    id: "buy-1",
    title: "Buy 1",
    subtitle: "50% OFF",
    paidUnits: 1,
    freeUnits: 0
  },
  {
    id: "buy-2",
    title: "Buy 2 Get 1 Free",
    subtitle: "MOST POPULAR",
    paidUnits: 2,
    freeUnits: 1,
    badge: "MOST POPULAR"
  },
  {
    id: "buy-3",
    title: "Buy 3 Get 2 Free",
    subtitle: "BEST VALUE",
    paidUnits: 3,
    freeUnits: 2,
    badge: "BEST VALUE"
  }
];

export const CheckoutOrderForm = ({ product }: { product: Product }) => {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("+255");
  const [regionCity, setRegionCity] = useState("");
  const [address, setAddress] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<PackageOption["id"]>("buy-2");
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => packageOptions.find((item) => item.id === selectedPackage) ?? packageOptions[1],
    [selectedPackage]
  );

  const quantity = selected.paidUnits + selected.freeUnits;
  const totalPrice = selected.paidUnits * product.salePrice;
  const originalTotal = quantity * product.originalPrice;

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!customerName || !phone || !regionCity || !address) {
      toast.error("Tafadhali jaza taarifa zote muhimu.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          quantity,
          paidQuantity: selected.paidUnits,
          freeQuantity: selected.freeUnits,
          totalPrice,
          customerName,
          phone,
          regionCity,
          address
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Order failed");
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success("Order imepokelewa kikamilifu");
      router.push(`/thank-you?order=${data.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kuna hitilafu, jaribu tena.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
      <h2 className="text-xl font-black">Taarifa za Uwasilishaji</h2>
      <div className="space-y-2">
        <label htmlFor="customerName" className="text-sm font-semibold">
          Jina Kamili
        </label>
        <Input
          id="customerName"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-semibold">
          Namba ya Simu
        </label>
        <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} required />
      </div>
      <div className="space-y-2">
        <label htmlFor="regionCity" className="text-sm font-semibold">
          Mkoa / Mji
        </label>
        <Input id="regionCity" value={regionCity} onChange={(event) => setRegionCity(event.target.value)} required />
      </div>
      <div className="space-y-2">
        <label htmlFor="address" className="text-sm font-semibold">
          Anuani Kamili
        </label>
        <Textarea id="address" value={address} onChange={(event) => setAddress(event.target.value)} required />
      </div>

      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <p className="text-sm font-bold">Quantity Options</p>
        <div className="space-y-2">
          {packageOptions.map((option) => {
            const optionQuantity = option.paidUnits + option.freeUnits;
            const optionPrice = option.paidUnits * product.salePrice;
            const optionOriginal = optionQuantity * product.originalPrice;
            const isActive = selectedPackage === option.id;

            return (
              <label
                key={option.id}
                htmlFor={option.id}
                className={`block cursor-pointer rounded-xl border p-3 transition ${
                  isActive ? "border-[var(--primary)] bg-white" : "border-[var(--border)] bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    id={option.id}
                    type="radio"
                    name="package"
                    checked={isActive}
                    onChange={() => setSelectedPackage(option.id)}
                    className="mt-1 h-4 w-4 accent-[var(--primary)]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold">{option.title}</p>
                      {option.badge ? (
                        <span className="rounded-full bg-[var(--secondary)] px-2 py-1 text-[10px] font-black text-[var(--foreground)]">
                          {option.badge}
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-black text-[var(--foreground)]">
                          {option.subtitle}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">You receive {optionQuantity} item(s)</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-base font-black text-[var(--primary)]">{formatTZS(optionPrice)}</p>
                      <p className="text-xs text-[var(--muted)] line-through">{formatTZS(optionOriginal)}</p>
                    </div>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white p-3">
        <div className="flex items-center justify-between text-sm">
          <span>Selected quantity</span>
          <span className="font-semibold">{quantity} item(s)</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span>Total price</span>
          <span className="text-lg font-black text-[var(--primary)]">{formatTZS(totalPrice)}</span>
        </div>
        <p className="mt-1 text-xs text-[var(--muted)] line-through">Original: {formatTZS(originalTotal)}</p>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
        THIBITISHA ORDER - Lipa Unapopokea
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
          <Truck className="h-4 w-4 text-[var(--accent)]" /> Usafirishaji Bure
        </p>
        <p className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
          <Shield className="h-4 w-4 text-[var(--accent)]" /> Lipa Unapopokea
        </p>
      </div>
      <p className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
        <Check className="h-4 w-4 text-[var(--accent)]" /> Tunakuthibitishia oda kwa simu kabla ya kutuma.
      </p>
    </form>
  );
};
