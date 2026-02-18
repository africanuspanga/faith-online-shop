import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { isMissingColumnError } from "@/lib/db-errors";
import { computeBalanceDue, normalizePhone, roundMoney } from "@/lib/order-finance";
import { memoryOrderPayments, memoryOrders } from "@/lib/memory-store";
import { refreshOrderPaymentSummary } from "@/lib/order-payment-sync";
import { createPesapalOrder } from "@/lib/pesapal";
import { getSupabaseServerClient } from "@/lib/supabase";
import type { PaymentMethod, PaymentStatus } from "@/lib/types";

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
  if (normalized === "pesapal" || normalized === "bank-deposit" || normalized === "cash-on-delivery") {
    return normalized;
  }
  return "pesapal";
};

const toPaymentStatus = (method: PaymentMethod): PaymentStatus =>
  method === "bank-deposit" ? "pending-verification" : "pending";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const phone = toString(body.phone);
    const normalizedPhone = normalizePhone(phone);
    const amount = roundMoney(Math.max(0, toNumber(body.amount, 0)));
    const method = toPaymentMethod(body.method);
    const notes = toString(body.notes);

    if (!phone || normalizedPhone.length < 6) {
      return NextResponse.json({ error: "Weka namba ya simu uliotumia kuagiza." }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Weka kiasi sahihi cha malipo." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    if (supabase) {
      const orderQuery = await supabase
        .from("orders")
        .select("id, full_name, phone, phone_normalized, total, amount_paid")
        .eq("id", id)
        .single();

      if (orderQuery.error || !orderQuery.data) {
        return NextResponse.json({ error: "Order haijapatikana." }, { status: 404 });
      }

      const orderPhoneNormalized = normalizePhone(toString(orderQuery.data.phone_normalized || orderQuery.data.phone));
      if (orderPhoneNormalized !== normalizedPhone) {
        return NextResponse.json({ error: "Namba ya simu haifanani na order hii." }, { status: 403 });
      }

      const summary = await refreshOrderPaymentSummary(id);
      const total = summary?.total ?? roundMoney(toNumber(orderQuery.data.total, 0));
      const amountPaid = summary?.amountPaid ?? roundMoney(toNumber(orderQuery.data.amount_paid, 0));
      const balanceDue = computeBalanceDue(total, amountPaid);

      if (balanceDue <= 0) {
        return NextResponse.json({ error: "Order hii tayari imelipwa yote." }, { status: 400 });
      }

      if (amount > balanceDue) {
        return NextResponse.json(
          { error: `Kiasi kimezidi salio. Salio lililobaki ni ${balanceDue}.` },
          { status: 400 }
        );
      }

      const paymentId = randomUUID();
      const baseRecord = {
        id: paymentId,
        order_id: id,
        amount,
        method,
        status: toPaymentStatus(method),
        reference: null as string | null,
        tracking_id: null as string | null,
        notes: notes || "Installment payment",
        paid_at: null as string | null,
        created_at: new Date().toISOString()
      };

      if (method === "pesapal") {
        const callbackUrl = `${new URL(request.url).origin}/api/payments/pesapal/callback?order=${id}&payment=${paymentId}`;
        const pesapalPayment = await createPesapalOrder({
          orderId: paymentId,
          amount,
          description: `Installment payment for order ${id}`,
          callbackUrl,
          customerName: toString(orderQuery.data.full_name, "Customer"),
          customerPhone: phone
        });

        const insertResult = await supabase.from("order_payments").insert({
          ...baseRecord,
          status: "pending",
          reference: pesapalPayment.merchantReference,
          tracking_id: pesapalPayment.trackingId
        });

        if (insertResult.error) {
          if (isMissingRelationError(insertResult.error.message) || isMissingColumnError(insertResult.error.message)) {
            return NextResponse.json(
              {
                error:
                  "Database schema missing order_payments support. Tafadhali run SQL migration mpya kisha jaribu tena."
              },
              { status: 500 }
            );
          }
          return NextResponse.json({ error: insertResult.error.message }, { status: 500 });
        }

        await refreshOrderPaymentSummary(id);

        return NextResponse.json({
          status: "payment_required",
          paymentUrl: pesapalPayment.redirectUrl,
          paymentId,
          trackingId: pesapalPayment.trackingId
        });
      }

      const insertResult = await supabase.from("order_payments").insert(baseRecord);
      if (insertResult.error) {
        if (isMissingRelationError(insertResult.error.message) || isMissingColumnError(insertResult.error.message)) {
          return NextResponse.json(
            {
              error:
                "Database schema missing order_payments support. Tafadhali run SQL migration mpya kisha jaribu tena."
            },
            { status: 500 }
          );
        }
        return NextResponse.json({ error: insertResult.error.message }, { status: 500 });
      }

      const next = await refreshOrderPaymentSummary(id);

      return NextResponse.json({
        status: "recorded",
        message: "Payment imehifadhiwa ikiwa pending verification.",
        order: next
      });
    }

    const order = memoryOrders.find((item) => item.id === id);
    if (!order) {
      return NextResponse.json({ error: "Order haijapatikana." }, { status: 404 });
    }

    if (normalizePhone(order.phone) !== normalizedPhone) {
      return NextResponse.json({ error: "Namba ya simu haifanani na order hii." }, { status: 403 });
    }

    const summary = await refreshOrderPaymentSummary(id);
    const total = summary?.total ?? order.total;
    const amountPaid = summary?.amountPaid ?? order.amountPaid;
    const balanceDue = computeBalanceDue(total, amountPaid);

    if (balanceDue <= 0) {
      return NextResponse.json({ error: "Order hii tayari imelipwa yote." }, { status: 400 });
    }

    if (amount > balanceDue) {
      return NextResponse.json({ error: "Kiasi kimezidi salio lililobaki." }, { status: 400 });
    }

    const paymentId = randomUUID();
    const paymentStatus = toPaymentStatus(method);

    if (method === "pesapal") {
      const callbackUrl = `${new URL(request.url).origin}/api/payments/pesapal/callback?order=${id}&payment=${paymentId}`;
      const pesapalPayment = await createPesapalOrder({
        orderId: paymentId,
        amount,
        description: `Installment payment for order ${id}`,
        callbackUrl,
        customerName: order.fullName,
        customerPhone: phone
      });

      memoryOrderPayments.unshift({
        id: paymentId,
        orderId: id,
        amount,
        method,
        status: "pending",
        reference: pesapalPayment.merchantReference,
        trackingId: pesapalPayment.trackingId,
        notes: notes || "Installment payment",
        createdAt: new Date().toISOString(),
        paidAt: ""
      });

      await refreshOrderPaymentSummary(id);

      return NextResponse.json({
        status: "payment_required",
        paymentUrl: pesapalPayment.redirectUrl,
        paymentId,
        trackingId: pesapalPayment.trackingId
      });
    }

    memoryOrderPayments.unshift({
      id: paymentId,
      orderId: id,
      amount,
      method,
      status: paymentStatus,
      reference: "",
      trackingId: "",
      notes: notes || "Installment payment",
      createdAt: new Date().toISOString(),
      paidAt: ""
    });

    const next = await refreshOrderPaymentSummary(id);

    return NextResponse.json({
      status: "recorded",
      message: "Payment imehifadhiwa ikiwa pending verification.",
      order: next
    });
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}
