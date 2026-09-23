import { getSupabase } from "@/lib/supabase";
import { apiFetch } from "./client";
import { InspectionListApiResponse, ReviewQueueParams, ReviewSubmitPayload } from "@/types/api";
import { Review, InspectionListItem } from "@/types/models";

export async function getReviewQueue(params: ReviewQueueParams = {}): Promise<InspectionListApiResponse> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("inspections").select("*, defects(*)", { count: "exact" });
    if (params.filter_status && params.filter_status !== "ALL") {
      query = query.eq("review_status", params.filter_status.toLowerCase());
    }
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    query = query.order("captured_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    const items: InspectionListItem[] = (data || []).map((row: any) => ({
      id: row.id,
      captured_at: row.captured_at,
      model: row.model || "yolov8s",
      status: row.status,
      defect_count: Array.isArray(row.defects) ? row.defects.length : (row.defect_count ?? 0),
      image_url: row.image_url || row.image_path || "",
      station_id: row.station_id || "STATION-01",
      review_status: row.review_status || "UNREVIEWED",
      final_status: row.final_status || row.status,
    }));

    return {
      items,
      total: count ?? items.length,
    };
  } catch {
    const searchParams = new URLSearchParams();
    if (params.filter_status) searchParams.set("filter_status", params.filter_status);
    if (params.limit !== undefined) searchParams.set("limit", params.limit.toString());
    if (params.offset !== undefined) searchParams.set("offset", params.offset.toString());
    const query = searchParams.toString();
    return apiFetch<InspectionListApiResponse>(`/reviews${query ? `?${query}` : ""}`);
  }
}

export async function submitReview(payload: ReviewSubmitPayload): Promise<Review> {
  try {
    const supabase = getSupabase();
    const finalResult = payload.review_decision === "OVERRIDE_PASS" ? "PASS" : (payload.review_decision === "OVERRIDE_FAIL" ? "FAIL" : "FAIL");

    const { data: rev, error: revErr } = await supabase
      .from("reviews")
      .insert({
        inspection_id: payload.inspection_id,
        automated_result: "FAIL",
        review_decision: payload.review_decision,
        final_result: finalResult,
        justification: payload.justification,
        notes: payload.notes,
        reviewer_email: "reviewer@example.com",
      })
      .select()
      .single();
    if (revErr || !rev) throw revErr;

    const updateFields: any = {
      review_status: payload.review_decision === "CONFIRM" ? "confirmed" : "overridden",
      final_status: finalResult,
    };

    await supabase
      .from("inspections")
      .update(updateFields)
      .eq("id", payload.inspection_id);

    return {
      id: rev.id,
      inspection_id: rev.inspection_id,
      automated_result: rev.automated_result || "FAIL",
      review_decision: rev.review_decision,
      final_result: rev.final_result || finalResult,
      reviewer_email: rev.reviewer_email || "reviewer@example.com",
      justification: rev.justification,
      notes: rev.notes,
      created_at: rev.created_at || new Date().toISOString(),
    };
  } catch {
    return apiFetch<Review>("/reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}

export async function getInspectionReviews(inspectionId: string): Promise<Review[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("inspection_id", inspectionId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id,
      inspection_id: r.inspection_id,
      automated_result: r.automated_result || "FAIL",
      review_decision: r.review_decision || "CONFIRM",
      final_result: r.final_result || "FAIL",
      reviewer_email: r.reviewer_email || "reviewer@example.com",
      justification: r.justification || "",
      notes: r.notes,
      created_at: r.created_at || new Date().toISOString(),
    }));
  } catch {
    return apiFetch<Review[]>(`/reviews/${inspectionId}`);
  }
}
