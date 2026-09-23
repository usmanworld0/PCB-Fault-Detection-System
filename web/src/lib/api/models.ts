import { getSupabase } from "@/lib/supabase";
import { apiFetch } from "./client";
import { ModelMetric } from "@/types/models";

export async function getModels(): Promise<ModelMetric[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("models")
      .select("*")
      .order("map50", { ascending: false });
    if (error) throw error;
    return (data || []).map((m: any) => ({
      id: m.id || m.name,
      name: m.name,
      arch: m.arch,
      dataset: m.dataset,
      map50: m.map50,
      map50_95: m.map50_95,
      precision: m.precision,
      recall: m.recall,
      f1: m.f1,
      cpu_ms: m.cpu_ms,
      metrics_json: m.metrics_json || {},
      uploaded_at: m.created_at || m.uploaded_at || new Date().toISOString(),
    }));
  } catch {
    return apiFetch<ModelMetric[]>("/models");
  }
}
