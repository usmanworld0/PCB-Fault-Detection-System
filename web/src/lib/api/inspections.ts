import { getSupabase } from "@/lib/supabase";
import { apiFetch } from "./client";
import { getMe } from "./auth";
import { InspectionListApiResponse, InspectionListParams } from "@/types/api";
import { InspectionDetail, InspectionListItem, User } from "@/types/models";

/**
 * Helper to resolve current user's email and admin status
 */
async function resolveCurrentUserInfo(params?: InspectionListParams): Promise<{ email?: string; isAdmin: boolean; isInspector: boolean }> {
  const adminNotificationEmail = (
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    "world.usman.business@gmail.com"
  ).toLowerCase();

  let role = params?.current_user_role;
  let email: string | undefined = undefined;

  try {
    const me: User = await getMe();
    email = me.email?.toLowerCase();
    role = role || me.role;
  } catch {
    // If not authenticated or cannot fetch user, check supabase session
    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;
      if (user?.email) {
        email = user.email.toLowerCase();
        role = role || user.app_metadata?.role || user.user_metadata?.role;
      }
    } catch {
      // ignore
    }
  }

  const isAdmin = role === "admin" || (email ? email === adminNotificationEmail : false);
  const isInspector = role === "inspector";

  return { email, isAdmin, isInspector };
}

export async function getInspections(params: InspectionListParams = {}): Promise<InspectionListApiResponse> {
  const { email: userEmail, isAdmin, isInspector } = await resolveCurrentUserInfo(params);

  try {
    const supabase = getSupabase();
    let query = supabase.from("inspections").select("*, defects(*)", { count: "exact" });

    // Role-based scoping: only isolated 'inspector' role is restricted to own records.
    // Admins, engineers, and viewers have plant-wide visibility to review and monitor inspections.
    if (isInspector && !isAdmin && userEmail) {
      query = query.ilike("operator_email", userEmail);
    } else if (params.operator_email) {
      // Explicit operator filter chosen by the user
      query = query.ilike("operator_email", params.operator_email);
    }

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
    if (params.pcb_id) {
      query = query.eq("pcb_id", params.pcb_id);
    }
    if (params.search) {
      query = query.or(`source.ilike.%${params.search}%,station_id.ilike.%${params.search}%,model.ilike.%${params.search}%,pcb_id.ilike.%${params.search}%`);
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
      annotated_url: row.annotated_url || row.annotated_image_path || row.image_url || "",
      source: row.source || row.source_image_name || "capture.jpg",
      station_id: row.station_id || "STATION-01",
      review_status: row.review_status || "UNREVIEWED",
      final_status: row.final_status || row.status,
      operator_email: row.operator_email,
      operator_role: row.operator_role,
      pcb_id: row.pcb_id || undefined,
      image_index: row.image_index ?? 1,
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
    try {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.set("status", params.status);
      if (params.model) searchParams.set("model", params.model);
      if (params.search) searchParams.set("search", params.search);
      if (params.limit !== undefined) searchParams.set("limit", params.limit.toString());
      if (params.offset !== undefined) searchParams.set("offset", params.offset.toString());
      const q = searchParams.toString();
      return await apiFetch<InspectionListApiResponse>(`/inspections${q ? `?${q}` : ""}`);
    } catch {
      return { items: [], total: 0 };
    }
  }
}

export async function getInspectionDetail(id: string): Promise<InspectionDetail> {
  const { email: userEmail, isAdmin, isInspector } = await resolveCurrentUserInfo();

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("inspections")
      .select("*, defects(*)")
      .eq("id", id)
      .single();

    if (error || !data) throw error || new Error("Inspection not found");

    // Inspector ownership check (admin, engineer, viewer can view all plant inspections)
    if (isInspector && !isAdmin && userEmail) {
      const opEmail = data.operator_email?.toLowerCase();
      if (opEmail && opEmail !== userEmail) {
        throw new Error("You do not have permission to view this inspection.");
      }
    }

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
      reviews: [],
      review_status: data.review_status || "UNREVIEWED",
      final_status: data.final_status || data.status,
      operator_email: data.operator_email,
      operator_role: data.operator_role,
      pcb_id: data.pcb_id || undefined,
      image_index: data.image_index ?? 1,
    };
  } catch (err: any) {
    if (err?.message?.includes("permission")) {
      throw err;
    }
    return apiFetch<InspectionDetail>(`/inspections/${id}`);
  }
}

export async function getSubInspections(pcbId: string): Promise<InspectionListItem[]> {
  if (!pcbId) return [];
  const { email: userEmail, isAdmin, isInspector } = await resolveCurrentUserInfo();

  try {
    const supabase = getSupabase();
    let query = supabase
      .from("inspections")
      .select("*, defects(*)")
      .eq("pcb_id", pcbId);

    if (isInspector && !isAdmin && userEmail) {
      query = query.ilike("operator_email", userEmail);
    }

    const { data, error } = await query.order("image_index", { ascending: true });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      captured_at: row.captured_at,
      model: row.model || "yolov8s",
      status: row.status,
      defect_count: Array.isArray(row.defects) ? row.defects.length : (row.defect_count ?? 0),
      image_url: row.image_url || row.image_path || "",
      annotated_url: row.annotated_url || row.annotated_image_path || row.image_url || "",
      source: row.source || row.source_image_name || "capture.jpg",
      station_id: row.station_id || "STATION-01",
      review_status: row.review_status || "UNREVIEWED",
      final_status: row.final_status || row.status,
      operator_email: row.operator_email,
      operator_role: row.operator_role,
      pcb_id: row.pcb_id || undefined,
      image_index: row.image_index ?? 1,
    }));
  } catch {
    return [];
  }
}

export async function deleteInspection(id: string): Promise<void> {
  try {
    const supabase = getSupabase();
    // 1. Delete associated defects
    await supabase.from("defects").delete().eq("inspection_id", id);
    // 2. Delete inspection record
    const { error } = await supabase.from("inspections").delete().eq("id", id);
    if (error) throw error;
  } catch (err: any) {
    if (err && err.message && !err.message.includes("fetch")) {
      throw err;
    }
    return apiFetch<void>(`/inspections/${id}`, {
      method: "DELETE",
    });
  }
}

export async function deletePcbInspections(pcbId: string): Promise<void> {
  if (!pcbId) return;
  try {
    const supabase = getSupabase();
    // Find all inspections for this PCB ID
    const { data: list } = await supabase
      .from("inspections")
      .select("id")
      .eq("pcb_id", pcbId);

    const ids = (list || []).map((x: any) => x.id);
    if (ids.length > 0) {
      await supabase.from("defects").delete().in("inspection_id", ids);
    }
    const { error } = await supabase.from("inspections").delete().eq("pcb_id", pcbId);
    if (error) throw error;
  } catch (err: any) {
    if (err && err.message && !err.message.includes("fetch")) {
      throw err;
    }
    return apiFetch<void>(`/inspections?pcb_id=${encodeURIComponent(pcbId)}`, {
      method: "DELETE",
    });
  }
}

