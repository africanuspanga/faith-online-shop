import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import { getCatalogProductById } from "@/lib/catalog";
import { memoryOrders } from "@/lib/memory-store";
import { createPesapalOrder } from "@/lib/pesapal";
import { getSupabaseServerClient } from "@/lib/supabase";
import type { OrderRecord, PaymentMethod, PaymentStatus } from "@/lib/types";

const allowedStatuses = new Set(["pending", "confirmed", "delivered", "cancelled"]);
const allowedPaymentMethods = new Set<PaymentMethod>(["cash-on-delivery", "pesapal", "bank-deposit"]);
const allowedPaymentStatuses = new Set<PaymentStatus>([
  "unpaid",
  "pending",
  "partial",
  "paid",
  "failed",
  "pending-verification"
]);

const determinePaymentStatus = (
  paymentMethod: PaymentMethod,
  installmentEnabled: boolean,
  depositAmount: number
): PaymentStatus => {
  if (paymentMethod === "pesapal") return "pending";
  if (paymentMethod === "bank-deposit") return installmentEnabled ? "partial" : "pending-verification";
  if (installmentEnabled && depositAmount > 0) return "partial";
  return "unpaid";
};

const toPaymentMethod = (value: unknown): PaymentMethod => {
  const normalized = String(value ?? "").trim() as PaymentMethod;
  if (allowedPaymentMethods.has(normalized)) {
    return normalized;
  }
  return "cash-on-delivery";
};

