import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const RESEND_FROM = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  return new Resend(apiKey.trim());
}

/**
 * Resolves all active admin email addresses from Supabase users directory.
 */
async function resolveAdminRecipients(requestedRecipient?: string): Promise<string[]> {
  const recipients = new Set<string>();

  // If a specific recipient was explicitly provided (e.g. from UI settings), include it
  if (requestedRecipient && requestedRecipient.trim()) {
    recipients.add(requestedRecipient.trim().toLowerCase());
  }

  // Query Supabase for all users with role == 'admin' and is_active == true
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ejlsltjncguqggajpmlt.supabase.co";
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
        if (a.email && !a.email.toLowerCase().includes("@example.com")) {
          recipients.add(a.email.trim().toLowerCase());
        }
      }
    }
  } catch (err) {
    console.warn("[Admin Recipient Lookup Warning]", err);
  }

  return Array.from(recipients);
}

interface DefectItem {
  class: string;
  severity?: string;
  confidence?: number;
}

interface InspectionFailPayload {
  id: string;
  pcb_id?: string;
  station_id?: string;
  status: string;
  operator_email?: string;
  model?: string;
  defects?: DefectItem[];
  captured_at?: string;
}

function renderDefectEmailHtml(inspection: InspectionFailPayload, workstationUrl: string): string {
  const pcbLabel = inspection.pcb_id ? `PCB: ${inspection.pcb_id}` : `ID: #${inspection.id.slice(0, 8)}`;
  const defectCount = inspection.defects?.length || 0;
  const criticalCount =
    inspection.defects?.filter((d) => d.severity?.toLowerCase() === "critical").length || 0;

  const defectRows = (inspection.defects || [])
    .slice(0, 8)
    .map(
      (d, i) => `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 12px; font-size: 13px; color: #2D3748; font-weight: 600;">#${i + 1}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #2D3748; font-weight: bold; text-transform: uppercase;">${d.class}</td>
          <td style="padding: 10px 12px; font-size: 12px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-weight: bold; font-size: 11px; text-transform: uppercase; background: ${
              d.severity?.toLowerCase() === "critical" ? "#FFF5F5" : "#FFF8E6"
            }; color: ${d.severity?.toLowerCase() === "critical" ? "#E53E3E" : "#D69E2E"}; border: 1px solid ${
        d.severity?.toLowerCase() === "critical" ? "#FED7D7" : "#FEEBC8"
      };">
              ${d.severity || "Detected"}
            </span>
          </td>
          <td style="padding: 10px 12px; font-size: 13px; color: #319795; font-weight: bold;">
            ${d.confidence ? `${(d.confidence * 100).toFixed(1)}%` : "N/A"}
          </td>
        </tr>
      `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>PCB Defect Alert</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D3748;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.04);">
          <!-- Header Banner -->
          <tr>
            <td style="background: #1A202C; padding: 24px 32px; border-bottom: 3px solid #E53E3E;">
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: #4FD1C5;">
                      PCB Vision Automated Optical QA
                    </div>
                    <h1 style="margin: 6px 0 0 0; font-size: 20px; font-weight: bold; color: #FFFFFF;">
                      🚨 Inspection Failure Detected
                    </h1>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase; background: #E53E3E; color: #FFFFFF; letter-spacing: 0.5px;">
                      FAIL
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alert Introduction -->
          <tr>
            <td style="padding: 28px 32px 16px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4A5568;">
                An automated vision optical scan has flagged a <strong>defective board</strong> on the production line. The inspection concluded with an overall disposition of <strong style="color: #E53E3E;">FAIL</strong>.
              </p>

              <!-- Key Telemetry Grid -->
              <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0 20px 0; border: 1px solid #EDF2F7; border-radius: 12px; background: #F8F9FA;">
                <tr>
                  <td style="padding: 14px 16px; border-right: 1px solid #EDF2F7; border-bottom: 1px solid #EDF2F7;" width="50%">
                    <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #A0AEC0; letter-spacing: 0.5px;">PCB Unique ID</div>
                    <div style="font-size: 14px; font-weight: bold; color: #2D3748; margin-top: 2px;">${pcbLabel}</div>
                  </td>
                  <td style="padding: 14px 16px; border-bottom: 1px solid #EDF2F7;" width="50%">
                    <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #A0AEC0; letter-spacing: 0.5px;">Station ID</div>
                    <div style="font-size: 14px; font-weight: bold; color: #2D3748; margin-top: 2px;">${inspection.station_id || "STATION-01"}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; border-right: 1px solid #EDF2F7;" width="50%">
                    <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #A0AEC0; letter-spacing: 0.5px;">AI Model Engine</div>
                    <div style="font-size: 13px; font-weight: bold; color: #4FD1C5; margin-top: 2px;">${inspection.model || "YOLOv8"}</div>
                  </td>
                  <td style="padding: 14px 16px;" width="50%">
                    <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #A0AEC0; letter-spacing: 0.5px;">Defects Found</div>
                    <div style="font-size: 14px; font-weight: bold; color: #E53E3E; margin-top: 2px;">
                      ${defectCount} defect${defectCount === 1 ? "" : "s"} (${criticalCount} critical)
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Defect Breakdown Table -->
          ${
            defectCount > 0
              ? `
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #2D3748; letter-spacing: 0.5px; margin-bottom: 8px;">
                Localized Defect Breakdown:
              </div>
              <table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: #EDF2F7; text-align: left;">
                    <th style="padding: 8px 12px; font-size: 10px; font-weight: bold; color: #718096; text-transform: uppercase;">#</th>
                    <th style="padding: 8px 12px; font-size: 10px; font-weight: bold; color: #718096; text-transform: uppercase;">Category</th>
                    <th style="padding: 8px 12px; font-size: 10px; font-weight: bold; color: #718096; text-transform: uppercase;">Severity</th>
                    <th style="padding: 8px 12px; font-size: 10px; font-weight: bold; color: #718096; text-transform: uppercase;">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  ${defectRows}
                </tbody>
              </table>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Workstation CTA Button -->
          <tr>
            <td align="center" style="padding: 8px 32px 32px 32px;">
              <a href="${workstationUrl}" target="_blank" style="display: inline-block; background-color: #4FD1C5; color: #FFFFFF; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 2px 8px rgba(79, 209, 197, 0.35);">
                Open In Inspection Workstation &rarr;
              </a>
              <div style="margin-top: 14px; font-size: 11px; color: #A0AEC0;">
                UID: ${inspection.id} &bull; Operator: ${inspection.operator_email || "System Auto"}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F8F9FA; padding: 20px 32px; border-top: 1px solid #EDF2F7; text-align: center; font-size: 11px; color: #A0AEC0; line-height: 1.5;">
              You received this automated security notification because email alerts for failed inspections are enabled in PCB Vision.
              <br>
              To update notification preferences, manage settings in the <a href="${APP_URL}/notifications" style="color: #4FD1C5; text-decoration: none;">Station Alerts</a> dashboard.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function GET() {
  const adminRecipients = await resolveAdminRecipients();
  const isConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim());
  return NextResponse.json({
    status: "ok",
    resend_configured: isConfigured,
    from_email: RESEND_FROM,
    admin_recipients: adminRecipients,
    total_admins: adminRecipients.length,
    primary_admin: adminRecipients[0] || null,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action || "inspection_failed";
    const recipients = await resolveAdminRecipients(body.recipient);

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No active admin accounts found in the database directory." },
        { status: 400 }
      );
    }

    const resend = getResendClient();
    if (!resend) {
      return NextResponse.json(
        { error: "Resend API key is not configured. Please set RESEND_API_KEY in your environment." },
        { status: 503 }
      );
    }

    // Action 1: Send Test Email
    if (action === "test") {
      const { data, error } = await resend.emails.send({
        from: RESEND_FROM,
        to: recipients,
        subject: "🔔 [TEST] PCB Vision Resend Email Notifications Connected",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #2D3748; max-width: 540px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 14px; background: #FFFFFF;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
              <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #4FD1C5;"></span>
              <h2 style="margin: 0; font-size: 18px; color: #2D3748;">PCB Vision Admin Notifications Test</h2>
            </div>
            <p style="font-size: 14px; line-height: 1.6; color: #718096;">
              Congrats on sending your <strong>test notification</strong> from the PCB Vision automated inspection platform!
            </p>
            <div style="background: #F8F9FA; padding: 12px 16px; border-radius: 10px; border: 1px solid #EDF2F7; margin: 16px 0; font-size: 12px;">
              <strong>Trigger Mode:</strong> Inspection Failures (Defective Boards)<br>
              <strong>Admin Recipients (${recipients.length}):</strong> ${recipients.join(", ")}<br>
              <strong>Dispatched Via:</strong> Resend API
            </div>
            <p style="font-size: 12px; color: #A0AEC0; margin-top: 16px;">
              Automated notifications will now be dispatched to all active admins whenever an optical board scan fails.
            </p>
          </div>
        `,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Test email dispatched to all admins (${recipients.join(", ")})`,
        id: data?.id,
        recipients,
      });
    }

    // Action 2: Send Inspection Failure / Defective Board Alert
    const inspection: InspectionFailPayload = body.inspection;
    if (!inspection || !inspection.id) {
      return NextResponse.json(
        { error: "Missing inspection payload with id" },
        { status: 400 }
      );
    }

    // Verify status is FAIL or has defects
    const isDefective =
      inspection.status === "FAIL" ||
      (inspection.defects && inspection.defects.length > 0);

    if (!isDefective) {
      return NextResponse.json({
        skipped: true,
        message: "Inspection passed without defects. No alert needed.",
      });
    }

    const workstationUrl = `${APP_URL}/inspections/${inspection.id}`;
    const pcbSubjectTag = inspection.pcb_id
      ? `PCB ${inspection.pcb_id}`
      : `UID #${inspection.id.slice(0, 8)}`;
    const defectCount = inspection.defects?.length || 0;

    const subject = `🚨 [PCB DEFECT ALERT] Board FAILED: ${pcbSubjectTag} (${defectCount} flaw${defectCount === 1 ? "" : "s"})`;
    const htmlContent = renderDefectEmailHtml(inspection, workstationUrl);

    const { data, error } = await resend.emails.send({
      from: RESEND_FROM,
      to: recipients,
      subject,
      html: htmlContent,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Defect notification dispatched to all admins (${recipients.join(", ")})`,
      id: data?.id,
      recipients,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to dispatch email via Resend" },
      { status: 500 }
    );
  }
}
