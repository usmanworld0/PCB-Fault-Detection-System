import { apiFetch } from "./client";
import { InspectionListApiResponse, ReviewQueueParams, ReviewSubmitPayload } from "@/types/api";
import { Review } from "@/types/models";

export async function getReviewQueue(params: ReviewQueueParams = {}): Promise<InspectionListApiResponse> {
  const searchParams = new URLSearchParams();
  if (params.filter_status) searchParams.set("filter_status", params.filter_status);
  if (params.limit !== undefined) searchParams.set("limit", params.limit.toString());
  if (params.offset !== undefined) searchParams.set("offset", params.offset.toString());

  const query = searchParams.toString();
  return apiFetch<InspectionListApiResponse>(`/reviews${query ? `?${query}` : ""}`);
}

export async function submitReview(payload: ReviewSubmitPayload): Promise<Review> {
  return apiFetch<Review>("/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getInspectionReviews(inspectionId: string): Promise<Review[]> {
  return apiFetch<Review[]>(`/reviews/${inspectionId}`);
}
