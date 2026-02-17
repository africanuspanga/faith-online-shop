import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { memoryVisits } from "@/lib/memory-store";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const path = String(body.path ?? "/").trim() || "/";
    const referrer = String(body.referrer ?? "").trim();
    const userAgent = String(body.userAgent ?? request.headers.get("user-agent") ?? "").trim();
    const createdAt = new Date().toISOString();

    const record = {
      id: randomUUID(),
      path,
      referrer,
      user_agent: userAgent,
      created_at: createdAt
    };

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.from("site_visits").insert(record);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true }, { status: 201 });
    }

    memoryVisits.unshift({
      id: record.id,
      path: record.path,
      referrer: record.referrer,
      userAgent: record.user_agent,
      createdAt: record.created_at
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}
