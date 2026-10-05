import { getSupabase } from "../supabase";
import { apiFetch } from "./client";
import { getMe } from "./auth";
import { ReportGeneratePayload } from "@/types/api";
import { Report, User } from "@/types/models";

/**
 * Helper to resolve active user's email and admin privileges
 */
async function resolveReportUserInfo(context?: { email?: string; role?: string }): Promise<{ email?: string; isAdmin: boolean }> {
  const adminNotificationEmail = (
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    "world.usman.business@gmail.com"
  ).toLowerCase();

  if (context?.role !== undefined) {
    const isAdmin = context.role === "admin";
    return { email: context.email?.toLowerCase(), isAdmin };
  }

  try {
    const me: User = await getMe();
    const email = me.email?.toLowerCase();
    const isAdmin = me.role === "admin" || email === adminNotificationEmail;
    return { email, isAdmin };
  } catch {
    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;
      if (user?.email) {
        const email = user.email.toLowerCase();
        const isAdmin =
          user.app_metadata?.role === "admin" ||
          user.user_metadata?.role === "admin" ||
          email === adminNotificationEmail;
        return { email, isAdmin };
      }
    } catch {
      // ignore
    }
  }

  return { email: undefined, isAdmin: false };
}

export async function getReports(userContext?: { email?: string; role?: string }): Promise<Report[]> {
  const { email: userEmail, isAdmin } = await resolveReportUserInfo(userContext);

  try {
    const supabase = getSupabase();
    let query = supabase.from("reports").select("*");

    // Non-admins can only see reports they generated; admins see all reports
    if (!isAdmin) {
      if (userEmail) {
        query = query.ilike("created_by_email", userEmail);
      } else {
        return [];
      }
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as Report[];
  } catch (err: any) {
    // Fallback to backend reports endpoint
    try {
      return await apiFetch<Report[]>("/reports");
    } catch {
      return [];
    }
  }
}

export async function generateReport(payload: ReportGeneratePayload): Promise<Report> {
  const { email: userEmail, isAdmin } = await resolveReportUserInfo({
    email: payload.operator_email,
    role: payload.current_user_role,
  });

  const creatorEmail = userEmail || "system";

  try {
    const supabase = getSupabase();

    // 1. Fetch inspections from Supabase with optional filters
    let query = supabase.from("inspections").select("*, defects(*)");

    // Non-admins only aggregate inspections they performed
    if (!isAdmin) {
      if (userEmail) {
        query = query.ilike("operator_email", userEmail);
      } else {
        throw new Error("You must be signed in to generate an inspection report.");
      }
    }

    if (payload.status) query = (query as any).eq("status", payload.status);
    if (payload.model) query = (query as any).ilike("model", `%${payload.model}%`);
    if (payload.station_id) query = (query as any).eq("station_id", payload.station_id);
    if (payload.date_from) query = (query as any).gte("captured_at", payload.date_from);
    if (payload.date_to) query = (query as any).lte("captured_at", payload.date_to);

    const { data: inspections, error: inspErr } = await (query as any).order("captured_at", {
      ascending: false,
    });
    if (inspErr) throw new Error(inspErr.message);

    const rows: any[] = inspections || [];
    const total = rows.length;
    const passCount = rows.filter(
      (r) => (r.final_status || r.status) === "PASS"
    ).length;
    const failCount = total - passCount;
    const defectCounts: Record<string, number> = {};
    let totalDefects = 0;

    rows.forEach((r) => {
      const defs: any[] = r.defects || [];
      totalDefects += defs.length;
      defs.forEach((d) => {
        const cls = d.class || d.cls || "unknown";
        defectCounts[cls] = (defectCounts[cls] || 0) + 1;
      });
    });

    // 2. Build structured CSV content
    const csvHeader =
      "Inspection ID,PCB ID,Image Index,Captured At,AI Status,Final Status,Model,Defect Count,Station ID,Operator Email,Defects Summary\n";
    const csvRows = rows
      .map((r) => {
        const defs: any[] = r.defects || [];
        const defClasses = defs
          .map((d) => `${d.class || d.cls || "defect"}(${d.severity || "Moderate"}, ${(d.confidence ?? 0.9).toFixed(2)})`)
          .join(" | ");
        return [
          r.id || "",
          r.pcb_id || "",
          r.image_index ?? 1,
          r.captured_at || "",
          r.status || "",
          r.final_status || r.status || "",
          r.model || "",
          defs.length,
          r.station_id || "",
          r.operator_email || "",
          `"${defClasses.replace(/"/g, '""')}"`,
        ].join(",");
      })
      .join("\n");

    const csvContent = csvHeader + csvRows;

    const summaryJson = {
      title: payload.title,
      report_type: payload.report_type,
      total_inspections: total,
      pass_count: passCount,
      fail_count: failCount,
      total_defects: totalDefects,
      defects_by_class: defectCounts,
      yield_rate:
        total > 0 ? ((passCount / total) * 100).toFixed(1) + "%" : "100.0%",
      filters: {
        status: payload.status,
        model: payload.model,
        station_id: payload.station_id,
        date_from: payload.date_from,
        date_to: payload.date_to,
      },
      csv_content: csvContent,
      generated_at: new Date().toISOString(),
    };

    // 3. Insert report record into Supabase reports table
    const reportPayload = {
      title: payload.title,
      report_type: payload.report_type,
      format: (payload.format ?? "CSV").toUpperCase(),
      status: "COMPLETED",
      summary_json: summaryJson,
      file_content: csvContent,
      created_by_email: creatorEmail,
      created_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertErr } = await supabase
      .from("reports")
      .insert(reportPayload)
      .select()
      .single();

    // 4. Always trigger immediate client-side download
    _triggerDownload(payload.format ?? "CSV", payload.title, summaryJson, csvContent);

    if (insertErr) {
      // Table may have RLS or be local ephemeral
      console.warn("Could not persist report to supabase:", insertErr.message);
      return {
        id: `local-${Date.now()}`,
        title: payload.title,
        report_type: payload.report_type,
        format: (payload.format ?? "CSV").toUpperCase(),
        status: "COMPLETED",
        summary_json: summaryJson,
        file_content: csvContent,
        created_by_email: creatorEmail,
        created_at: new Date().toISOString(),
      } as Report;
    }

    return inserted as Report;
  } catch (err: any) {
    // If Supabase fails, try FastAPI backend report generation
    try {
      const res = await apiFetch<Report>("/reports/generate", {
        method: "POST",
        body: JSON.stringify({
          title: payload.title,
          report_type: payload.report_type,
          format: (payload.format ?? "CSV").toUpperCase(),
          status: payload.status,
          model: payload.model,
          defect_class: payload.defect_class,
          station_id: payload.station_id,
        }),
      });

      if (res.file_url) {
        window.open(res.file_url, "_blank");
      }
      return res;
    } catch {
      throw err;
    }
  }
}

function _triggerDownload(
  format: string,
  title: string,
  summaryJson: Record<string, any>,
  rawCsv?: string
) {
  if (typeof window === "undefined") return;
  const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const csvData = rawCsv || summaryJson.csv_content;

  if (format.toUpperCase() === "CSV" && csvData) {
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeTitle}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    // JSON fallback for PDF / structured summaries
    const json = JSON.stringify(summaryJson, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeTitle}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/** Trigger client-side download for a previously generated report. */
export function downloadReport(report: Report): void {
  const csvContent = report.file_content || report.summary_json?.csv_content;
  if (csvContent) {
    _triggerDownload("CSV", report.title, report.summary_json || {}, csvContent);
    return;
  }

  if (report.summary_json) {
    _triggerDownload(report.format, report.title, report.summary_json);
    return;
  }

  if (report.file_url) {
    window.open(report.file_url, "_blank");
  }
}

/** Explicit helper for exporting inspection datasets to CSV */
export function exportReportToCsv(title: string, csvContent: string): void {
  _triggerDownload("CSV", title, {}, csvContent);
}
