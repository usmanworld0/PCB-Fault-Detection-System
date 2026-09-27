import { getSupabase } from "../supabase";
import { ReportGeneratePayload } from "@/types/api";
import { Report } from "@/types/models";

export async function getReports(): Promise<Report[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Report[];
}

export async function generateReport(payload: ReportGeneratePayload): Promise<Report> {
  const supabase = getSupabase();

  // 1. Fetch inspections from Supabase with optional filters — no backend needed
  let query = supabase.from("inspections").select("*, defects(*)");
  if (payload.status) query = (query as any).eq("status", payload.status);
  if (payload.model) query = (query as any).ilike("model", `%${payload.model}%`);

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

  // 2. Build CSV content (includes PCB ID and image index)
  const csvHeader =
    "PCB ID,Image Index,Captured At,Status,Model,Defect Count,Station ID,Operator Email,Defect Classes\n";
  const csvRows = rows
    .map((r) => {
      const defs: any[] = r.defects || [];
      const defClasses = defs
        .map((d) => d.class || d.cls || "defect")
        .join(" | ");
      return [
        r.pcb_id || "",
        r.image_index ?? 1,
        r.captured_at || "",
        r.final_status || r.status || "",
        r.model || "",
        defs.length,
        r.station_id || "",
        r.operator_email || "",
        `"${defClasses}"`,
      ].join(",");
    })
    .join("\n");

  const csvContent = csvHeader + csvRows;

  const summaryJson = {
    total_inspections: total,
    pass_count: passCount,
    fail_count: failCount,
    total_defects: totalDefects,
    defects_by_class: defectCounts,
    yield_rate:
      total > 0 ? ((passCount / total) * 100).toFixed(1) + "%" : "N/A",
    filters: { status: payload.status, model: payload.model },
    csv_content: payload.format === "CSV" ? csvContent : null,
    generated_at: new Date().toISOString(),
  };

  // 3. Get current user email
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userEmail = user?.email || "system";

  // 4. Insert report record into Supabase reports table
  const reportPayload = {
    title: payload.title,
    report_type: payload.report_type,
    format: payload.format,
    status: "ready",
    summary_json: summaryJson,
    created_by_email: userEmail,
    created_at: new Date().toISOString(),
  };

  const { data: inserted, error: insertErr } = await supabase
    .from("reports")
    .insert(reportPayload)
    .select()
    .single();

  // 5. Always trigger client-side download
  _triggerDownload(payload.format, payload.title, summaryJson);

  if (insertErr) {
    // Table may not exist yet — return a local ephemeral report object
    console.warn("Could not persist report to database:", insertErr.message);
    return {
      id: `local-${Date.now()}`,
      title: payload.title,
      report_type: payload.report_type,
      format: payload.format,
      status: "ready",
      summary_json: summaryJson,
      created_by_email: userEmail,
      created_at: new Date().toISOString(),
    } as Report;
  }

  return inserted as Report;
}

function _triggerDownload(
  format: string,
  title: string,
  summaryJson: Record<string, any>
) {
  if (typeof window === "undefined") return;
  const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();

  if (format === "CSV" && summaryJson.csv_content) {
    const blob = new Blob([summaryJson.csv_content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeTitle}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    // JSON fallback for PDF / other formats
    const json = JSON.stringify(summaryJson, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeTitle}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/** Trigger client-side download for a previously generated report. */
export function downloadReport(report: Report): void {
  if (!report.summary_json) return;
  _triggerDownload(report.format, report.title, report.summary_json);
}
