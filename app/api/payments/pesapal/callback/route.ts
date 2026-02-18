import { NextResponse } from "next/server";
import { isMissingColumnError } from "@/lib/db-errors";
import { memoryOrderPayments } from "@/lib/memory-store";
import { refreshOrderPaymentSummary } from "@/lib/order-payment-sync";
import { getPesapalTransactionStatus } from "@/lib/pesapal";
import { getSupabaseServerClient } from "@/lib/supabase";

const isMissingRelationError = (message: string) =>
  /relation .* does not exist/i.test(message) || /could not find .* relation/i.test(message);

const getParam = (url: URL, keys: string[]) => {
  for (const key of keys) {
    const value = url.searchParams.get(key)?.trim();
    if (value) return value;
  }
  return "";
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const trackingId = getParam(url, ["OrderTrackingId", "orderTrackingId", "trackingId"]);
  const merchantReference = getParam(url, ["OrderMerchantReference", "merchantReference", "id"]);
  const orderId = getParam(url, ["order", "orderId", "OrderId"]);
  const paymentId = getParam(url, ["payment", "paymentId", "PaymentId"]);

  if (!trackingId) {
    return NextResponse.redirect(
      new URL(`/thank-you?order=${encodeURIComponent(orderId || "unknown")}&payment=pesapal&status=failed`, url.origin)
    );
  }

  try {
    const transaction = await getPesapalTransactionStatus(trackingId);
    const paymentStatus = transaction.isPaid ? "paid" : "pending";

    const resolvedOrderId = orderId || "";
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

      if (updateResult.error && !isMissingRelationError(updateResult.error.message) && !isMissingColumnError(updateResult.error.message)) {
        return NextResponse.redirect(
          new URL(
            `/thank-you?order=${encodeURIComponent(resolvedOrderId || "unknown")}&payment=pesapal&status=failed`,
            url.origin
          )
        );
      }

      const nextOrderId = String(updateResult.data?.order_id ?? resolvedOrderId);
      const summary = nextOrderId ? await refreshOrderPaymentSummary(nextOrderId) : null;
      const status = summary?.paymentStatus ?? paymentStatus;

      return NextResponse.redirect(
        new URL(
          `/thank-you?order=${encodeURIComponent(nextOrderId || "unknown")}&payment=pesapal&status=${encodeURIComponent(status)}`,
          url.origin
        )
      );
    }

    if (resolvedPaymentId) {
      const payment = memoryOrderPayments.find((item) => item.id === resolvedPaymentId);
      if (payment) {
        payment.status = paymentStatus;
        payment.trackingId = trackingId;
        payment.reference = merchantReference || resolvedPaymentId;
        if (paymentStatus === "paid") {
          payment.paidAt = new Date().toISOString();
        }
      }

      const nextOrderId = payment?.orderId ?? resolvedOrderId;
      const summary = nextOrderId ? await refreshOrderPaymentSummary(nextOrderId) : null;
      const status = summary?.paymentStatus ?? paymentStatus;

      return NextResponse.redirect(
        new URL(
          `/thank-you?order=${encodeURIComponent(nextOrderId || "unknown")}&payment=pesapal&status=${encodeURIComponent(status)}`,
          url.origin
        )
      );
    }

    return NextResponse.redirect(
      new URL(`/thank-you?order=${encodeURIComponent(resolvedOrderId || "unknown")}&payment=pesapal&status=failed`, url.origin)
    );
  } catch {
    return NextResponse.redirect(
      new URL(`/thank-you?order=${encodeURIComponent(orderId || "unknown")}&payment=pesapal&status=failed`, url.origin)
    );
  }
}
