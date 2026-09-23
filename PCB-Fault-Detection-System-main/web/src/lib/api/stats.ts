import { apiFetch } from "./client";
import { Stats } from "@/types/models";

export async function getStats(): Promise<Stats> {
  return apiFetch<Stats>("/stats");
}
