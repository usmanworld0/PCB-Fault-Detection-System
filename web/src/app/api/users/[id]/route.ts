import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    const body = await request.json();
    const { role, is_active, avatar_url } = body;

    const supabase = getSupabaseServer();

    // 1. Fetch existing user record to obtain email and current id
    const { data: existingUser, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !existingUser) {
      return NextResponse.json(
        { error: "User not found in system directory" },
        { status: 404 }
      );
    }

    // 2. Prepare database update payload
    const updatePayload: Record<string, any> = {};
    if (role !== undefined) updatePayload.role = role;
    if (is_active !== undefined) updatePayload.is_active = is_active;
    if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url;

    const { data: updatedDbUser, error: updateError } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updatedDbUser) {
      return NextResponse.json(
        { error: updateError?.message || "Failed to update database record" },
        { status: 500 }
      );
    }

    // 3. Keep Supabase Auth (auth.users metadata) strictly synchronized
    try {
      const { data: authList } = await supabase.auth.admin.listUsers();
      const authUser = authList?.users?.find(
        (u) => u.email?.toLowerCase() === existingUser.email?.toLowerCase()
      );

      if (authUser && role !== undefined) {
        await supabase.auth.admin.updateUserById(authUser.id, {
          user_metadata: {
            ...(authUser.user_metadata || {}),
            role,
          },
          app_metadata: {
            ...(authUser.app_metadata || {}),
            role,
          },
        });
      }
    } catch (authErr) {
      console.warn("Could not sync role to auth.users:", authErr);
    }

    return NextResponse.json(updatedDbUser);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    const supabase = getSupabaseServer();

    // 1. Get user email before deletion
    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("id", id)
      .single();

    // 2. Delete from public.users table
    const { error: dbDeleteErr } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (dbDeleteErr) {
      return NextResponse.json(
        { error: dbDeleteErr.message },
        { status: 500 }
      );
    }

    // 3. Also delete from auth.users if matched
    if (existingUser?.email) {
      try {
        const { data: authList } = await supabase.auth.admin.listUsers();
        const authUser = authList?.users?.find(
          (u) => u.email?.toLowerCase() === existingUser.email?.toLowerCase()
        );
        if (authUser) {
          await supabase.auth.admin.deleteUser(authUser.id);
        }
      } catch (authErr) {
        console.warn("Could not delete from auth.users:", authErr);
      }
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
