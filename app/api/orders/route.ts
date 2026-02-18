import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import { getCatalogProductById, getCatalogProducts } from "@/lib/catalog";
import { isMissingColumnError } from "@/lib/db-errors";
import { computeAmountPaidFromPayments, computeBalanceDue, computeOrderTotal, derivePaymentStatus, normalizePhone, roundMoney } from "@/lib/order-finance";
import { memoryOrderPayments, memoryOrders } from "@/lib/memory-store";
import { createPesapalOrder } from "@/lib/pesapal";
import { calculateShippingFee } from "@/lib/shipping-fees";
import { sendOrderPlacedSmsNotification } from "@/lib/sms";
import { getSupabaseServerClient } from "@/lib/supabase";
import type {
  OrderLineItem,
  OrderPaymentMethod,
  OrderPaymentRecord,
  OrderRecord,
  PaymentMethod,
  PaymentStatus
} from "@/lib/types";

const allowedStatuses = new Set(["pending", "confirmed", "delivered", "cancelled"]);
const allowedPaymentMethods = new Set<PaymentMethod>(["cash-on-delivery", "pesapal", "bank-deposit"]);
const allowedPaymentRecordMethods = new Set<OrderPaymentMethod>([
  "cash-on-delivery",
  "pesapal",
  "bank-deposit",
  "manual"
]);
const allowedPaymentStatuses = new Set<PaymentStatus>([
  "unpaid",
  "pending",
  "partial",
  "paid",
  "failed",
  "pending-verification"
]);

const isMissingRelationError = (message: string) =>
  /relation .* does not exist/i.test(message) || /could not find .* relation/i.test(message);

const isLegacyOrderSchemaError = (message: string) =>
  isMissingColumnError(message) || /product_id.*integer/i.test(message);

const toString = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const toNumber = (value: unknown, fallback = 0) => {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return next;
};

const toPaymentMethod = (value: unknown): PaymentMethod => {
  const normalized = String(value ?? "").trim() as PaymentMethod;
  if (allowedPaymentMethods.has(normalized)) {
    return normalized;
  }
  return "cash-on-delivery";
};

const toPaymentRecordMethod = (value: unknown): OrderPaymentMethod => {
  const normalized = String(value ?? "").trim() as OrderPaymentMethod;
  if (allowedPaymentRecordMethods.has(normalized)) {
    return normalized;
  }
  return "manual";
};

const toPaymentStatus = (value: unknown): PaymentStatus | null => {
  const normalized = String(value ?? "").trim() as PaymentStatus;
  if (allowedPaymentStatuses.has(normalized)) {
    return normalized;
  }
  return null;
};

const toLineItemsFromStored = (
  raw: unknown,
  fallback: {
    productId: string;
    productName: string;
    quantity: number;
    selectedSize: string;
    selectedColor: string;
    subtotal: number;
  }
): OrderLineItem[] => {
  const fromArray = (value: unknown): OrderLineItem[] => {
    if (!Array.isArray(value)) return [];

    return value
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") return null;
        const source = entry as Record<string, unknown>;

        const quantity = Math.max(1, toNumber(source.quantity, 1));
        const paidQuantity = Math.max(1, toNumber(source.paidQuantity ?? source.paid_quantity, quantity));
        const freeQuantity = Math.max(0, toNumber(source.freeQuantity ?? source.free_quantity, Math.max(0, quantity - paidQuantity)));
        const lineSubtotal = roundMoney(toNumber(source.lineSubtotal ?? source.line_subtotal, paidQuantity));
        const unitPrice = roundMoney(toNumber(source.unitPrice ?? source.unit_price, lineSubtotal / Math.max(paidQuantity, 1)));
        const originalUnitPrice = roundMoney(toNumber(source.originalUnitPrice ?? source.original_unit_price, unitPrice));
        const lineOriginalTotal = roundMoney(
          toNumber(source.lineOriginalTotal ?? source.line_original_total, originalUnitPrice * quantity)
        );

        return {
          id: toString(source.id, `${toString(source.productId ?? source.product_id, fallback.productId)}-${index + 1}`),
          productId: toString(source.productId ?? source.product_id, fallback.productId),
          productName: toString(source.productName ?? source.product_name, fallback.productName),
          quantity,
          paidQuantity,
          freeQuantity,
          unitPrice,
          originalUnitPrice,
          lineSubtotal,
          lineOriginalTotal,
          selectedSize: toString(source.selectedSize ?? source.selected_size, fallback.selectedSize),
          selectedColor: toString(source.selectedColor ?? source.selected_color, fallback.selectedColor)
        };
      })
      .filter((item): item is OrderLineItem => Boolean(item && item.productId && item.productName));
  };

  const fromRaw = fromArray(raw);
  if (fromRaw.length) return fromRaw;

  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      const fromParsed = fromArray(parsed);
      if (fromParsed.length) return fromParsed;
    } catch {
      // ignore parse errors
    }
  }

  const quantity = Math.max(1, fallback.quantity);
  const lineSubtotal = roundMoney(fallback.subtotal > 0 ? fallback.subtotal : 0);
  const unitPrice = roundMoney(lineSubtotal / Math.max(quantity, 1));

  return [
    {
      id: `${fallback.productId || "legacy"}-1`,
      productId: fallback.productId,
      productName: fallback.productName,
      quantity,
      paidQuantity: quantity,
      freeQuantity: 0,
      unitPrice,
      originalUnitPrice: unitPrice,
      lineSubtotal,
      lineOriginalTotal: lineSubtotal,
      selectedSize: fallback.selectedSize,
      selectedColor: fallback.selectedColor
    }
  ];
};

