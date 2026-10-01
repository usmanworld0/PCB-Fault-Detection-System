import { getSupabase } from "@/lib/supabase";
import { apiFetch, setStoredToken, getStoredToken } from "./client";
import { LoginResponse } from "@/types/api";
import type { User, UserRole } from "@/types/models";

export async function login(email: string, password: string): Promise<LoginResponse> {
  const inputEmail = email.trim().toLowerCase();
  const supabase = getSupabase();
  const adminNotificationEmail = (
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    "world.usman.business@gmail.com"
  ).toLowerCase();

  // Support typing "admin" as username by mapping to known admin email candidates
  const candidateEmails =
    inputEmail === "admin"
      ? [adminNotificationEmail, "231560@students.au.edu.pk", "admin@example.com"]
      : [inputEmail];

  let lastAuthError: any = null;

  for (const candidate of candidateEmails) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: candidate,
        password,
      });

      if (!authError && authData.session && authData.user) {
        const user = authData.user;
        const normEmail = (user.email || candidate).toLowerCase();

        // 1. Authoritative check: database public.users table
        let role: UserRole | undefined = undefined;
        try {
          const { data: row } = await supabase
            .from("users")
            .select("role")
            .eq("email", normEmail)
            .single();
          if (row?.role) {
            role = row.role as UserRole;
          }
        } catch {
          // ignore table query error
        }

        // 2. Default fallback to admin for primary operator if not set in database
        if (!role && (normEmail === adminNotificationEmail || normEmail === "admin@example.com")) {
          role = "admin";
        }

        // 3. Metadata fallback
        if (!role) {
          role = (user.app_metadata?.role || user.user_metadata?.role || "engineer") as UserRole;
        }

        const token = authData.session.access_token;
        setStoredToken(token);

        return {
          access_token: token,
          token_type: "bearer",
          role: role || "engineer",
          user_id: user.id,
          email: normEmail,
        };
      }

      if (authError) {
        lastAuthError = authError;
      }
    } catch (err: any) {
      if (err && err.message && !err.message.includes("fetch")) {
        lastAuthError = err;
      }
    }
  }

  // 2. Secondary: REST API endpoint (if backend is running)
  try {
    const data = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: candidateEmails[0], password }),
    });
    setStoredToken(data.access_token);
    return data;
  } catch (apiErr: any) {
    throw new Error(lastAuthError?.message || "Invalid email or password.");
  }
}

export async function getMe(): Promise<User> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const supabase = getSupabase();
  const adminNotificationEmail = (
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    "world.usman.business@gmail.com"
  ).toLowerCase();

  // 1. Primary: Native Supabase Auth session
  try {
    let authUser: any = null;

    // Check active session first
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      authUser = sessionData.session.user;
    } else {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        authUser = data.user;
      }
    }

    if (authUser && authUser.email) {
      const normEmail = authUser.email.toLowerCase();
      let role: UserRole | undefined = undefined;
      let avatarUrl = (authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture) as string | undefined;

      // Check database row (authoritative source)
      try {
        const { data: row } = await supabase
          .from("users")
          .select("role, avatar_url")
          .eq("email", normEmail)
          .single();
        if (row) {
          if (row.role) role = row.role as UserRole;
          if (row.avatar_url) avatarUrl = row.avatar_url;
        }
      } catch {
        // Ignored if table not accessible
      }

      // Check configured admin email as default fallback if not set in database
      if (!role && (normEmail === adminNotificationEmail || normEmail === "admin@example.com")) {
        role = "admin";
      }

      if (!role) {
        role = (authUser.app_metadata?.role || authUser.user_metadata?.role || "engineer") as UserRole;
      }

      // Check localStorage for offline/cached avatar
      if (!avatarUrl && typeof window !== "undefined") {
        avatarUrl =
          localStorage.getItem(`pcb_avatar_${authUser.id}`) ||
          localStorage.getItem(`pcb_avatar_${normEmail}`) ||
          localStorage.getItem("pcb_current_avatar") ||
          undefined;
      }

      return {
        id: authUser.id,
        email: normEmail,
        role: role || "engineer",
        is_active: true,
        created_at: authUser.created_at,
        avatar_url: avatarUrl || null,
      };
    }
  } catch {
    // Continue to fallback
  }

  // 2. Try backend API
  try {
    return await apiFetch<User>("/auth/me");
  } catch {
    // 3. Fallback: Decode session token if locally signed session
    if (token.startsWith("pcb_session_")) {
      try {
        const payload = JSON.parse(atob(token.replace("pcb_session_", "")));
        if (payload.exp && Date.now() > payload.exp) {
          throw new Error("Session expired");
        }
        const localAvatar = typeof window !== "undefined"
          ? (localStorage.getItem(`pcb_avatar_${payload.id}`) ||
             localStorage.getItem(`pcb_avatar_${payload.email}`) ||
             localStorage.getItem("pcb_current_avatar") || null)
          : null;
        return {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          is_active: true,
          created_at: new Date().toISOString(),
          avatar_url: localAvatar,
        };
      } catch {
        throw new Error("Invalid session");
      }
    }

    // Never return a broken mock admin that prevents data loading.
    // Throw so that AuthContext clears invalid credentials and allows clean sign-in.
    throw new Error("Session expired. Please sign in again.");
  }
}

export async function logout(): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
  setStoredToken(null);
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

/**
 * Initiates the Forgot Password recovery flow via Supabase Auth.
 * Supabase sends an email containing a secure password reset link pointing to /reset-password.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const normEmail = email.trim().toLowerCase();
  if (!normEmail) {
    throw new Error("Please enter your registered email address.");
  }

  const supabase = getSupabase();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/reset-password`
      : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(normEmail, {
    redirectTo,
  });

  if (error) {
    throw new Error(error.message || "Failed to send password reset email.");
  }
}

/**
 * Updates the user's password using Supabase Auth.
 * Enforces strong password requirements.
 */
export async function updateUserPassword(newPassword: string): Promise<void> {
  if (!newPassword) {
    throw new Error("Password is required.");
  }

  // Validate strong password requirements
  const { checkPasswordStrength } = await import("@/lib/utils/password");
  const check = checkPasswordStrength(newPassword);
  if (!check.isValid) {
    throw new Error(check.errorMessage || "Password does not meet strong password requirements.");
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message || "Failed to update password.");
  }
}

/**
 * Updates the user's profile picture across Supabase Auth user_metadata,
 * public.users table, and browser cache.
 */
export async function updateUserAvatar(avatarUrl: string): Promise<string> {
  if (typeof window !== "undefined") {
    localStorage.setItem("pcb_current_avatar", avatarUrl);
  }

  const supabase = getSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (typeof window !== "undefined") {
        localStorage.setItem(`pcb_avatar_${user.id}`, avatarUrl);
        if (user.email) {
          localStorage.setItem(`pcb_avatar_${user.email}`, avatarUrl);
        }
      }

      // Update Supabase Auth user_metadata
      await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
      });

      // Attempt updating public.users table as well
      try {
        await supabase
          .from("users")
          .update({ avatar_url: avatarUrl })
          .eq("id", user.id);
      } catch {
        // Ignored if column doesn't exist
      }
    }
  } catch (err) {
    console.warn("Could not sync avatar to Supabase metadata:", err);
  }

  return avatarUrl;
}