const isLegacyOrderSchemaError = (message: string) =>
  /column .* does not exist/i.test(message) || /product_id.*integer/i.test(message);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const productId = String(body.productId ?? "").trim();
    const product = productId ? await getCatalogProductById(productId) : undefined;

    const paidQuantity = Math.max(1, Number(body.paidQuantity ?? body.quantity ?? 1));
    const quantity = Math.max(1, Number(body.quantity ?? 1));
    const totalPrice = Number(body.totalPrice ?? (product ? product.salePrice * paidQuantity : 0));

    const fullName = String(body.fullName ?? body.customerName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const address = String(body.address ?? "").trim();
    const regionCity = String(body.regionCity ?? body.address ?? "").trim();
    const productName = String(body.productName ?? product?.name ?? "").trim();

    const selectedSizeRaw = String(body.selectedSize ?? "").trim();
    const selectedColorRaw = String(body.selectedColor ?? "").trim();
    const selectedSize = selectedSizeRaw || product?.sizeOptions[0] || "";
    const selectedColor = selectedColorRaw || product?.colorOptions[0] || "";

    const paymentMethod = toPaymentMethod(body.paymentMethod);
    const installmentEnabled = Boolean(body.installmentEnabled ?? false);
    const depositAmount = Math.max(0, Number(body.depositAmount ?? 0));
    const installmentNotes = String(body.installmentNotes ?? "").trim();

    if (!product || !fullName || !phone || !address || !productName || !regionCity) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    if (product.sizeOptions.length && !product.sizeOptions.includes(selectedSize)) {
      return NextResponse.json({ error: "Please select a valid size option." }, { status: 400 });
    }

    if (product.colorOptions.length && !product.colorOptions.includes(selectedColor)) {
      return NextResponse.json({ error: "Please select a valid color option." }, { status: 400 });
    }

    if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
      return NextResponse.json({ error: "Invalid order total." }, { status: 400 });
    }

    if (installmentEnabled && (depositAmount <= 0 || depositAmount >= totalPrice)) {
      return NextResponse.json(
        { error: "Installment requires a deposit greater than 0 and less than order total." },
        { status: 400 }
      );
    }

    const record: OrderRecord = {
      id: randomUUID(),
      productId,
      productName,
      quantity,
      fullName,
      phone,
      regionCity,
      address,
      selectedSize,
      selectedColor,
      paymentMethod,
      paymentStatus: determinePaymentStatus(paymentMethod, installmentEnabled, depositAmount),
      installmentEnabled,
      depositAmount: installmentEnabled ? depositAmount : 0,
      installmentNotes,
      createdAt: new Date().toISOString(),
      status: "pending",
      total: totalPrice
    };

    let paymentUrl: string | null = null;
    let paymentTrackingId = "";
    let paymentReference = "";

    if (paymentMethod === "pesapal") {
      try {
        const amountToCharge = installmentEnabled && depositAmount > 0 ? depositAmount : totalPrice;
        const callbackUrl = `${new URL(request.url).origin}/api/payments/pesapal/callback?order=${record.id}`;
        const pesapalPayment = await createPesapalOrder({
          orderId: record.id,
          amount: amountToCharge,
          description: `Order for ${productName}`,
          callbackUrl,
          customerName: fullName,
          customerPhone: phone
        });

        paymentUrl = pesapalPayment.redirectUrl;
        paymentTrackingId = pesapalPayment.trackingId;
        paymentReference = pesapalPayment.merchantReference;
        record.paymentStatus = pesapalPayment.paymentStatus;
        record.paymentTrackingId = paymentTrackingId;
        record.paymentReference = paymentReference;
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Unable to initiate Pesapal payment." },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabaseServerClient();

    if (supabase) {
      const payload = {
        id: record.id,
        product_id: record.productId,
        product_name: record.productName,
        quantity: record.quantity,
        full_name: record.fullName,
        phone: record.phone,
        region_city: record.regionCity,
        address: record.address,
        selected_size: record.selectedSize,
        selected_color: record.selectedColor,
        payment_method: record.paymentMethod,
        payment_status: record.paymentStatus,
        installment_enabled: record.installmentEnabled,
        deposit_amount: record.depositAmount,
        installment_notes: record.installmentNotes,
        payment_reference: paymentReference || null,
        payment_tracking_id: paymentTrackingId || null,
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
    } else {
      memoryOrders.unshift(record);
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
      "id, product_id, product_name, quantity, full_name, phone, region_city, address, selected_size, selected_color, payment_method, payment_status, installment_enabled, deposit_amount, installment_notes, payment_reference, payment_tracking_id, status, total, created_at";
    const legacySelect =
      "id, product_id, product_name, quantity, full_name, phone, region_city, address, status, total, created_at";

    let data: Record<string, unknown>[] | null = null;
    let error: { message: string } | null = null;

    const primary = await supabase.from("orders").select(primarySelect).order("created_at", { ascending: false });
    data = (primary.data as Record<string, unknown>[] | null) ?? null;
    error = primary.error;

    if (error && /column .* does not exist/i.test(error.message)) {
      const legacy = await supabase.from("orders").select(legacySelect).order("created_at", { ascending: false });
      data = (legacy.data as Record<string, unknown>[] | null) ?? null;
      error = legacy.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const normalized = (data ?? []).map((item) => {
      const paymentMethod = toPaymentMethod(item.payment_method);
      const installmentEnabled = Boolean(item.installment_enabled ?? false);
      const depositAmount = Number(item.deposit_amount ?? 0);

      return {
        id: String(item.id ?? ""),
        productId: String(item.product_id ?? ""),
        productName: String(item.product_name ?? ""),
        quantity: Number(item.quantity ?? 1),
        fullName: String(item.full_name ?? ""),
        phone: String(item.phone ?? ""),
        regionCity: String(item.region_city ?? ""),
        address: String(item.address ?? ""),
        selectedSize: String(item.selected_size ?? ""),
        selectedColor: String(item.selected_color ?? ""),
        paymentMethod,
        paymentStatus: allowedPaymentStatuses.has(item.payment_status as PaymentStatus)
          ? (item.payment_status as PaymentStatus)
          : determinePaymentStatus(paymentMethod, installmentEnabled, depositAmount),
        installmentEnabled,
        depositAmount,
        installmentNotes: String(item.installment_notes ?? ""),
        paymentReference: String(item.payment_reference ?? ""),
        paymentTrackingId: String(item.payment_tracking_id ?? ""),
        status: allowedStatuses.has(String(item.status ?? ""))
          ? String(item.status)
          : "pending",
        total: Number(item.total ?? 0),
        createdAt: String(item.created_at ?? new Date().toISOString())
      };
    });

    return NextResponse.json({ source: "supabase", orders: normalized });
  }

  return NextResponse.json({ source: "memory", orders: memoryOrders });
}

export async function PATCH(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const orderId = String(body.orderId ?? "").trim();
    const status = String(body.status ?? "").trim();
    const paymentStatusRaw = String(body.paymentStatus ?? "").trim() as PaymentStatus;
    const paymentStatus = allowedPaymentStatuses.has(paymentStatusRaw) ? paymentStatusRaw : null;

    if (!orderId || !allowedStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    if (supabase) {
      const updatePayload: Record<string, unknown> = { status };
      if (paymentStatus) {
        updatePayload.payment_status = paymentStatus;
      }

      const { data, error } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", orderId)
        .select("id, status, payment_status")
        .single();

      if (error && /column .* does not exist/i.test(error.message)) {
        const { data: legacyData, error: legacyError } = await supabase
          .from("orders")
          .update({ status })
          .eq("id", orderId)
          .select("id, status")
          .single();

        if (legacyError) {
          return NextResponse.json({ error: legacyError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, order: legacyData });
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, order: data });
    }

    const order = memoryOrders.find((item) => item.id === orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    order.status = status as OrderRecord["status"];
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    return NextResponse.json({
      success: true,
      order: { id: order.id, status: order.status, payment_status: order.paymentStatus }
    });
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}
