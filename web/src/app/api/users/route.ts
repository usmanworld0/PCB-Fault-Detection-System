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

    // 1. Create or ensure in Supabase Auth (email_confirm: false enforces verification)
    let authUserId: string | null = null;
    const { data: createData, error: authCreateErr } =
      await supabase.auth.admin.createUser({
        email: normEmail,
        password,
        email_confirm: false, // User must verify via email link
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

    // 2. Generate secure email verification action link
    const appBaseUrl = (
      process.env.NEXT_PUBLIC_APP_URL || "https://pcb-fault-detection-system.vercel.app"
    ).replace(/\/+$/, "");
    const redirectUrl = `${appBaseUrl}/reset-password`;

    let verificationLink: string | null = null;
    try {
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: "signup",
        email: normEmail,
        password,
        options: {
          redirectTo: redirectUrl,
          data: { role },
        },
      });
      if (linkData?.properties?.action_link) {
        verificationLink = linkData.properties.action_link;
      }
    } catch (linkErr) {
      console.warn("Could not generate verification link via signup:", linkErr);
    }

    if (!verificationLink) {
      try {
        const { data: magicLinkData } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: normEmail,
          options: {
            redirectTo: redirectUrl,
            data: { role },
          },
        });
        if (magicLinkData?.properties?.action_link) {
          verificationLink = magicLinkData.properties.action_link;
        }
      } catch (mErr) {
        console.warn("Could not generate magiclink:", mErr);
      }
    }

    // 3. Dispatch verification email with action link via SMTP
    if (verificationLink) {
      const backendApiUrl =
        process.env.BACKEND_API_URL ||
        process.env.API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8000";

      try {
        await fetch(`${backendApiUrl.replace(/\/+$/, "")}/notifications/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "user_verification",
            recipient: normEmail,
            action_link: verificationLink,
            role,
          }),
        });
      } catch (emailSendErr) {
        console.warn("Could not dispatch verification email via backend SMTP:", emailSendErr);
      }
    }

    // 4. Insert or update in public.users
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
