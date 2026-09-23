import { getSupabase } from "@/lib/supabase";
import { apiFetch } from "./client";
import { UserCreatePayload, UserUpdatePayload } from "@/types/api";
import { User } from "@/types/models";

export async function getUsers(): Promise<User[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, is_active, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch {
    return apiFetch<User[]>("/users");
  }
}

export async function createUser(payload: UserCreatePayload): Promise<User> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("users")
      .insert({
        email: payload.email.toLowerCase(),
        password_hash: "direct_managed",
        role: payload.role,
        is_active: true,
      })
      .select()
      .single();
    if (error || !data) throw error;
    return data;
  } catch {
    return apiFetch<User>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}

export async function updateUser(userId: string, payload: UserUpdatePayload): Promise<User> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("users")
      .update(payload)
      .eq("id", userId)
      .select()
      .single();
    if (error || !data) throw error;
    return data;
  } catch {
    return apiFetch<User>(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }
}
