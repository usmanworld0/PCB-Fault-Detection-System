import { apiFetch, setStoredToken } from "./client";
import { LoginResponse } from "@/types/api";
import { User } from "@/types/models";

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setStoredToken(data.access_token);
  return data;
}

export async function getMe(): Promise<User> {
  return apiFetch<User>("/auth/me");
}

export function logout(): void {
  setStoredToken(null);
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
