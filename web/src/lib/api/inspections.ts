import { getSupabase } from "@/lib/supabase";
import { apiFetch } from "./client";
import { InspectionListApiResponse, InspectionListParams } from "@/types/api";
import { InspectionDetail, InspectionListItem } from "@/types/models";

export async function getInspections(params: InspectionListParams = {}): Promise<InspectionListApiResponse> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("inspections").select("*, defects(*)", { count: "exact" });

    if (params.status) {
      query = query.eq("status", params.status);
    }
    if (params.model) {
      query = query.eq("model", params.model);
    }
    if (params.station_id) {
      query = query.eq("station_id", params.station_id);
    }
    if (params.review_status) {
      query = query.eq("review_status", params.review_status);
    }
    if (params.date_from) {
      query = query.gte("captured_at", params.date_from);
    }
    if (params.date_to) {
      query = query.lte("captured_at", params.date_to);
    }
    if (params.search) {
      query = query.or(`source.ilike.%${params.search}%,station_id.ilike.%${params.search}%,model.ilike.%${params.search}%`);
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

    let filteredItems = items;
    if (params.defect_class) {
      filteredItems = items.filter((_, idx) => {
        const defects = data?.[idx]?.defects || [];
        return defects.some((d: any) => (d.class || d.cls) === params.defect_class);
      });
    }

    return {
      items: filteredItems,
      total: count ?? filteredItems.length,
    };
  } catch (err) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set("status", params.status);
    if (params.model) searchParams.set("model", params.model);
    if (params.search) searchParams.set("search", params.search);
    if (params.limit !== undefined) searchParams.set("limit", params.limit.toString());
    if (params.offset !== undefined) searchParams.set("offset", params.offset.toString());
    const q = searchParams.toString();
    return apiFetch<InspectionListApiResponse>(`/inspections${q ? `?${q}` : ""}`);
  }
}

export async function getInspectionDetail(id: string): Promise<InspectionDetail> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("inspections")
      .select("*, defects(*), reviews(*)")
      .eq("id", id)
      .single();

    if (error || !data) throw error || new Error("Inspection not found");

    const defects = (data.defects || []).map((d: any) => {
      const box = Array.isArray(d.box_2d) ? d.box_2d : [0, 0, 0, 0];
      return {
        id: d.id,
        class: d.class || d.cls || "defect",
        confidence: d.confidence ?? 0.9,
        severity: d.severity || "Moderate",
        box_x1: d.box_x1 ?? box[0] ?? 0,
        box_y1: d.box_y1 ?? box[1] ?? 0,
        box_x2: d.box_x2 ?? box[2] ?? 0,
        box_y2: d.box_y2 ?? box[3] ?? 0,
      };
    });

    const reviews = (data.reviews || []).map((r: any) => ({
      id: r.id,
      inspection_id: r.inspection_id,
      automated_result: data.status,
      review_decision: r.review_decision || r.status || "CONFIRM",
      final_result: r.final_result || data.status,
      reviewer_email: r.reviewer_email || r.inspector_email || "reviewer@example.com",
      justification: r.justification || r.notes || "",
      notes: r.notes,
      created_at: r.reviewed_at || r.created_at || new Date().toISOString(),
    }));

    return {
      id: data.id,
      captured_at: data.captured_at,
      source: data.source || data.source_image_name || "capture.jpg",
      image_url: data.image_url || data.image_path || "",
      annotated_url: data.annotated_url || data.annotated_image_path || data.image_url || "",
      model: data.model || "yolov8s",
      status: data.status,
      station_id: data.station_id || "STATION-01",
      created_at: data.captured_at,
      defects,
      reviews,
      review_status: data.review_status || "UNREVIEWED",
      final_status: data.final_status || data.status,
    };
  } catch {
    return apiFetch<InspectionDetail>(`/inspections/${id}`);
  }
}
