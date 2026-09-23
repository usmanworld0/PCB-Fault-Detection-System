import { apiFetch } from "./client";
import { ModelMetric } from "@/types/models";

export async function getModels(): Promise<ModelMetric[]> {
  return apiFetch<ModelMetric[]>("/models");
}
