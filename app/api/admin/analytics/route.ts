import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import { memorySignups, memoryVisits } from "@/lib/memory-store";
import { getSupabaseServerClient } from "@/lib/supabase";

const getTodayStartIso = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return start.toISOString();
};

export async function GET(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (supabase) {
    const todayStart = getTodayStartIso();

    const [{ count: totalViews, error: totalViewsError }, { count: todayViews, error: todayViewsError }, { count: totalSignups, error: totalSignupsError }] =
      await Promise.all([
        supabase.from("site_visits").select("id", { head: true, count: "exact" }),
        supabase.from("site_visits").select("id", { head: true, count: "exact" }).gte("created_at", todayStart),
        supabase.from("customer_signups").select("id", { head: true, count: "exact" })
      ]);

    const firstError = totalViewsError || todayViewsError || totalSignupsError;
    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 500 });
    }

    return NextResponse.json({
      source: "supabase",
      totalViews: totalViews ?? 0,
      todayViews: todayViews ?? 0,
      totalSignups: totalSignups ?? 0
    });
  }

  const todayStart = new Date(getTodayStartIso()).getTime();
  const todayViews = memoryVisits.filter((item) => new Date(item.createdAt).getTime() >= todayStart).length;

  return NextResponse.json({
    source: "memory",
    totalViews: memoryVisits.length,
    todayViews,
    totalSignups: memorySignups.length
  });
}
