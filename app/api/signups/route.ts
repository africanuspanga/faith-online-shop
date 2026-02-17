import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { memorySignups } from "@/lib/memory-store";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fullName = String(body.fullName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = String(body.email ?? "").trim();

    if (!fullName || !phone) {
      return NextResponse.json({ error: "Jaza jina na simu." }, { status: 400 });
    }

    const record = {
      id: randomUUID(),
      full_name: fullName,
      phone,
      email,
      created_at: new Date().toISOString()
    };

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.from("customer_signups").insert(record);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, id: record.id }, { status: 201 });
    }

    memorySignups.unshift({
      id: record.id,
      fullName,
      phone,
      email,
      createdAt: record.created_at
    });
    return NextResponse.json({ success: true, id: record.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}
