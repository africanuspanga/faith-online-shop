import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import { normalizeCategorySlug } from "@/lib/categories";
import { products as staticProducts } from "@/lib/products";
import { getSupabaseServerClient } from "@/lib/supabase";

const fallbackImage = "/placeholder.svg";

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
const toAssetPath = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return fallbackImage;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
  }
  return `/${trimmed}`;
};

const toStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return [];
    if (normalized.startsWith("[") && normalized.endsWith("]")) {
      try {
        const parsed = JSON.parse(normalized);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        return [];
      }
    }
    return normalized
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

type ProductPayload = {
  name: string;
  slug: string;
  category: string;
  sku: string;
  brand: string;
  original_price: number;
  sale_price: number;
  image: string;
  in_stock: boolean;
  rating: number;
  gallery: string[];
  size_options: string[];
  color_options: string[];
  sold: number;
  is_new: boolean;
  best_selling: boolean;
  description_sw: string;
  benefits_sw: string[];
  who_for_sw: string;
};

const parsePayload = (body: Record<string, unknown>): ProductPayload | null => {
  const name = String(body.name ?? "").trim();
  const category = normalizeCategorySlug(String(body.category ?? ""));
  const originalPrice = Number(body.originalPrice ?? 0);
  const salePrice = Number(body.salePrice ?? 0);
  const sku = String(body.sku ?? "").trim().toUpperCase();
  const brand = String(body.brand ?? "").trim();
  const image = toAssetPath(String(body.image ?? fallbackImage));
  const inStock = Boolean(body.inStock ?? true);
  const rating = Math.max(0, Math.min(5, Number(body.rating ?? 4.5)));
  const sold = Math.max(0, Number(body.sold ?? 0));
  const isNew = Boolean(body.isNew ?? false);
  const bestSelling = Boolean(body.bestSelling ?? false);
  const descriptionSw = String(body.descriptionSw ?? "").trim();
  const whoForSw = String(body.whoForSw ?? "").trim();
  const benefitsSw = toStringList(body.benefitsSw);
  const gallery = toStringList(body.gallery);
  const sizeOptions = toStringList(body.sizeOptions);
  const colorOptions = toStringList(body.colorOptions);

  if (
    !name ||
    !category ||
    originalPrice <= 0 ||
    salePrice <= 0 ||
    salePrice > originalPrice
  ) {
    return null;
  }

  return {
    name,
    slug: slugify(name),
    category,
    sku: sku || `SKU-${slugify(name).toUpperCase()}`,
    brand: brand || "Faith Select",
    original_price: originalPrice,
    sale_price: salePrice,
    image,
    in_stock: inStock,
    rating,
    gallery: (gallery.length ? gallery : [image, image, image]).map((item) => toAssetPath(item)),
    size_options: sizeOptions,
    color_options: colorOptions,
    sold,
    is_new: isNew,
    best_selling: bestSelling,
    description_sw: descriptionSw || "Bidhaa bora kwa matumizi ya kila siku, tunafikisha Tanzania nzima kwa gharama nafuu.",
    benefits_sw: benefitsSw.length
      ? benefitsSw
      : [
          "Ubora wa juu uliothibitishwa",
          "Malipo baada ya kupokea bidhaa",
          "Tunafikisha oda Tanzania nzima kwa gharama nafuu ya usafiri"
        ],
    who_for_sw: whoForSw || "Inafaa kwa mtu yeyote anayehitaji bidhaa bora kwa bei nafuu."
  };
};

export async function GET(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ source: "supabase", products: data ?? [] });
  }

  return NextResponse.json({ source: "static", products: staticProducts });
}

export async function POST(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = parsePayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid product data" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select()
      .single();

    if (error && /column .* does not exist/i.test(error.message)) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("products")
        .insert({
          name: payload.name,
          category: payload.category,
          original_price: payload.original_price,
          sale_price: payload.sale_price,
          image: payload.image,
          in_stock: payload.in_stock
        })
        .select()
        .single();

      if (legacyError) {
        return NextResponse.json({ error: legacyError.message }, { status: 500 });
      }

      return NextResponse.json(
        {
          ...legacyData,
          warning: "Product saved with legacy schema. Run latest supabase/schema.sql to enable checkout info fields."
        },
        { status: 201 }
      );
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id ?? "").trim();
    const payload = parsePayload(body);

    if (!id || !payload) {
      return NextResponse.json({ error: "Invalid product data" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error && /column .* does not exist/i.test(error.message)) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("products")
        .update({
          name: payload.name,
          category: payload.category,
          original_price: payload.original_price,
          sale_price: payload.sale_price,
          image: payload.image,
          in_stock: payload.in_stock
        })
        .eq("id", id)
        .select()
        .single();

      if (legacyError) {
        return NextResponse.json({ error: legacyError.message }, { status: 500 });
      }

      return NextResponse.json(
        {
          ...legacyData,
          warning: "Product updated with legacy schema. Run latest supabase/schema.sql to enable checkout info fields."
        },
        { status: 200 }
      );
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim();

  if (!id) {
    return NextResponse.json({ error: "Missing product id" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 400 }
    );
  }

  const rows = staticProducts.map((item) => ({
    name: item.name,
    slug: item.slug,
    category: item.category,
    sku: item.sku,
    brand: item.brand,
    original_price: item.originalPrice,
    sale_price: item.salePrice,
    image: item.image,
    in_stock: item.inStock,
    rating: item.rating,
    gallery: item.gallery,
    size_options: item.sizeOptions,
    color_options: item.colorOptions,
    sold: item.sold,
    is_new: Boolean(item.isNew),
    best_selling: Boolean(item.bestSelling),
    description_sw: item.descriptionSw,
    benefits_sw: item.benefitsSw,
    who_for_sw: item.whoForSw
  }));

  const { error } = await supabase.from("products").upsert(rows, { onConflict: "slug" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, imported: rows.length });
}
