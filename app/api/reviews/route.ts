import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { memoryOrders, memoryReviews } from "@/lib/memory-store";
import { getSupabaseServerClient } from "@/lib/supabase";
import type { ProductReview } from "@/lib/types";

const toReview = (row: Record<string, unknown>): ProductReview => ({
  id: String(row.id ?? randomUUID()),
  orderId: String(row.order_id ?? row.orderId ?? ""),
  productId: String(row.product_id ?? row.productId ?? ""),
  rating: Number(row.rating ?? 0),
  comment: String(row.comment ?? ""),
  customerName: String(row.customer_name ?? row.customerName ?? "Customer"),
  createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString())
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId")?.trim();

  const supabase = getSupabaseServerClient();
  if (supabase) {
    let query = supabase
      .from("reviews")
      .select("id, order_id, product_id, rating, comment, customer_name, created_at")
      .order("created_at", { ascending: false });

    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ source: "supabase", reviews: (data ?? []).map((row) => toReview(row as Record<string, unknown>)) });
  }

  const reviews = productId ? memoryReviews.filter((item) => item.productId === productId) : memoryReviews;
  return NextResponse.json({ source: "memory", reviews });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const orderId = String(body.orderId ?? "").trim();
    const rating = Math.max(1, Math.min(5, Number(body.rating ?? 0)));
    const comment = String(body.comment ?? "").trim();
    const customerName = String(body.customerName ?? "").trim();

    if (!orderId || !comment || Number.isNaN(rating)) {
      return NextResponse.json({ error: "Invalid review data" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, status, product_id, full_name")
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      if (String(order.status) !== "delivered") {
        return NextResponse.json({ error: "Review inaruhusiwa baada ya oda kuwa delivered." }, { status: 400 });
      }

      const { data: existing, error: existingError } = await supabase
        .from("reviews")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();

      if (existingError) {
        return NextResponse.json({ error: existingError.message }, { status: 500 });
      }

      if (existing) {
        return NextResponse.json({ error: "Review ya oda hii tayari ipo." }, { status: 409 });
      }

      const payload = {
        id: randomUUID(),
        order_id: orderId,
        product_id: String(order.product_id ?? ""),
        rating,
        comment,
        customer_name: customerName || String(order.full_name ?? "Customer"),
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("reviews")
        .insert(payload)
        .select("id, order_id, product_id, rating, comment, customer_name, created_at")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, review: toReview(data as Record<string, unknown>) }, { status: 201 });
    }

    const order = memoryOrders.find((item) => item.id === orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "delivered") {
      return NextResponse.json({ error: "Review inaruhusiwa baada ya oda kuwa delivered." }, { status: 400 });
    }

    if (memoryReviews.some((item) => item.orderId === orderId)) {
      return NextResponse.json({ error: "Review ya oda hii tayari ipo." }, { status: 409 });
    }

    const review: ProductReview = {
      id: randomUUID(),
      orderId,
      productId: order.productId,
      rating,
      comment,
      customerName: customerName || order.fullName,
      createdAt: new Date().toISOString()
    };
    memoryReviews.unshift(review);

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}
