import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://pcb-fault-detection-system.vercel.app";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

/**
 * Resolves all active admin email addresses from Supabase users directory.
 */
async function resolveAdminRecipients(requestedRecipient?: string): Promise<string[]> {
  const recipients = new Set<string>();

  if (requestedRecipient && requestedRecipient.trim()) {
    for (const r of requestedRecipient.split(",")) {
      const clean = r.trim().toLowerCase();
      if (clean && clean.includes("@")) {
        recipients.add(clean);
      }
    }
  }

  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ejlsltjncguqggajpmlt.supabase.co";
    const supabaseKey =
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "sb_publishable_4eMC4L7COkOGg0kKjBePmA_j0HZouKv";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: admins, error } = await supabase
      .from("users")
      .select("email, role, is_active")
      .eq("role", "admin")
      .eq("is_active", true);

    if (!error && admins && admins.length > 0) {
      for (const a of admins) {
        if (a.email && a.email.includes("@") && !a.email.toLowerCase().includes("@example.com")) {
          recipients.add(a.email.trim().toLowerCase());
        }
      }
    }
  } catch (err) {
    console.warn("[Admin Recipient Lookup Warning]", err);
  }

  const envAdmin = (process.env.ADMIN_NOTIFICATION_EMAIL || "").trim().toLowerCase();
  if (envAdmin && envAdmin.includes("@") && !envAdmin.includes("@example.com")) {
    recipients.add(envAdmin);
  }

  return Array.from(recipients);
}


export async function GET() {
  // Query backend SMTP status
  try {
    const res = await fetch(`${BACKEND_URL.replace(/\/+$/, "")}/notifications/email`, {
      method: "GET",
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        ...data,
        backend_reachable: true,
      });
    }
  } catch {
    // Backend offline / unreachable, fallback to direct inspection
  }

  const adminRecipients = await resolveAdminRecipients();
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const user = process.env.SMTP_USER || "";
  const fromEmail = process.env.SMTP_FROM || user || "";
  const isConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD);

  return NextResponse.json({
    status: "ok",
    backend_reachable: false,
    smtp_configured: isConfigured,
    from_email: fromEmail,
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    admin_recipients: adminRecipients,
    total_admins: adminRecipients.length,
    primary_admin: adminRecipients[0] || null,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action || "inspection_failed";

    // Direct single-recipient verification email
    if (action === "user_verification") {
      const recipient = body.recipient?.trim().toLowerCase();
      if (!recipient || !body.action_link) {
        return NextResponse.json(
          { error: "Recipient email and action_link are required for user verification." },
          { status: 400 }
        );
      }
      try {
        const backendRes = await fetch(
          `${BACKEND_URL.replace(/\/+$/, "")}/notifications/email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "user_verification",
              recipient,
              action_link: body.action_link,
              role: body.role || "engineer",
            }),
          }
        );
        const data = await backendRes.json();
        if (!backendRes.ok) {
          return NextResponse.json(
            { error: data.detail || data.error || "Failed to dispatch verification email." },
            { status: backendRes.status }
          );
        }
        return NextResponse.json({
          success: true,
          message: `Verification email dispatched to ${recipient}`,
        });
      } catch (err: any) {
        return NextResponse.json(
          { error: `Could not reach backend email service: ${err.message}` },
          { status: 503 }
        );
      }
    }

    const recipients = await resolveAdminRecipients(body.recipient);

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No active admin accounts found in the database directory." },
        { status: 400 }
      );
    }


    // Forward dispatch to the reusable SMTP email service on FastAPI backend
    try {
      const backendRes = await fetch(
        `${BACKEND_URL.replace(/\/+$/, "")}/notifications/email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            recipient: recipients.join(", "),
            inspection: body.inspection,
          }),
        }
      );

      const data = await backendRes.json();
      if (!backendRes.ok) {
        return NextResponse.json(
          { error: data.detail || data.error || "Failed to dispatch email via SMTP service." },
          { status: backendRes.status }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          data.message ||
          (action === "test"
            ? `Test email dispatched to admins (${recipients.join(", ")}) via SMTP`
            : `Defect notification dispatched to admins (${recipients.join(", ")}) via SMTP`),
        recipients,
      });
    } catch (networkErr: any) {
      return NextResponse.json(
        {
          error: `Could not reach backend SMTP email service at ${BACKEND_URL}. Ensure the backend service is running. Details: ${networkErr.message}`,
        },
        { status: 503 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to dispatch email via SMTP service" },
      { status: 500 }
    );
  }
}