const toPaymentRecord = (row: Record<string, unknown>): OrderPaymentRecord => {
  const status = toPaymentStatus(row.status) ?? "pending";

  return {
    id: toString(row.id, randomUUID()),
    orderId: toString(row.order_id ?? row.orderId),
    amount: roundMoney(toNumber(row.amount, 0)),
    method: toPaymentRecordMethod(row.method),
    status,
    reference: toString(row.reference),
    trackingId: toString(row.tracking_id ?? row.trackingId),
    notes: toString(row.notes),
    createdAt: toString(row.created_at ?? row.createdAt, new Date().toISOString()),
    paidAt: toString(row.paid_at ?? row.paidAt)
  };
};

const toOrderRecord = (
  row: Record<string, unknown>,
  payments: OrderPaymentRecord[]
): OrderRecord => {
  const paymentMethod = toPaymentMethod(row.payment_method ?? row.paymentMethod);
  const regionCity = toString(row.region_city ?? row.regionCity);
  const address = toString(row.address);
  const shipping = calculateShippingFee({ regionCity, address });

  const shippingFee = roundMoney(
    toNumber(row.shipping_fee ?? row.shippingFee, shipping.fee)
  );
  const shippingAdjustment = roundMoney(toNumber(row.shipping_adjustment ?? row.shippingAdjustment, 0));

  const fallbackSubtotal = Math.max(toNumber(row.total ?? row.total_price, 0) - shippingFee - shippingAdjustment, 0);
  const subtotal = roundMoney(toNumber(row.subtotal, fallbackSubtotal));
  const total = roundMoney(
    toNumber(row.total, computeOrderTotal(subtotal, shippingFee, shippingAdjustment))
  );

  const fallbackProductName = toString(row.product_name ?? row.productName, "Bidhaa");
  const fallbackProductId = toString(row.product_id ?? row.productId);
  const fallbackQuantity = Math.max(1, toNumber(row.quantity, 1));
  const fallbackSelectedSize = toString(row.selected_size ?? row.selectedSize);
  const fallbackSelectedColor = toString(row.selected_color ?? row.selectedColor);

  const orderItems = toLineItemsFromStored(row.order_items ?? row.orderItems, {
    productId: fallbackProductId,
    productName: fallbackProductName,
    quantity: fallbackQuantity,
    selectedSize: fallbackSelectedSize,
    selectedColor: fallbackSelectedColor,
    subtotal
  });

  const derivedQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const derivedProductName =
    orderItems.length > 1
      ? `${orderItems[0].productName} +${orderItems.length - 1} more`
      : orderItems[0]?.productName ?? fallbackProductName;
  const derivedProductId = orderItems.length > 1 ? "multi" : orderItems[0]?.productId ?? fallbackProductId;

  let amountPaid = roundMoney(toNumber(row.amount_paid ?? row.amountPaid, Number.NaN));
  if (!Number.isFinite(amountPaid)) {
    amountPaid = computeAmountPaidFromPayments(payments);
  }

  if (amountPaid <= 0 && !payments.length) {
    const rawStatus = toPaymentStatus(row.payment_status ?? row.paymentStatus);
    const depositAmount = roundMoney(toNumber(row.deposit_amount ?? row.depositAmount, 0));
    if (rawStatus === "partial") {
      amountPaid = Math.min(total, depositAmount);
    }
    if (rawStatus === "paid") {
      amountPaid = total;
    }
  }

  const persistedPaymentStatus = toPaymentStatus(row.payment_status ?? row.paymentStatus);
  let paymentStatus = persistedPaymentStatus;

  if (!paymentStatus) {
    paymentStatus = derivePaymentStatus({
      paymentMethod,
      total,
      amountPaid,
      paymentStatuses: payments.map((payment) => payment.status)
    });
  }

  if (paymentStatus === "paid") {
    amountPaid = total;
  }

  amountPaid = roundMoney(Math.min(Math.max(amountPaid, 0), total));

  return {
    id: toString(row.id),
    productId: derivedProductId,
    productName: derivedProductName,
    quantity: Math.max(1, derivedQuantity),
    orderItems,
    fullName: toString(row.full_name ?? row.fullName),
    phone: toString(row.phone),
    phoneNormalized: toString(row.phone_normalized ?? row.phoneNormalized, normalizePhone(toString(row.phone))),
    regionCity,
    address,
    selectedSize: orderItems[0]?.selectedSize ?? fallbackSelectedSize,
    selectedColor: orderItems[0]?.selectedColor ?? fallbackSelectedColor,
    paymentMethod,
    paymentStatus,
    installmentEnabled: Boolean(row.installment_enabled ?? row.installmentEnabled ?? false),
    depositAmount: roundMoney(toNumber(row.deposit_amount ?? row.depositAmount, 0)),
    installmentNotes: toString(row.installment_notes ?? row.installmentNotes),
    subtotal,
    shippingFee,
    shippingLabel: toString(
      row.shipping_label ?? row.shippingLabel,
      `${shipping.regionLabel} - ${shipping.matchedArea}`
    ),
    shippingAdjustment,
    shippingAdjustmentNote: toString(row.shipping_adjustment_note ?? row.shippingAdjustmentNote),
    amountPaid,
    paymentReference: toString(row.payment_reference ?? row.paymentReference),
    paymentTrackingId: toString(row.payment_tracking_id ?? row.paymentTrackingId),
    lastPaymentAt: toString(row.last_payment_at ?? row.lastPaymentAt),
    createdAt: toString(row.created_at ?? row.createdAt, new Date().toISOString()),
    status: allowedStatuses.has(toString(row.status))
      ? (toString(row.status) as OrderRecord["status"])
      : "pending",
    total,
    balanceDue: computeBalanceDue(total, amountPaid),
    payments
  };
};

