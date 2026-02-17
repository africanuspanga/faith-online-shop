"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, LoaderCircle, Shield, Truck, Wallet } from "lucide-react";
import type { PaymentMethod, Product } from "@/lib/types";
import { formatTZS } from "@/lib/format";
import { darDeliveryFeeRange, upcountryFlatShippingFee } from "@/lib/shipping-fees";
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
  const [selectedSize, setSelectedSize] = useState(product.sizeOptions[0] ?? "");
  const [selectedColor, setSelectedColor] = useState(product.colorOptions[0] ?? "");
  const [selectedPackage, setSelectedPackage] = useState<PackageOption["id"]>("buy-2");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash-on-delivery");
  const [installmentEnabled, setInstallmentEnabled] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [installmentNotes, setInstallmentNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => packageOptions.find((item) => item.id === selectedPackage) ?? packageOptions[1],
    [selectedPackage]
  );

  const quantity = selected.paidUnits + selected.freeUnits;
  const totalPrice = selected.paidUnits * product.salePrice;
  const originalTotal = quantity * product.originalPrice;
  const parsedDeposit = Number(depositAmount || 0);
  const validDeposit = parsedDeposit > 0 && parsedDeposit < totalPrice;

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!customerName || !phone || !regionCity || !address) {
      toast.error("Tafadhali jaza taarifa zote muhimu.");
      return;
    }

    if (product.sizeOptions.length && !selectedSize) {
      toast.error("Tafadhali chagua size.");
      return;
    }

    if (product.colorOptions.length && !selectedColor) {
      toast.error("Tafadhali chagua color.");
      return;
    }

    if (installmentEnabled && !validDeposit) {
      toast.error("Weka kiasi cha awali kilicho chini ya jumla ya oda.");
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
          address,
          selectedSize,
          selectedColor,
          paymentMethod,
          installmentEnabled,
          depositAmount: installmentEnabled ? parsedDeposit : 0,
          installmentNotes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Order failed");
      }

      if (data.status === "payment_required" && data.paymentUrl) {
        toast.success("Unaelekezwa Pesapal kukamilisha malipo.");
        window.location.href = data.paymentUrl as string;
        return;
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

      {(product.sizeOptions.length || product.colorOptions.length) ? (
        <div className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-2">
          {product.sizeOptions.length ? (
            <div className="space-y-2">
              <label htmlFor="selected-size" className="text-sm font-semibold">
                Size
              </label>
              <select
                id="selected-size"
                value={selectedSize}
                onChange={(event) => setSelectedSize(event.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--border)] px-3"
              >
                {product.sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {product.colorOptions.length ? (
            <div className="space-y-2">
              <label htmlFor="selected-color" className="text-sm font-semibold">
                Color
              </label>
              <select
                id="selected-color"
                value={selectedColor}
                onChange={(event) => setSelectedColor(event.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--border)] px-3"
              >
                {product.colorOptions.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      ) : null}

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

      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <p className="text-sm font-bold">Mode of Payment</p>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-3 text-sm">
          <input
            type="radio"
            name="payment-method"
            checked={paymentMethod === "cash-on-delivery"}
            onChange={() => setPaymentMethod("cash-on-delivery")}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          <Wallet className="h-4 w-4 text-[var(--primary)]" />
          <span className="font-semibold">Cash on Delivery</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-3 text-sm">
          <input
            type="radio"
            name="payment-method"
            checked={paymentMethod === "pesapal"}
            onChange={() => setPaymentMethod("pesapal")}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          <CreditCard className="h-4 w-4 text-[var(--primary)]" />
          <span className="font-semibold">Pesapal Payment</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-3 text-sm">
          <input
            type="radio"
            name="payment-method"
            checked={paymentMethod === "bank-deposit"}
            onChange={() => setPaymentMethod("bank-deposit")}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          <Shield className="h-4 w-4 text-[var(--primary)]" />
          <span className="font-semibold">Bank Deposit</span>
        </label>
        {paymentMethod === "bank-deposit" ? (
          <p className="rounded-lg border border-[var(--border)] bg-white p-3 text-xs text-[var(--muted)]">
            Tutakupigia kukupa maelekezo ya akaunti ya benki na uthibitisho wa malipo baada ya ku-submit oda.
          </p>
        ) : null}
      </div>

      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={installmentEnabled}
            onChange={(event) => setInstallmentEnabled(event.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Lipia kidogo kidogo (installment)
        </label>
        {installmentEnabled ? (
          <div className="space-y-2">
            <Input
              type="number"
              min={1}
              max={Math.max(totalPrice - 1, 1)}
              placeholder={`Kiasi cha awali, mfano ${Math.floor(totalPrice * 0.3)}`}
              value={depositAmount}
              onChange={(event) => setDepositAmount(event.target.value)}
              required
            />
            <Textarea
              placeholder="Andika maelezo ya ratiba ya malipo (hiari)"
              value={installmentNotes}
              onChange={(event) => setInstallmentNotes(event.target.value)}
              rows={2}
            />
            <p className="text-xs text-[var(--muted)]">
              Salio litatakiwa kulipwa kabla ya kuchukua oda yako.
            </p>
          </div>
        ) : null}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
        {paymentMethod === "pesapal" ? "ENDELEA KWENYE PESAPAL" : "THIBITISHA ORDER"}
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
          <Truck className="h-4 w-4 text-[var(--accent)]" /> Gharama ya usafiri hutegemea eneo
        </p>
        <p className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
          <Shield className="h-4 w-4 text-[var(--accent)]" /> Malipo salama kwa njia 3
        </p>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Dar: {formatTZS(darDeliveryFeeRange.min)}-{formatTZS(darDeliveryFeeRange.max)} kulingana na area. Mikoani:
        {formatTZS(upcountryFlatShippingFee)} flat rate.
      </p>
      <p className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
        <Check className="h-4 w-4 text-[var(--accent)]" /> Tunakuthibitishia oda kwa simu kabla ya kutuma.
      </p>
    </form>
  );
};
