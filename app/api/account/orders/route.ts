import { NextResponse } from "next/server";
import { isMissingColumnError } from "@/lib/db-errors";
import { computeAmountPaidFromPayments, computeBalanceDue, derivePaymentStatus, normalizePhone, roundMoney } from "@/lib/order-finance";
import { memoryOrderPayments, memoryOrders } from "@/lib/memory-store";
import { getSupabaseServerClient } from "@/lib/supabase";
import type { OrderLineItem, OrderPaymentRecord, PaymentMethod, PaymentStatus } from "@/lib/types";

const isMissingRelationError = (message: string) =>
  /relation .* does not exist/i.test(message) || /could not find .* relation/i.test(message);

const toString = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const toNumber = (value: unknown, fallback = 0) => {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return next;
};

const toPaymentMethod = (value: unknown): PaymentMethod => {
  const normalized = toString(value);
  if (normalized === "cash-on-delivery" || normalized === "pesapal" || normalized === "bank-deposit") {
    return normalized;
  }
  return "cash-on-delivery";
};

const toPaymentStatus = (value: unknown): PaymentStatus | null => {
  const normalized = toString(value);
  if (
    normalized === "unpaid" ||
    normalized === "pending" ||
    normalized === "partial" ||
    normalized === "paid" ||
    normalized === "failed" ||
    normalized === "pending-verification"
  ) {
    return normalized;
  }
  return null;
};

const toOrderItems = (row: Record<string, unknown>) => {
  const fromRaw = row.order_items ?? row.orderItems;

  const parseItems = (value: unknown): OrderLineItem[] => {
    if (!Array.isArray(value)) return [];

    return value
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") return null;
        const item = entry as Record<string, unknown>;
        const quantity = Math.max(1, toNumber(item.quantity, 1));
        const lineSubtotal = roundMoney(toNumber(item.lineSubtotal ?? item.line_subtotal, 0));

        return {
          id: toString(item.id, `${toString(item.productId ?? item.product_id, "item")}-${index + 1}`),
          productId: toString(item.productId ?? item.product_id),
          productName: toString(item.productName ?? item.product_name),
          quantity,
          paidQuantity: Math.max(1, toNumber(item.paidQuantity ?? item.paid_quantity, quantity)),
          freeQuantity: Math.max(0, toNumber(item.freeQuantity ?? item.free_quantity, 0)),
          unitPrice: roundMoney(toNumber(item.unitPrice ?? item.unit_price, quantity ? lineSubtotal / quantity : 0)),
          originalUnitPrice: roundMoney(toNumber(item.originalUnitPrice ?? item.original_unit_price, 0)),
          lineSubtotal,
          lineOriginalTotal: roundMoney(toNumber(item.lineOriginalTotal ?? item.line_original_total, lineSubtotal)),
          selectedSize: toString(item.selectedSize ?? item.selected_size),
          selectedColor: toString(item.selectedColor ?? item.selected_color)
        };
      })
      .filter((item): item is OrderLineItem => Boolean(item && item.productId && item.productName));
  };

  const parsed = parseItems(fromRaw);
  if (parsed.length) return parsed;

  if (typeof fromRaw === "string") {
    try {
      const fromParsed = parseItems(JSON.parse(fromRaw));
      if (fromParsed.length) return fromParsed;
    } catch {
      // ignore parse errors
    }
  }

  const productId = toString(row.product_id ?? row.productId);
  const productName = toString(row.product_name ?? row.productName, "Bidhaa");
  const quantity = Math.max(1, toNumber(row.quantity, 1));
  const subtotal = roundMoney(toNumber(row.subtotal, toNumber(row.total, 0)));

  return [
    {
      id: `${productId || "item"}-1`,
      productId,
      productName,
      quantity,
      paidQuantity: quantity,
      freeQuantity: 0,
      unitPrice: roundMoney(subtotal / quantity),
      originalUnitPrice: roundMoney(subtotal / quantity),
      lineSubtotal: subtotal,
      lineOriginalTotal: subtotal,
      selectedSize: toString(row.selected_size ?? row.selectedSize),
      selectedColor: toString(row.selected_color ?? row.selectedColor)
    }
  ];
};

