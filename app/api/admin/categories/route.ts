import { NextResponse } from "next/server";
import { categories as defaultCategories, createFallbackCategory, normalizeCategorySlug } from "@/lib/categories";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import { isMissingColumnError } from "@/lib/db-errors";
import { getSupabaseServerClient } from "@/lib/supabase";

const fallbackImage = "/placeholder.svg";

const isMissingRelationError = (message: string) =>
  /relation .* does not exist/i.test(message) || /could not find .* relation/i.test(message);

const toAssetPath = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return fallbackImage;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed) || trimmed.startsWith("/")) return trimmed;
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return `/${trimmed}`;
};

type CategoryPayload = {
  slug: string;
  label: string;
  description: string;
  image: string;
  sub_categories: string[];
};

const toStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const parsePayload = (body: Record<string, unknown>): CategoryPayload | null => {
  const labelInput = String(body.label ?? "").trim();
  const slugInput = normalizeCategorySlug(String(body.slug ?? ""));
  const slug = slugInput || normalizeCategorySlug(labelInput);

  if (!slug) return null;

  const fallback = createFallbackCategory(slug);
  const label = labelInput || fallback.label;
  const descriptionInput = String(body.description ?? "").trim();
  const description = descriptionInput || fallback.description;
  const image = toAssetPath(String(body.image ?? fallback.image));
  const subCategories = [...new Set(toStringList(body.subCategories ?? body.sub_categories).map(normalizeCategorySlug).filter(Boolean))];

  return {
    slug,
    label,
    description,
    image,
    sub_categories: subCategories
  };
};

export async function GET(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();

  const fallbackRows = defaultCategories.map((category) => ({
    id: category.slug,
    slug: category.slug,
    label: category.label,
    description: category.description,
    image: category.image,
    sub_categories: category.subCategories ?? [],
    created_at: new Date().toISOString()
  }));

  if (!supabase) {
    return NextResponse.json({ source: "static", categories: fallbackRows });
  }

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error && isMissingRelationError(error.message)) {
    return NextResponse.json({ source: "static", categories: fallbackRows });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ source: "supabase", categories: data ?? [] });
}

export async function POST(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = parsePayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid category data" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("categories")
      .insert(payload)
      .select()
      .single();

    if (error && isMissingColumnError(error.message)) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("categories")
        .insert({
          slug: payload.slug,
          label: payload.label,
          description: payload.description,
          image: payload.image
        })
        .select()
        .single();

      if (legacyError) {
        return NextResponse.json({ error: legacyError.message }, { status: 500 });
      }

      return NextResponse.json(
        {
          ...legacyData,
          warning: "Category saved without subcategory registry. Run latest supabase/schema.sql to persist subcategories."
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
      return NextResponse.json({ error: "Invalid category data" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error && isMissingColumnError(error.message)) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("categories")
        .update({
          slug: payload.slug,
          label: payload.label,
          description: payload.description,
          image: payload.image
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
          warning: "Category updated without subcategory registry. Run latest supabase/schema.sql to persist subcategories."
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
    return NextResponse.json({ error: "Missing category id" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
