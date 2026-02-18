import { NextResponse } from "next/server";
import { isMissingColumnError } from "@/lib/db-errors";
import { memoryOrderPayments } from "@/lib/memory-store";
import { refreshOrderPaymentSummary } from "@/lib/order-payment-sync";
import { getPesapalTransactionStatus } from "@/lib/pesapal";
import { getSupabaseServerClient } from "@/lib/supabase";

const isMissingRelationError = (message: string) =>
  /relation .* does not exist/i.test(message) || /could not find .* relation/i.test(message);

const pick = (url: URL, keys: string[]) => {
  for (const key of keys) {
    const value = url.searchParams.get(key)?.trim();
    if (value) return value;
  }
  return "";
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const trackingId = pick(url, ["OrderTrackingId", "orderTrackingId", "trackingId"]);
  const merchantReference = pick(url, ["OrderMerchantReference", "merchantReference", "id"]);
  const orderId = pick(url, ["order", "orderId", "OrderId"]);
  const paymentId = pick(url, ["payment", "paymentId", "PaymentId"]);

  if (!trackingId) {
    return NextResponse.json({ received: false, message: "Missing tracking id" }, { status: 400 });
  }

  try {
    const transaction = await getPesapalTransactionStatus(trackingId);
    const paymentStatus = transaction.isPaid ? "paid" : "pending";

    const resolvedPaymentId = paymentId || merchantReference || "";

    const supabase = getSupabaseServerClient();
    if (supabase && resolvedPaymentId) {
      const updateResult = await supabase
        .from("order_payments")
        .update({
          status: paymentStatus,
          tracking_id: trackingId,
          reference: merchantReference || resolvedPaymentId,
          paid_at: paymentStatus === "paid" ? new Date().toISOString() : null
        })
        .eq("id", resolvedPaymentId)
        .select("order_id")
        .single();

      if (updateResult.error) {
        if (!isMissingRelationError(updateResult.error.message) && !isMissingColumnError(updateResult.error.message)) {
          return NextResponse.json({ received: false, error: updateResult.error.message }, { status: 500 });
        }
      }

      const resolvedOrderId = String(updateResult.data?.order_id ?? orderId);
      const summary = resolvedOrderId ? await refreshOrderPaymentSummary(resolvedOrderId) : null;

      return NextResponse.json({
        received: true,
        orderId: resolvedOrderId,
        paymentId: resolvedPaymentId,
        trackingId,
        paymentStatus: summary?.paymentStatus ?? paymentStatus
      });
    }

    const memoryPayment = memoryOrderPayments.find((item) => item.id === resolvedPaymentId);
    if (memoryPayment) {
      memoryPayment.status = paymentStatus;
      memoryPayment.trackingId = trackingId;
      memoryPayment.reference = merchantReference || resolvedPaymentId;
      if (paymentStatus === "paid") {
        memoryPayment.paidAt = new Date().toISOString();
      }
    }

    const resolvedOrderId = memoryPayment?.orderId ?? orderId;
    const summary = resolvedOrderId ? await refreshOrderPaymentSummary(resolvedOrderId) : null;

    return NextResponse.json({
      received: true,
      orderId: resolvedOrderId,
      paymentId: resolvedPaymentId,
      trackingId,
      paymentStatus: summary?.paymentStatus ?? paymentStatus
    });
  } catch (error) {
    return NextResponse.json(
      { received: false, error: error instanceof Error ? error.message : "Unable to process notification" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
