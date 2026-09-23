import { getSupabase } from "@/lib/supabase";
import { apiFetch } from "./client";
import { Stats, TrendItem } from "@/types/models";

export async function getStats(): Promise<Stats> {
  try {
    const supabase = getSupabase();

    // 1. Total Inspections & Status Counts
    const { count: totalInspections, error: inspErr } = await supabase
      .from("inspections")
      .select("*", { count: "exact", head: true });
    if (inspErr) throw inspErr;

    const { count: passCount } = await supabase
      .from("inspections")
      .select("*", { count: "exact", head: true })
      .eq("status", "PASS");

    const total = totalInspections || 0;
    const passed = passCount || 0;
    const failed = Math.max(0, total - passed);
    const yieldRate = total > 0 ? (passed / total) * 100 : 100;

    // 2. Defects Aggregation
    const { data: defects } = await supabase
      .from("defects")
      .select("class, severity");

    const defectsList = defects || [];
    const totalDefects = defectsList.length;
    let criticalDefects = 0;
    const defectsByClass: Record<string, number> = {
      open: 0,
      short: 0,
      mousebite: 0,
      spur: 0,
      copper: 0,
      pinhole: 0,
    };
    const defectsBySeverity: Record<string, number> = {
      Critical: 0,
      Moderate: 0,
      Minor: 0,
    };

    for (const d of defectsList as any[]) {
      const cls = d.class || d.cls;
      if (d.severity === "Critical") criticalDefects++;
      if (cls && defectsByClass[cls] !== undefined) {
        defectsByClass[cls]++;
      } else if (cls) {
        defectsByClass[cls] = (defectsByClass[cls] || 0) + 1;
      }
      if (d.severity && defectsBySeverity[d.severity] !== undefined) {
        defectsBySeverity[d.severity]++;
      }
    }

    // 3. Pending Reviews
    const { count: pendingReviews } = await supabase
      .from("inspections")
      .select("*", { count: "exact", head: true })
      .or("review_status.eq.UNREVIEWED,review_status.eq.unreviewed,review_status.eq.pending");

    // 4. Active Alerts
    const { count: activeAlerts } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);

    // 5. 30-Day Trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: recentInspections } = await supabase
      .from("inspections")
      .select("captured_at, defects(id)")
      .gte("captured_at", thirtyDaysAgo.toISOString())
      .order("captured_at", { ascending: true });

    const trendMap: Record<string, { inspections: number; defects: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const dateStr = d.toISOString().slice(0, 10);
      trendMap[dateStr] = { inspections: 0, defects: 0 };
    }

    for (const row of (recentInspections || []) as any[]) {
      const dateStr = (row.captured_at || "").slice(0, 10);
      if (trendMap[dateStr]) {
        trendMap[dateStr].inspections++;
        trendMap[dateStr].defects += Array.isArray(row.defects) ? row.defects.length : 0;
      }
    }

    const trendLast30Days: TrendItem[] = Object.entries(trendMap).map(([date, val]) => ({
      date,
      inspections: val.inspections,
      defects: val.defects,
    }));

    return {
      total_inspections: total,
      pass_count: passed,
      fail_count: failed,
      yield_rate: yieldRate,
      total_defects: totalDefects,
      critical_defects: criticalDefects,
      pending_reviews: pendingReviews || 0,
      active_alerts: activeAlerts || 0,
      trend_last_30_days: trendLast30Days,
      defects_by_class: defectsByClass,
      defects_by_severity: defectsBySeverity,
    };
  } catch {
    return apiFetch<Stats>("/stats");
  }
}
