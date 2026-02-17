import { NextResponse } from "next/server";
import { memoryOrders } from "@/lib/memory-store";
import { getPesapalTransactionStatus } from "@/lib/pesapal";
import { getSupabaseServerClient } from "@/lib/supabase";

const pick = (url: URL, keys: string[]) => {
  for (const key of keys) {
    const value = url.searchParams.get(key)?.trim();
    if (value) return value;
  }
  return "";
};

const updateOrderPayment = async (orderId: string, trackingId: string, paymentStatus: "paid" | "pending") => {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        payment_tracking_id: trackingId,
        payment_reference: orderId
      })
      .eq("id", orderId);
    return;
  }

  const order = memoryOrders.find((item) => item.id === orderId);
  if (order) {
    order.paymentStatus = paymentStatus;
    order.paymentTrackingId = trackingId;
    order.paymentReference = orderId;
  }
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const trackingId = pick(url, ["OrderTrackingId", "orderTrackingId", "trackingId"]);
  const orderId = pick(url, ["OrderMerchantReference", "merchantReference", "order", "id"]);

  if (!trackingId || !orderId) {
    return NextResponse.json({ received: false, message: "Missing tracking/order reference" }, { status: 400 });
  }

  try {
    const transaction = await getPesapalTransactionStatus(trackingId);
    const paymentStatus = transaction.isPaid ? "paid" : "pending";
    await updateOrderPayment(orderId, trackingId, paymentStatus);

    return NextResponse.json({ received: true, orderId, trackingId, paymentStatus });
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
