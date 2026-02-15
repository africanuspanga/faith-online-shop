import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import { memoryOrders } from "@/lib/memory-store";
import { getCatalogProductById } from "@/lib/catalog";
import type { OrderRecord } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase";

const allowedStatuses = new Set(["pending", "confirmed", "delivered", "cancelled"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();

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

    if (!product || !fullName || !phone || !address || !productName) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    const record: OrderRecord = {
      id: randomUUID(),
      productId,
      quantity,
      fullName,
      phone,
      regionCity,
      address,
      createdAt: new Date().toISOString(),
      status: "pending",
      total: totalPrice
    };

    const supabase = getSupabaseServerClient();

    if (supabase) {
      const payload = {
        id: record.id,
        product_id: record.productId,
        product_name: productName,
        quantity: record.quantity,
        full_name: record.fullName,
        phone: record.phone,
        region_city: record.regionCity,
        address: record.address,
        status: record.status,
        total: record.total,
        created_at: record.createdAt
      };

      const { error } = await supabase.from("orders").insert(payload);

      if (error && /product_id.*integer/i.test(error.message)) {
        const numericProductId = Number(record.productId);
        const legacyPayload = {
          ...payload,
          product_id: Number.isFinite(numericProductId) ? numericProductId : null
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

    return NextResponse.json({ id: record.id, status: "ok" }, { status: 201 });
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
    const { data, error } = await supabase
      .from("orders")
      .select("id, product_id, product_name, quantity, full_name, phone, region_city, address, status, total, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const normalized = (data ?? []).map((item) => ({
      id: item.id,
      productId: String(item.product_id ?? ""),
      productName: item.product_name,
      quantity: item.quantity,
      fullName: item.full_name,
      phone: item.phone,
      regionCity: item.region_city,
      address: item.address,
      status: item.status,
      total: item.total,
      createdAt: item.created_at
    }));

    return NextResponse.json({ source: "supabase", orders: normalized });
  }

  return NextResponse.json({ source: "memory", orders: memoryOrders });
}

export async function PATCH(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const orderId = String(body.orderId ?? "").trim();
    const status = String(body.status ?? "").trim();

    if (!orderId || !allowedStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    if (supabase) {
      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId)
        .select("id, status")
        .single();

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
    return NextResponse.json({ success: true, order: { id: order.id, status: order.status } });
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}
