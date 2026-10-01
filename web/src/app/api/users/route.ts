import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { checkPasswordStrength } from "@/lib/utils/password";

export async function GET() {
  try {
    const supabase = getSupabaseServer();

    // 1. Fetch from public.users table
    const { data: dbUsers, error: dbError } = await supabase
      .from("users")
      .select("id, email, role, is_active, created_at, avatar_url")
      .order("created_at", { ascending: false });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // 2. Check if any auth.users need auto-syncing into public.users
    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      const authUsers = authData?.users || [];
      const dbEmails = new Set((dbUsers || []).map((u) => u.email.toLowerCase()));

      const missingUsers = authUsers.filter(
        (au) => au.email && !dbEmails.has(au.email.toLowerCase())
      );

      if (missingUsers.length > 0) {
        for (const mu of missingUsers) {
          const role =
            mu.user_metadata?.role || mu.app_metadata?.role || "engineer";
          await supabase.from("users").upsert(
            {
              id: mu.id,
              email: mu.email!.toLowerCase(),
              password_hash: "supabase_auth",
              role,
              is_active: true,
              created_at: mu.created_at || new Date().toISOString(),
            },
            { onConflict: "email" }
          );
        }

        // Re-fetch synchronized list
        const { data: refreshedUsers } = await supabase
          .from("users")
          .select("id, email, role, is_active, created_at, avatar_url")
          .order("created_at", { ascending: false });

        return NextResponse.json(refreshedUsers || []);
      }
    } catch (syncErr) {
      console.warn("Auto-sync auth check skipped:", syncErr);
    }

    return NextResponse.json(dbUsers || []);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role = "engineer" } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normEmail = email.trim().toLowerCase();
    const strength = checkPasswordStrength(password);
    if (!strength.isValid) {
      return NextResponse.json(
        { error: strength.errorMessage || "Password does not meet requirements" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // 1. Create or ensure in Supabase Auth
    let authUserId: string | null = null;
    const { data: createData, error: authCreateErr } =
      await supabase.auth.admin.createUser({
        email: normEmail,
        password,
        email_confirm: true,
        user_metadata: { role },
        app_metadata: { role },
      });

    if (authCreateErr) {
      if (authCreateErr.message?.includes("already registered")) {
        // Find existing auth user ID
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users?.find(
          (u) => u.email?.toLowerCase() === normEmail
        );
        if (existing) {
          authUserId = existing.id;
          await supabase.auth.admin.updateUserById(existing.id, {
            password,
            user_metadata: { ...(existing.user_metadata || {}), role },
            app_metadata: { ...(existing.app_metadata || {}), role },
          });
        }
      } else {
        return NextResponse.json(
          { error: authCreateErr.message },
          { status: 400 }
        );
      }
    } else if (createData?.user) {
      authUserId = createData.user.id;
    }

    // 2. Insert or update in public.users
    const upsertPayload: Record<string, any> = {
      email: normEmail,
      password_hash: "supabase_auth",
      role,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    if (authUserId) {
      upsertPayload.id = authUserId;
    }

    const { data: newDbUser, error: dbErr } = await supabase
      .from("users")
      .upsert(upsertPayload, { onConflict: "email" })
      .select()
      .single();

    if (dbErr || !newDbUser) {
      return NextResponse.json(
        { error: dbErr?.message || "Failed to create database record" },
        { status: 500 }
      );
    }

    return NextResponse.json(newDbUser, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
