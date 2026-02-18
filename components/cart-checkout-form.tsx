"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, LoaderCircle, Shield, Truck, Wallet } from "lucide-react";
import type { PaymentMethod } from "@/lib/types";
import { bankDetails } from "@/lib/constants";
import { formatTZS } from "@/lib/format";
import { calculateShippingFee, darDeliveryFeeRange, upcountryFlatShippingFee } from "@/lib/shipping-fees";
import { useCart } from "@/components/cart-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const CartCheckoutForm = () => {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("+255");
  const [regionCity, setRegionCity] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash-on-delivery");
  const [installmentEnabled, setInstallmentEnabled] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [installmentNotes, setInstallmentNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const shippingEstimate = useMemo(() => calculateShippingFee({ regionCity, address }), [regionCity, address]);
  const totalPrice = subtotal + shippingEstimate.fee;
  const parsedDeposit = Number(depositAmount || 0);
  const validDeposit = parsedDeposit > 0 && parsedDeposit < totalPrice;

  if (!items.length) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-white p-6 text-center sm:p-8">
        <h1 className="text-2xl font-black">Cart yako haina bidhaa</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Ongeza bidhaa kwanza kisha urudi hapa kwa checkout.</p>
        <Link href="/shop" className={`${buttonVariants()} mt-5`}>
          Nenda Shop
        </Link>
      </section>
    );
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!customerName || !phone || !regionCity || !address) {
      toast.error("Tafadhali jaza taarifa zote muhimu.");
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
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            paidQuantity: item.quantity,
            freeQuantity: 0,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor
          })),
          customerName,
          phone,
          regionCity,
          address,
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

      clearCart();

      if (data.status === "payment_required" && data.paymentUrl) {
        toast.success("Unaelekezwa Pesapal kukamilisha malipo.");
        window.location.href = data.paymentUrl as string;
        return;
      }

      toast.success("Order imepokelewa kikamilifu");
      router.push(`/thank-you?order=${encodeURIComponent(data.id)}&payment=${encodeURIComponent(paymentMethod)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kuna hitilafu, jaribu tena.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
        <h2 className="text-xl font-black">Bidhaa Ulizochagua</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold">{item.productName}</p>
                <p className="text-sm font-black text-[var(--primary)]">{formatTZS(item.unitPrice * item.quantity)}</p>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Qty: {item.quantity} {item.selectedSize ? `• Size: ${item.selectedSize}` : ""} {item.selectedColor ? `• Color: ${item.selectedColor}` : ""}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
        <h2 className="text-xl font-black">Taarifa za Uwasilishaji</h2>
        <div className="space-y-2">
          <label htmlFor="customerName" className="text-sm font-semibold">
            Jina Kamili
          </label>
          <Input id="customerName" value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
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
            Area / Anuani Kamili
          </label>
          <Textarea id="address" value={address} onChange={(event) => setAddress(event.target.value)} required />
        </div>
      </section>

      <section className="space-y-2 rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
        <h2 className="text-lg font-black">Order Summary</h2>
        <div className="flex items-center justify-between text-sm">
          <span>Subtotal</span>
          <span className="font-semibold">{formatTZS(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Shipping ({shippingEstimate.matchedArea})</span>
          <span className="font-semibold">{formatTZS(shippingEstimate.fee)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-2 text-sm">
          <span>Total bill</span>
          <span className="text-lg font-black text-[var(--primary)]">{formatTZS(totalPrice)}</span>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
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
          <div className="rounded-lg border border-[var(--border)] bg-white p-3 text-xs text-[var(--foreground)]">
            <p className="font-black text-[var(--primary)]">Bank Details</p>
            <p className="mt-1"><span className="font-semibold">Bank:</span> {bankDetails.bankName}</p>
            <p><span className="font-semibold">Account Name:</span> {bankDetails.accountName}</p>
            <p><span className="font-semibold">A/C Number:</span> {bankDetails.accountNumber}</p>
            <p className="mt-2 text-[var(--muted)]">Weka kumbukumbu ya transfer, tutathibitisha malipo ndani ya muda mfupi.</p>
          </div>
        ) : null}
      </section>

      <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
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
      </section>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
        {paymentMethod === "pesapal" ? "ENDELEA KWENYE PESAPAL" : "THIBITISHA ORDER"}
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
          <Truck className="h-4 w-4 text-[var(--accent)]" /> Shipping imehesabiwa kiotomatiki kwa eneo
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
