import { NextResponse } from "next/server";
import { memoryOrders } from "@/lib/memory-store";
import { getPesapalTransactionStatus } from "@/lib/pesapal";
import { getSupabaseServerClient } from "@/lib/supabase";

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
  const merchantReference = getParam(url, ["OrderMerchantReference", "merchantReference", "order", "id"]);

  if (!trackingId || !merchantReference) {
    return NextResponse.redirect(new URL(`/thank-you?order=${encodeURIComponent(merchantReference || "unknown")}&payment=pesapal&status=failed`, url.origin));
  }

  try {
    const transaction = await getPesapalTransactionStatus(trackingId);
    const paymentStatus = transaction.isPaid ? "paid" : "pending";

    const supabase = getSupabaseServerClient();
    if (supabase) {
      await supabase
        .from("orders")
        .update({
          payment_status: paymentStatus,
          payment_tracking_id: trackingId,
          payment_reference: merchantReference
        })
        .eq("id", merchantReference);
    } else {
      const order = memoryOrders.find((item) => item.id === merchantReference);
      if (order) {
        order.paymentStatus = paymentStatus;
        order.paymentTrackingId = trackingId;
        order.paymentReference = merchantReference;
      }
    }

    return NextResponse.redirect(
      new URL(
        `/thank-you?order=${encodeURIComponent(merchantReference)}&payment=pesapal&status=${encodeURIComponent(paymentStatus)}`,
        url.origin
      )
    );
  } catch {
    return NextResponse.redirect(
      new URL(`/thank-you?order=${encodeURIComponent(merchantReference)}&payment=pesapal&status=failed`, url.origin)
    );
  }
}
