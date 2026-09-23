import { apiFetch } from "./client";
import { InspectionListApiResponse, InspectionListParams } from "@/types/api";
import { InspectionDetail } from "@/types/models";

export async function getInspections(params: InspectionListParams = {}): Promise<InspectionListApiResponse> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.model) searchParams.set("model", params.model);
  if (params.date_from) searchParams.set("date_from", params.date_from);
  if (params.date_to) searchParams.set("date_to", params.date_to);
  if (params.defect_class) searchParams.set("defect_class", params.defect_class);
  if (params.station_id) searchParams.set("station_id", params.station_id);
  if (params.review_status) searchParams.set("review_status", params.review_status);
  if (params.search) searchParams.set("search", params.search);
  if (params.limit !== undefined) searchParams.set("limit", params.limit.toString());
  if (params.offset !== undefined) searchParams.set("offset", params.offset.toString());

  const query = searchParams.toString();
  const endpoint = `/inspections${query ? `?${query}` : ""}`;
  return apiFetch<InspectionListApiResponse>(endpoint);
}

export async function getInspectionDetail(id: string): Promise<InspectionDetail> {
  return apiFetch<InspectionDetail>(`/inspections/${id}`);
}
