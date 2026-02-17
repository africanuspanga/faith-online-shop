import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import { memoryOrders } from "@/lib/memory-store";
import { getSupabaseServerClient } from "@/lib/supabase";
import type { PaymentStatus } from "@/lib/types";

const allowedStatuses = new Set(["pending", "confirmed", "delivered", "cancelled"]);
const allowedPaymentStatuses = new Set<PaymentStatus>([
  "unpaid",
  "pending",
  "partial",
  "paid",
  "failed",
  "pending-verification"
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const status = String(body.status ?? "").trim();
    const paymentStatusRaw = String(body.paymentStatus ?? "").trim() as PaymentStatus;
    const paymentStatus = allowedPaymentStatuses.has(paymentStatusRaw) ? paymentStatusRaw : null;

    if (!allowedStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    if (supabase) {
      const updatePayload: Record<string, string> = { status };
      if (paymentStatus) {
        updatePayload.payment_status = paymentStatus;
      }

      const { data, error } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", id)
        .select("id, status, payment_status")
        .single();

      if (error && /column .* does not exist/i.test(error.message)) {
        const { data: legacyData, error: legacyError } = await supabase
          .from("orders")
          .update({ status })
          .eq("id", id)
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

    const order = memoryOrders.find((item) => item.id === id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    order.status = status as "pending" | "confirmed" | "delivered" | "cancelled";
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
