import { getSupabase } from "@/lib/supabase";
import { UserCreatePayload, UserUpdatePayload } from "@/types/api";
import { User } from "@/types/models";
import { checkPasswordStrength } from "@/lib/utils/password";

export async function getUsers(): Promise<User[]> {
  let users: User[] = [];

  // 1. Primary: Next.js internal API (auto-syncs auth.users with public.users)
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        users = await res.json();
      }
    } catch {
      // Fallback below
    }
  }

  // 2. Fallback: Direct Supabase client query
  if (users.length === 0) {
    try {
      const supabase = getSupabase();
      let res: any = await supabase
        .from("users")
        .select("id, email, role, is_active, created_at, avatar_url")
        .order("created_at", { ascending: false });

      if (res.error) {
        res = await supabase
          .from("users")
          .select("id, email, role, is_active, created_at")
          .order("created_at", { ascending: false });
      }
      users = (res.data || []) as User[];
    } catch {
      users = [];
    }
  }

  // Populate avatar_url from localStorage if available
  if (typeof window !== "undefined") {
    users = users.map((u) => {
      const cached =
        localStorage.getItem(`pcb_avatar_${u.id}`) ||
        localStorage.getItem(`pcb_avatar_${u.email}`);
      return {
        ...u,
        avatar_url: u.avatar_url || cached || null,
      };
    });
  }

  return users;
}

export async function createUser(payload: UserCreatePayload): Promise<User> {
  const normEmail = payload.email.trim().toLowerCase();
  const password = payload.password?.trim() || "";

  const strength = checkPasswordStrength(password);
  if (!strength.isValid) {
    throw new Error(
      strength.errorMessage ||
        "Password must be at least 8 characters long, including uppercase, lowercase, numbers, and special symbols."
    );
  }

  // 1. Primary: Server-side API provisioner (maintains matching auth ID and DB record)
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normEmail,
          password,
          role: payload.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create user account.");
      }
      return data as User;
    } catch (apiErr: any) {
      if (apiErr?.message && !apiErr.message.includes("fetch")) {
        throw apiErr;
      }
    }
  }

  // 2. Client-side fallback via Supabase client
  const supabase = getSupabase();
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

  const { data, error } = await supabase
    .from("users")
    .upsert({
      email: normEmail,
      password_hash: "supabase_auth",
      role: payload.role,
      is_active: true,
      created_at: new Date().toISOString(),
    }, { onConflict: "email" })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create user record.");
  }
  return data;
}

export async function updateUser(userId: string, payload: UserUpdatePayload): Promise<User> {
  if (payload.avatar_url && typeof window !== "undefined") {
    localStorage.setItem(`pcb_avatar_${userId}`, payload.avatar_url);
  }

  // 1. Primary: Server API route (updates database AND synchronizes Supabase Auth metadata)
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return (await res.json()) as User;
      }
    } catch {
      // Fall through to direct Supabase update
    }
  }

  // 2. Direct Supabase update fallback
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", userId)
    .select()
    .single();

  if (error || !data) throw error || new Error("Failed to update user");
  return data;
}

export async function deleteUser(userId: string): Promise<void> {
  // 1. Primary: Server API route (removes from database AND Supabase Auth)
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) return;
    } catch {
      // Fall through to direct Supabase delete
    }
  }

  // 2. Direct Supabase delete fallback
  const supabase = getSupabase();
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  if (error) throw error;
}
