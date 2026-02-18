"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { formatTZS } from "@/lib/format";
import { bankDetails, phoneNumber, whatsappLink } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type AccountPayment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  notes: string;
  createdAt: string;
};

type AccountOrderItem = {
  id: string;
  productName: string;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  lineSubtotal: number;
};

type AccountOrder = {
  id: string;
  fullName: string;
  phone: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  installmentEnabled: boolean;
  depositAmount: number;
  installmentNotes: string;
  subtotal: number;
  shippingFee: number;
  shippingAdjustment: number;
  shippingAdjustmentNote: string;
  shippingLabel: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  createdAt: string;
  lastPaymentAt?: string;
  orderItems: AccountOrderItem[];
  payments: AccountPayment[];
};

const phoneStorageKey = "faith_account_phone";

export const AccountOrders = () => {
  const [phone, setPhone] = useState("+255");
  const [orderRef, setOrderRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [searchDone, setSearchDone] = useState(false);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [paymentMethods, setPaymentMethods] = useState<Record<string, "pesapal" | "bank-deposit">>({});
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(phoneStorageKey);
    if (saved) {
      setPhone(saved);
    }
  }, []);

  const fetchOrders = async (nextPhone = phone, nextOrderRef = orderRef) => {
    if (!nextPhone.trim()) {
      toast.error("Weka namba ya simu kwanza.");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("phone", nextPhone.trim());
      if (nextOrderRef.trim()) {
        params.set("order", nextOrderRef.trim());
      }

      const response = await fetch(`/api/account/orders?${params.toString()}`, {
        cache: "no-store"
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Imeshindikana kupata oda.");
      }

      const fetchedOrders = (payload.orders ?? []) as AccountOrder[];
      setOrders(fetchedOrders);
      setSearchDone(true);
      localStorage.setItem(phoneStorageKey, nextPhone.trim());

      setPaymentAmounts((prev) => {
        const next = { ...prev };
        fetchedOrders.forEach((order) => {
          if (!next[order.id]) {
            next[order.id] = String(Math.max(1, Math.floor(order.balanceDue || 0)));
          }
        });
        return next;
      });
      setPaymentMethods((prev) => {
        const next = { ...prev };
        fetchedOrders.forEach((order) => {
          if (!next[order.id]) {
            next[order.id] = order.paymentMethod === "bank-deposit" ? "bank-deposit" : "pesapal";
          }
        });
        return next;
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Imeshindikana kupata oda.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetchOrders(phone, orderRef);
  };

  const onContinuePayment = async (order: AccountOrder) => {
    const amount = Number(paymentAmounts[order.id] ?? 0);
    const method =
      paymentMethods[order.id] ?? (order.paymentMethod === "bank-deposit" ? "bank-deposit" : "pesapal");

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Weka kiasi sahihi cha malipo.");
      return;
    }

    setPayingOrderId(order.id);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(order.id)}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone,
          amount,
          method,
          notes: "Customer installment payment"
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Imeshindikana kuanzisha malipo.");
      }

      if (payload.status === "payment_required" && payload.paymentUrl) {
        window.location.href = payload.paymentUrl as string;
        return;
      }

      toast.success(payload.message ?? "Malipo yamehifadhiwa.");
      await fetchOrders(phone, orderRef);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Imeshindikana kuanzisha malipo.");
    } finally {
      setPayingOrderId(null);
    }
  };

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders]
  );

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
        <h1 className="text-2xl font-black sm:text-3xl">Order Tracking & Account</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Weka namba ya simu uliyotumia kuagiza ili kuona order history, status, na installment balance.
        </p>

        <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+2557XXXXXXXX"
            required
          />
          <Input
            value={orderRef}
            onChange={(event) => setOrderRef(event.target.value)}
            placeholder="Order ID (hiari)"
          />
          <Button type="submit" disabled={loading}>
            {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Tafuta Oda
          </Button>
        </form>
      </div>

      {searchDone && sortedOrders.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm text-[var(--muted)]">
          Hakuna order iliyopatikana kwa taarifa hizi.
        </div>
      ) : null}

      {sortedOrders.map((order) => {
        const selectedPaymentMethod =
          paymentMethods[order.id] ?? (order.paymentMethod === "bank-deposit" ? "bank-deposit" : "pesapal");

        return (
          <article key={order.id} className="space-y-3 rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Order ID</p>
              <p className="text-base font-black">{order.id}</p>
              <p className="text-xs text-[var(--muted)]">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div className="text-right text-xs font-semibold">
              <p className="capitalize">Order Status: <span className="font-black">{order.status}</span></p>
              <p className="capitalize">Payment: <span className="font-black">{order.paymentStatus}</span></p>
            </div>
          </div>

          <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm sm:grid-cols-3">
            <p>Total: <span className="font-black text-[var(--primary)]">{formatTZS(order.total)}</span></p>
            <p>Paid: <span className="font-black text-green-700">{formatTZS(order.amountPaid)}</span></p>
            <p>Balance: <span className="font-black text-red-600">{formatTZS(order.balanceDue)}</span></p>
            <p>Subtotal: <span className="font-semibold">{formatTZS(order.subtotal)}</span></p>
            <p>Shipping: <span className="font-semibold">{formatTZS(order.shippingFee)}</span></p>
            <p>Adjustment: <span className="font-semibold">{formatTZS(order.shippingAdjustment)}</span></p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold">Bidhaa kwenye oda</p>
            {order.orderItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-[var(--border)] p-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{item.productName}</p>
                  <p className="font-bold">{formatTZS(item.lineSubtotal)}</p>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  Qty: {item.quantity} {item.selectedSize ? `• Size: ${item.selectedSize}` : ""} {item.selectedColor ? `• Color: ${item.selectedColor}` : ""}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold">Payment History</p>
            {order.payments.length ? (
              order.payments.map((payment) => (
                <div key={payment.id} className="rounded-lg border border-[var(--border)] p-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold uppercase">{payment.method}</p>
                    <p className="font-black">{formatTZS(payment.amount)}</p>
                  </div>
                  <p className="capitalize text-[var(--muted)]">Status: {payment.status}</p>
                  <p className="text-[var(--muted)]">{new Date(payment.createdAt).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--muted)]">Bado hakuna payment record.</p>
            )}
          </div>

          {order.balanceDue > 0 ? (
            <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-sm font-bold">Endelea Kulipa Installment</p>
              <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
                <Input
                  type="number"
                  min={1}
                  max={Math.max(order.balanceDue, 1)}
                  value={paymentAmounts[order.id] ?? ""}
                  onChange={(event) =>
                    setPaymentAmounts((prev) => ({ ...prev, [order.id]: event.target.value }))
                  }
                  placeholder={`Kiasi (max ${Math.floor(order.balanceDue)})`}
                />
                <select
                  value={selectedPaymentMethod}
                  onChange={(event) =>
                    setPaymentMethods((prev) => ({
                      ...prev,
                      [order.id]: event.target.value as "pesapal" | "bank-deposit"
                    }))
                  }
                  className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
                >
                  <option value="pesapal">Pesapal</option>
                  <option value="bank-deposit">Bank Deposit</option>
                </select>
                <Button
                  type="button"
                  onClick={() => void onContinuePayment(order)}
                  disabled={payingOrderId === order.id}
                >
                  {payingOrderId === order.id ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Lipa Sasa
                </Button>
              </div>
              {selectedPaymentMethod === "bank-deposit" ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <p className="font-bold">Bank Deposit Details</p>
                  <p className="mt-1"><span className="font-semibold">Bank:</span> {bankDetails.bankName}</p>
                  <p><span className="font-semibold">Account Name:</span> {bankDetails.accountName}</p>
                  <p><span className="font-semibold">A/C Number:</span> {bankDetails.accountNumber}</p>
                  <p className="mt-2">
                    Ukishafanya transfer/deposit, payment itaonekana `pending-verification` hadi ithibitishwe.
                  </p>
                  <p className="mt-1">
                    Tuma uthibitisho wa malipo kwa WhatsApp{" "}
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline"
                    >
                      {phoneNumber}
                    </a>
                    .
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)]">
                  Ukichagua Pesapal utaelekezwa moja kwa moja kulipa.
                </p>
              )}
            </div>
          ) : (
            <p className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--secondary)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
              Order hii imelipwa kikamilifu
            </p>
          )}
          </article>
        );
      })}
    </section>
  );
};