const makePaymentRecord = ({
  orderId,
  amount,
  method,
  status,
  notes = "",
  reference = "",
  trackingId = ""
}: {
  orderId: string;
  amount: number;
  method: OrderPaymentMethod;
  status: PaymentStatus;
  notes?: string;
  reference?: string;
  trackingId?: string;
}): OrderPaymentRecord => {
  const timestamp = new Date().toISOString();
  return {
    id: randomUUID(),
    orderId,
    amount: roundMoney(amount),
    method,
    status,
    reference,
    trackingId,
    notes,
    createdAt: timestamp,
    paidAt: status === "paid" ? timestamp : ""
  };
};

const toPaymentInsertPayload = (payment: OrderPaymentRecord) => ({
  id: payment.id,
  order_id: payment.orderId,
  amount: payment.amount,
  method: payment.method,
  status: payment.status,
  reference: payment.reference || null,
  tracking_id: payment.trackingId || null,
  notes: payment.notes,
  paid_at: payment.paidAt || null,
  created_at: payment.createdAt
});

const parseIncomingItems = (raw: unknown) => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
    .filter((item): item is Record<string, unknown> => Boolean(item));
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const fullName = toString(body.fullName ?? body.customerName);
    const phone = toString(body.phone);
    const phoneNormalized = normalizePhone(phone);
    const address = toString(body.address);
    const regionCity = toString(body.regionCity ?? body.address);

    if (!fullName || !phone || !address || !regionCity) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    const paymentMethod = toPaymentMethod(body.paymentMethod);
    const installmentEnabled = Boolean(body.installmentEnabled ?? false);
    const installmentNotes = toString(body.installmentNotes);

    const incomingItems = parseIncomingItems(body.items);
    const catalog = await getCatalogProducts();
    const productMap = new Map(catalog.map((product) => [product.id, product]));

    const orderItems: OrderLineItem[] = [];

    if (incomingItems.length) {
      incomingItems.forEach((item, index) => {
        const productId = toString(item.productId);
        const product = productMap.get(productId);
        if (!product) {
          return;
        }

        const quantity = Math.max(1, toNumber(item.quantity, 1));
        const selectedSizeRaw = toString(item.selectedSize);
        const selectedColorRaw = toString(item.selectedColor);

        const selectedSize = selectedSizeRaw || product.sizeOptions[0] || "";
        const selectedColor = selectedColorRaw || product.colorOptions[0] || "";

        if (product.sizeOptions.length && !product.sizeOptions.includes(selectedSize)) {
          return;
        }

        if (product.colorOptions.length && !product.colorOptions.includes(selectedColor)) {
          return;
        }

        const lineSubtotal = roundMoney(product.salePrice * quantity);
        const lineOriginalTotal = roundMoney(product.originalPrice * quantity);

        orderItems.push({
          id: `${product.id}-${index + 1}`,
          productId: product.id,
          productName: product.name,
          quantity,
          paidQuantity: quantity,
          freeQuantity: 0,
          unitPrice: roundMoney(product.salePrice),
          originalUnitPrice: roundMoney(product.originalPrice),
          lineSubtotal,
          lineOriginalTotal,
          selectedSize,
          selectedColor
        });
      });
    } else {
      const productId = toString(body.productId);
      const product = productId ? await getCatalogProductById(productId) : undefined;
      if (!product) {
        return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
      }

      const paidQuantity = Math.max(1, toNumber(body.paidQuantity ?? body.quantity, 1));
      const quantity = Math.max(1, toNumber(body.quantity, paidQuantity));
      const freeQuantity = Math.max(0, toNumber(body.freeQuantity, Math.max(quantity - paidQuantity, 0)));

      const selectedSizeRaw = toString(body.selectedSize);
      const selectedColorRaw = toString(body.selectedColor);
      const selectedSize = selectedSizeRaw || product.sizeOptions[0] || "";
      const selectedColor = selectedColorRaw || product.colorOptions[0] || "";

      if (product.sizeOptions.length && !product.sizeOptions.includes(selectedSize)) {
        return NextResponse.json({ error: "Please select a valid size option." }, { status: 400 });
      }

      if (product.colorOptions.length && !product.colorOptions.includes(selectedColor)) {
        return NextResponse.json({ error: "Please select a valid color option." }, { status: 400 });
      }

      const lineSubtotal = roundMoney(product.salePrice * paidQuantity);
      const lineOriginalTotal = roundMoney(product.originalPrice * quantity);

      orderItems.push({
        id: `${product.id}-1`,
        productId: product.id,
        productName: product.name,
        quantity,
        paidQuantity,
        freeQuantity,
        unitPrice: roundMoney(product.salePrice),
        originalUnitPrice: roundMoney(product.originalPrice),
        lineSubtotal,
        lineOriginalTotal,
        selectedSize,
        selectedColor
      });
    }

    if (!orderItems.length) {
      return NextResponse.json({ error: "No valid order items submitted." }, { status: 400 });
    }

    const quantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = roundMoney(orderItems.reduce((sum, item) => sum + item.lineSubtotal, 0));

    const shipping = calculateShippingFee({ regionCity, address });
    const shippingFee = roundMoney(shipping.fee);
    const shippingLabel = `${shipping.regionLabel} - ${shipping.matchedArea}`;
    const shippingAdjustment = 0;
    const shippingAdjustmentNote = "";
    const total = computeOrderTotal(subtotal, shippingFee, shippingAdjustment);

    if (!Number.isFinite(total) || total <= 0) {
      return NextResponse.json({ error: "Invalid order total." }, { status: 400 });
    }

    const depositAmount = roundMoney(Math.max(0, toNumber(body.depositAmount, 0)));

    if (installmentEnabled && (depositAmount <= 0 || depositAmount >= total)) {
      return NextResponse.json(
        { error: "Installment requires a deposit greater than 0 and less than order total." },
        { status: 400 }
      );
    }

    const firstItem = orderItems[0];
    const productName = orderItems.length > 1 ? `${firstItem.productName} +${orderItems.length - 1} more` : firstItem.productName;
    const productId = orderItems.length > 1 ? "multi" : firstItem.productId;

    let paymentUrl: string | null = null;
    let paymentTrackingId = "";
    let paymentReference = "";
    let amountPaid = 0;
    const payments: OrderPaymentRecord[] = [];

    const recordId = randomUUID();

    if (paymentMethod === "pesapal") {
      const amountToCharge = installmentEnabled && depositAmount > 0 ? depositAmount : total;
      if (amountToCharge <= 0) {
        return NextResponse.json({ error: "Invalid amount to charge." }, { status: 400 });
      }

      const paymentRecord = makePaymentRecord({
        orderId: recordId,
        amount: amountToCharge,
        method: "pesapal",
        status: "pending",
        notes: installmentEnabled ? "Initial installment payment" : "Full order payment"
      });

      try {
        const callbackUrl = `${new URL(request.url).origin}/api/payments/pesapal/callback?order=${recordId}&payment=${paymentRecord.id}`;
        const pesapalPayment = await createPesapalOrder({
          orderId: paymentRecord.id,
          amount: amountToCharge,
          description: `Order for ${productName}`,
          callbackUrl,
          customerName: fullName,
          customerPhone: phone
        });

        paymentUrl = pesapalPayment.redirectUrl;
        paymentTrackingId = pesapalPayment.trackingId;
        paymentReference = pesapalPayment.merchantReference;

        paymentRecord.reference = pesapalPayment.merchantReference;
        paymentRecord.trackingId = pesapalPayment.trackingId;
        payments.push(paymentRecord);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Unable to initiate Pesapal payment." },
          { status: 400 }
        );
      }
    } else if (installmentEnabled && depositAmount > 0) {
      const initialStatus: PaymentStatus = paymentMethod === "bank-deposit" ? "pending-verification" : "paid";
      const paymentRecord = makePaymentRecord({
        orderId: recordId,
        amount: depositAmount,
        method: paymentMethod,
        status: initialStatus,
        notes: "Initial installment payment"
      });
      payments.push(paymentRecord);

      if (initialStatus === "paid") {
        amountPaid = paymentRecord.amount;
      }
    }

    const paymentStatus = derivePaymentStatus({
      paymentMethod,
      total,
      amountPaid,
      paymentStatuses: payments.map((payment) => payment.status)
    });

    const record: OrderRecord = {
      id: recordId,
      productId,
      productName,
      quantity,
      orderItems,
      fullName,
      phone,
      phoneNormalized,
      regionCity,
      address,
      selectedSize: firstItem.selectedSize,
      selectedColor: firstItem.selectedColor,
      paymentMethod,
      paymentStatus,
      installmentEnabled,
      depositAmount,
      installmentNotes,
      subtotal,
      shippingFee,
      shippingLabel,
      shippingAdjustment,
      shippingAdjustmentNote,
      amountPaid,
      paymentReference,
      paymentTrackingId,
      createdAt: new Date().toISOString(),
      lastPaymentAt: payments.find((payment) => payment.status === "paid")?.createdAt || "",
      status: "pending",
      total,
      balanceDue: computeBalanceDue(total, amountPaid),
      payments
    };

    const supabase = getSupabaseServerClient();

    if (supabase) {
      const payload = {
        id: record.id,
        product_id: record.productId,
        product_name: record.productName,
        quantity: record.quantity,
        order_items: record.orderItems,
        full_name: record.fullName,
        phone: record.phone,
        phone_normalized: record.phoneNormalized,
        region_city: record.regionCity,
        address: record.address,
        selected_size: record.selectedSize,
        selected_color: record.selectedColor,
        payment_method: record.paymentMethod,
        payment_status: record.paymentStatus,
        installment_enabled: record.installmentEnabled,
        deposit_amount: record.depositAmount,
        installment_notes: record.installmentNotes,
        subtotal: record.subtotal,
        shipping_fee: record.shippingFee,
        shipping_label: record.shippingLabel,
        shipping_adjustment: record.shippingAdjustment,
        shipping_adjustment_note: record.shippingAdjustmentNote,
        amount_paid: record.amountPaid,
        payment_reference: paymentReference || null,
        payment_tracking_id: paymentTrackingId || null,
        last_payment_at: record.lastPaymentAt || null,
        status: record.status,
        total: record.total,
        created_at: record.createdAt
      };

      const { error } = await supabase.from("orders").insert(payload);

      if (error && isLegacyOrderSchemaError(error.message)) {
        const numericProductId = Number(record.productId);
        const legacyPayload = {
          id: record.id,
          product_id: Number.isFinite(numericProductId) ? numericProductId : record.productId,
          product_name: record.productName,
          quantity: record.quantity,
          full_name: record.fullName,
          phone: record.phone,
          region_city: record.regionCity,
          address: record.address,
          status: record.status,
          total: record.total,
          created_at: record.createdAt
        };

        const { error: legacyError } = await supabase.from("orders").insert(legacyPayload);
        if (legacyError) {
          return NextResponse.json({ error: legacyError.message }, { status: 500 });
        }
      } else if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (payments.length) {
        const paymentPayload = payments.map((payment) => toPaymentInsertPayload(payment));
        const { error: paymentError } = await supabase.from("order_payments").insert(paymentPayload);
        if (paymentError) {
          if (isMissingRelationError(paymentError.message) || isMissingColumnError(paymentError.message)) {
            return NextResponse.json(
              {
                error:
                  "Database schema missing order_payments support. Tafadhali run SQL migration mpya kisha jaribu tena."
              },
              { status: 500 }
            );
          }
          return NextResponse.json({ error: paymentError.message }, { status: 500 });
        }
      }
    } else {
      memoryOrders.unshift(record);
      if (payments.length) {
        memoryOrderPayments.unshift(...payments);
      }
    }

    try {
      await sendOrderPlacedSmsNotification(record);
    } catch (error) {
      console.error("Order SMS notification failed", {
        orderId: record.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }

    if (paymentUrl) {
      return NextResponse.json(
        {
          id: record.id,
          status: "payment_required",
          paymentMethod: record.paymentMethod,
          paymentUrl,
          paymentTrackingId
        },
        { status: 201 }
      );
    }

    return NextResponse.json({ id: record.id, status: "ok", paymentMethod: record.paymentMethod }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();

  if (supabase) {
    const primarySelect =
      "id, product_id, product_name, quantity, order_items, full_name, phone, phone_normalized, region_city, address, selected_size, selected_color, payment_method, payment_status, installment_enabled, deposit_amount, installment_notes, subtotal, shipping_fee, shipping_label, shipping_adjustment, shipping_adjustment_note, amount_paid, payment_reference, payment_tracking_id, last_payment_at, status, total, created_at";
    const legacySelect =
      "id, product_id, product_name, quantity, full_name, phone, region_city, address, status, total, created_at";

    let data: Record<string, unknown>[] | null = null;
    let error: { message: string } | null = null;

    const primary = await supabase.from("orders").select(primarySelect).order("created_at", { ascending: false });
    data = (primary.data as Record<string, unknown>[] | null) ?? null;
    error = primary.error;

    if (error && isMissingColumnError(error.message)) {
      const legacy = await supabase.from("orders").select(legacySelect).order("created_at", { ascending: false });
      data = (legacy.data as Record<string, unknown>[] | null) ?? null;
      error = legacy.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const orderIds = (data ?? []).map((row) => toString(row.id)).filter(Boolean);

    let paymentRows: OrderPaymentRecord[] = [];
    if (orderIds.length) {
      const paymentsQuery = await supabase
        .from("order_payments")
        .select("id, order_id, amount, method, status, reference, tracking_id, notes, paid_at, created_at")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false });

      if (!paymentsQuery.error) {
        paymentRows = (paymentsQuery.data ?? []).map((row) => toPaymentRecord(row as Record<string, unknown>));
      } else if (!isMissingRelationError(paymentsQuery.error.message) && !isMissingColumnError(paymentsQuery.error.message)) {
        return NextResponse.json({ error: paymentsQuery.error.message }, { status: 500 });
      }
    }

    const paymentsByOrder = paymentRows.reduce<Map<string, OrderPaymentRecord[]>>((map, payment) => {
      if (!payment.orderId) return map;
      const existing = map.get(payment.orderId) ?? [];
      existing.push(payment);
      map.set(payment.orderId, existing);
      return map;
    }, new Map());

    const normalized = (data ?? []).map((item) =>
      toOrderRecord(item, paymentsByOrder.get(toString(item.id)) ?? [])
    );

    return NextResponse.json({ source: "supabase", orders: normalized });
  }

  const normalizedMemoryOrders = memoryOrders.map((order) => {
    const payments = memoryOrderPayments
      .filter((payment) => payment.orderId === order.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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
  });

  return NextResponse.json({ source: "memory", orders: normalizedMemoryOrders });
}

export async function PATCH(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const orderId = toString(body.orderId);

    const statusRaw = toString(body.status);
    const hasStatus = Boolean(statusRaw);
    const status = allowedStatuses.has(statusRaw) ? statusRaw : null;

    const paymentStatusRaw = toPaymentStatus(body.paymentStatus);

    const shippingAdjustmentProvided = body.shippingAdjustment !== undefined;
    const shippingAdjustment = roundMoney(toNumber(body.shippingAdjustment, 0));
    const shippingAdjustmentNote = toString(body.shippingAdjustmentNote);

    const paymentAmount = roundMoney(Math.max(0, toNumber(body.paymentAmount, 0)));
    const hasPaymentAmount = paymentAmount > 0;
    const paymentNote = toString(body.paymentNote);
    const paymentRecordMethod = toPaymentRecordMethod(body.paymentMethod);

    if (!orderId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (hasStatus && !status) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (!hasStatus && !paymentStatusRaw && !shippingAdjustmentProvided && !hasPaymentAmount) {
      return NextResponse.json({ error: "No update payload provided." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    if (supabase) {
      const existingOrderQuery = await supabase
        .from("orders")
        .select("id, status, payment_method, payment_status, subtotal, shipping_fee, shipping_adjustment, amount_paid, total")
        .eq("id", orderId)
        .single();

      if (existingOrderQuery.error && isMissingColumnError(existingOrderQuery.error.message)) {
        if (!status) {
          return NextResponse.json(
            { error: "Legacy schema supports status update only. Run latest SQL migration." },
            { status: 400 }
          );
        }

        const legacyUpdatePayload: Record<string, unknown> = { status };
        if (paymentStatusRaw) {
          legacyUpdatePayload.payment_status = paymentStatusRaw;
        }

        const legacyUpdate = await supabase
          .from("orders")
          .update(legacyUpdatePayload)
          .eq("id", orderId)
          .select("id, status, payment_status")
          .single();

        if (legacyUpdate.error) {
          return NextResponse.json({ error: legacyUpdate.error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, order: legacyUpdate.data });
      }

      if (existingOrderQuery.error || !existingOrderQuery.data) {
        return NextResponse.json({ error: existingOrderQuery.error?.message ?? "Order not found" }, { status: 404 });
      }

      const existing = existingOrderQuery.data as Record<string, unknown>;
      const paymentMethod = toPaymentMethod(existing.payment_method);
      const subtotal = roundMoney(toNumber(existing.subtotal, 0));
      const shippingFee = roundMoney(toNumber(existing.shipping_fee, 0));
      const currentShippingAdjustment = roundMoney(toNumber(existing.shipping_adjustment, 0));
      const nextShippingAdjustment = shippingAdjustmentProvided ? shippingAdjustment : currentShippingAdjustment;
      const total = computeOrderTotal(subtotal, shippingFee, nextShippingAdjustment);

      let amountPaid = roundMoney(toNumber(existing.amount_paid, 0));

      const updatePayload: Record<string, unknown> = {};

      if (hasStatus && status) {
        updatePayload.status = status;
      }

      if (shippingAdjustmentProvided) {
        updatePayload.shipping_adjustment = nextShippingAdjustment;
        updatePayload.shipping_adjustment_note = shippingAdjustmentNote;
        updatePayload.total = total;
      }

      const paymentStatuses: PaymentStatus[] = [];

      if (hasPaymentAmount) {
        const payment = makePaymentRecord({
          orderId,
          amount: paymentAmount,
          method: paymentRecordMethod,
          status: "paid",
          notes: paymentNote || "Recorded by admin"
        });

        const insertPayment = await supabase.from("order_payments").insert(toPaymentInsertPayload(payment));
        if (insertPayment.error) {
          if (isMissingRelationError(insertPayment.error.message) || isMissingColumnError(insertPayment.error.message)) {
            return NextResponse.json(
              {
                error:
                  "Database schema missing order_payments support. Tafadhali run SQL migration mpya kisha jaribu tena."
              },
              { status: 500 }
            );
          }
          return NextResponse.json({ error: insertPayment.error.message }, { status: 500 });
        }

        amountPaid = roundMoney(amountPaid + paymentAmount);
        paymentStatuses.push("paid");
        updatePayload.last_payment_at = payment.createdAt;
      }

      if (paymentStatusRaw) {
        updatePayload.payment_status = paymentStatusRaw;
      }

      if (paymentStatusRaw === "paid") {
        amountPaid = total;
      }

      amountPaid = roundMoney(Math.min(Math.max(amountPaid, 0), total));

      if (hasPaymentAmount || paymentStatusRaw || shippingAdjustmentProvided) {
        if (!paymentStatusRaw) {
          updatePayload.payment_status = derivePaymentStatus({
            paymentMethod,
            total,
            amountPaid,
            paymentStatuses
          });
        }

        updatePayload.amount_paid = amountPaid;
        updatePayload.total = total;
      }

      if (!Object.keys(updatePayload).length) {
        return NextResponse.json({ error: "No valid update fields." }, { status: 400 });
      }

      const updateResult = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", orderId)
        .select("id, status, payment_status, total, amount_paid, shipping_adjustment")
        .single();

      if (updateResult.error) {
        return NextResponse.json({ error: updateResult.error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, order: updateResult.data });
    }

    const order = memoryOrders.find((item) => item.id === orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (hasStatus && status) {
      order.status = status as OrderRecord["status"];
    }

    if (shippingAdjustmentProvided) {
      order.shippingAdjustment = shippingAdjustment;
      order.shippingAdjustmentNote = shippingAdjustmentNote;
      order.total = computeOrderTotal(order.subtotal, order.shippingFee, order.shippingAdjustment);
    }

    if (hasPaymentAmount) {
      const payment = makePaymentRecord({
        orderId,
        amount: paymentAmount,
        method: paymentRecordMethod,
        status: "paid",
        notes: paymentNote || "Recorded by admin"
      });
      memoryOrderPayments.unshift(payment);
      order.lastPaymentAt = payment.createdAt;
    }

    const payments = memoryOrderPayments.filter((payment) => payment.orderId === orderId);
    const amountPaid = computeAmountPaidFromPayments(payments);

    if (paymentStatusRaw) {
      order.paymentStatus = paymentStatusRaw;
      if (paymentStatusRaw === "paid") {
        order.amountPaid = order.total;
      } else {
        order.amountPaid = amountPaid;
      }
    } else {
      order.amountPaid = amountPaid;
      order.paymentStatus = derivePaymentStatus({
        paymentMethod: order.paymentMethod,
        total: order.total,
        amountPaid: order.amountPaid,
        paymentStatuses: payments.map((payment) => payment.status)
      });
    }

    order.balanceDue = computeBalanceDue(order.total, order.amountPaid);
    order.payments = payments;

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        payment_status: order.paymentStatus,
        amount_paid: order.amountPaid,
        total: order.total,
        shipping_adjustment: order.shippingAdjustment
      }
    });
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}