const toPaymentRecord = (row: Record<string, unknown>): OrderPaymentRecord => ({
  id: toString(row.id),
  orderId: toString(row.order_id ?? row.orderId),
  amount: roundMoney(toNumber(row.amount, 0)),
  method: ["cash-on-delivery", "pesapal", "bank-deposit", "manual"].includes(toString(row.method))
    ? (toString(row.method) as OrderPaymentRecord["method"])
    : "manual",
  status: toPaymentStatus(row.status) ?? "pending",
  reference: toString(row.reference),
  trackingId: toString(row.tracking_id ?? row.trackingId),
  notes: toString(row.notes),
  createdAt: toString(row.created_at ?? row.createdAt, new Date().toISOString()),
  paidAt: toString(row.paid_at ?? row.paidAt)
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const phone = toString(url.searchParams.get("phone"));
  const normalizedPhone = normalizePhone(phone);
  const orderId = toString(url.searchParams.get("order"));

  if (!phone || normalizedPhone.length < 6) {
    return NextResponse.json({ error: "Weka namba ya simu uliotumia kuagiza." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  if (supabase) {
    const selectClause =
      "id, product_id, product_name, quantity, order_items, full_name, phone, phone_normalized, region_city, address, selected_size, selected_color, payment_method, payment_status, installment_enabled, deposit_amount, installment_notes, subtotal, shipping_fee, shipping_label, shipping_adjustment, shipping_adjustment_note, amount_paid, payment_reference, payment_tracking_id, last_payment_at, status, total, created_at";

    let ordersQuery = supabase
      .from("orders")
      .select(selectClause)
      .eq("phone_normalized", normalizedPhone)
      .order("created_at", { ascending: false });

    if (orderId) {
      ordersQuery = ordersQuery.eq("id", orderId);
    }

    const primaryResult = await ordersQuery;
    let ordersResult: { data: Record<string, unknown>[] | null; error: { message: string } | null } = {
      data: (primaryResult.data as Record<string, unknown>[] | null) ?? null,
      error: primaryResult.error
    };

    if (ordersResult.error && isMissingColumnError(ordersResult.error.message)) {
      let legacyQuery = supabase
        .from("orders")
        .select("id, product_id, product_name, quantity, full_name, phone, region_city, address, payment_method, payment_status, subtotal, shipping_fee, total, status, created_at")
        .ilike("phone", `%${normalizedPhone.slice(-9)}%`)
        .order("created_at", { ascending: false });

      if (orderId) {
        legacyQuery = legacyQuery.eq("id", orderId);
      }

      const legacyResult = await legacyQuery;
      ordersResult = {
        data: (legacyResult.data as Record<string, unknown>[] | null) ?? null,
        error: legacyResult.error
      };
    }

    if (ordersResult.error) {
      return NextResponse.json({ error: ordersResult.error.message }, { status: 500 });
    }

    const orderRows = (ordersResult.data ?? []) as Record<string, unknown>[];
    if (!orderRows.length) {
      return NextResponse.json({ orders: [] });
    }

    const orderIds = orderRows.map((row) => toString(row.id)).filter(Boolean);
    let paymentRows: OrderPaymentRecord[] = [];

    if (orderIds.length) {
      const paymentsResult = await supabase
        .from("order_payments")
        .select("id, order_id, amount, method, status, reference, tracking_id, notes, paid_at, created_at")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false });

      if (!paymentsResult.error) {
        paymentRows = (paymentsResult.data ?? []).map((row) => toPaymentRecord(row as Record<string, unknown>));
      } else if (!isMissingRelationError(paymentsResult.error.message) && !isMissingColumnError(paymentsResult.error.message)) {
        return NextResponse.json({ error: paymentsResult.error.message }, { status: 500 });
      }
    }

    const paymentsByOrder = paymentRows.reduce<Map<string, OrderPaymentRecord[]>>((map, payment) => {
      const existing = map.get(payment.orderId) ?? [];
      existing.push(payment);
      map.set(payment.orderId, existing);
      return map;
    }, new Map());

    const orders = orderRows.map((row) => {
      const id = toString(row.id);
      const paymentMethod = toPaymentMethod(row.payment_method ?? row.paymentMethod);
      const payments = paymentsByOrder.get(id) ?? [];
      const total = roundMoney(toNumber(row.total, 0));

      let amountPaid = roundMoney(toNumber(row.amount_paid, Number.NaN));
      if (!Number.isFinite(amountPaid)) {
        amountPaid = computeAmountPaidFromPayments(payments);
      }

      const persistedPaymentStatus = toPaymentStatus(row.payment_status);
      const paymentStatus =
        persistedPaymentStatus ??
        derivePaymentStatus({
          paymentMethod,
          total,
          amountPaid,
          paymentStatuses: payments.map((payment) => payment.status)
        });

      if (paymentStatus === "paid") {
        amountPaid = total;
      }

      const orderItems = toOrderItems(row);

      return {
        id,
        fullName: toString(row.full_name ?? row.fullName),
        phone: toString(row.phone),
        status: toString(row.status, "pending"),
        paymentMethod,
        paymentStatus,
        installmentEnabled: Boolean(row.installment_enabled ?? false),
        depositAmount: roundMoney(toNumber(row.deposit_amount, 0)),
        installmentNotes: toString(row.installment_notes),
        subtotal: roundMoney(toNumber(row.subtotal, Math.max(total - toNumber(row.shipping_fee, 0), 0))),
        shippingFee: roundMoney(toNumber(row.shipping_fee, 0)),
        shippingAdjustment: roundMoney(toNumber(row.shipping_adjustment, 0)),
        shippingAdjustmentNote: toString(row.shipping_adjustment_note),
        shippingLabel: toString(row.shipping_label),
        total,
        amountPaid,
        balanceDue: computeBalanceDue(total, amountPaid),
        orderItems,
        createdAt: toString(row.created_at, new Date().toISOString()),
        lastPaymentAt: toString(row.last_payment_at),
        payments
      };
    });

    return NextResponse.json({ orders });
  }

  const filteredOrders = memoryOrders
    .filter((order) => normalizePhone(order.phone) === normalizedPhone)
    .filter((order) => (orderId ? order.id === orderId : true))
    .map((order) => {
      const payments = memoryOrderPayments.filter((payment) => payment.orderId === order.id);
      const amountPaid = computeAmountPaidFromPayments(payments);
      const paymentStatus = derivePaymentStatus({
        paymentMethod: order.paymentMethod,
        total: order.total,
        amountPaid,
        paymentStatuses: payments.map((payment) => payment.status)
      });

      return {
        ...order,
        amountPaid,
        paymentStatus,
        balanceDue: computeBalanceDue(order.total, amountPaid),
        payments
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ orders: filteredOrders });
}
