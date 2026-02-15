import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import { getSupabaseServerClient } from "@/lib/supabase";

const bucketName = "product-images";

export async function POST(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured for uploads" }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const filePath = `${Date.now()}-${randomUUID()}.${extension}`;

    const { error } = await supabase.storage.from(bucketName).upload(filePath, file, {
      contentType: file.type || "image/jpeg",
      upsert: false
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return NextResponse.json({ url: data.publicUrl }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 400 });
  }
}
