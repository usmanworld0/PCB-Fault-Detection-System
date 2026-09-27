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
  const normEmail = payload.email.trim().toLowerCase();
  const supabase = getSupabase();
  const password = payload.password?.trim();

  if (!password || password.length < 6) {
    throw new Error("A valid password of at least 6 characters is required.");
  }

  // 1. Provision user in native Supabase Authentication (auth.users)
  try {
    const { error: signUpError } = await supabase.auth.signUp({
      email: normEmail,
      password: password,
      options: {
        data: { role: payload.role },
      },
    });
    if (signUpError && signUpError.message && !signUpError.message.includes("already registered")) {
      throw new Error(signUpError.message);
    }
  } catch (err: any) {
    if (err && err.message && !err.message.includes("fetch")) {
      throw err;
    }
  }

  // 2. Insert user into database table (public.users)
  try {
    const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined;
    const insertPayload: any = {
      email: normEmail,
      password_hash: "supabase_auth",
      role: payload.role,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    if (newId) {
      insertPayload.id = newId;
    }

    const { data, error } = await supabase
      .from("users")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error(`An account with email '${normEmail}' already exists.`);
      }
      throw new Error(error.message || "Failed to create user record.");
    }
    if (!data) {
      throw new Error("Failed to create user record in Supabase.");
    }
    return data;
  } catch (err: any) {
    if (err && err.message && !err.message.includes("fetch")) {
      throw err;
    }
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
  } catch (err: any) {
    if (err && err.message && !err.message.includes("fetch")) {
      throw err;
    }
    return apiFetch<User>(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }
}
