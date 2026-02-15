import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import { memoryOrders } from "@/lib/memory-store";
import { getSupabaseServerClient } from "@/lib/supabase";

const allowedStatuses = new Set(["pending", "confirmed", "delivered", "cancelled"]);

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

    if (!allowedStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    if (supabase) {
      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select("id, status")
        .single();

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
    return NextResponse.json({ success: true, order: { id: order.id, status: order.status } });
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}
