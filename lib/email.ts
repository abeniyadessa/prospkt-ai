// ─── Resend email notifications ───────────────────────────────────────────────

import type { DailyDigestData } from "@/lib/database";

const RESEND_FROM = process.env.RESEND_FROM_ADDRESS ?? "Prospkt <notifications@prospkt.ai>";
const FALLBACK_NOTIFICATION_TO = process.env.PROSPKT_NOTIFICATION_EMAIL ?? "abeni@yalid.com";

function isResendConfigured(): string | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "your_key_here") return null;
  return apiKey;
}

export interface BookingEmailData {
  businessName: string;
  attendeeName: string;
  attendeeEmail: string;
  startTime: string; // ISO string
  phone: string;
}

export async function sendBookingNotification(data: BookingEmailData): Promise<void> {
  const apiKey = isResendConfigured();
  if (!apiKey) {
    console.log("[email] Resend not configured — skipping notification");
    return;
  }

  const formattedTime = new Date(data.startTime).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Detroit",
  });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [FALLBACK_NOTIFICATION_TO],
      subject: `🎉 New booking — ${data.businessName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #0A0A0A; margin: 0 0 8px;">
            New Discovery Call Booked
          </h1>
          <p style="color: #737373; margin: 0 0 24px;">Your AI just booked a call.</p>

          <div style="background: #F9F9F9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #737373; font-size: 13px;">Business</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0A0A0A; font-size: 13px;">${data.businessName}</td></tr>
              <tr><td style="padding: 6px 0; color: #737373; font-size: 13px;">Contact</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0A0A0A; font-size: 13px;">${data.attendeeName}</td></tr>
              <tr><td style="padding: 6px 0; color: #737373; font-size: 13px;">Email</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0A0A0A; font-size: 13px;">${data.attendeeEmail}</td></tr>
              <tr><td style="padding: 6px 0; color: #737373; font-size: 13px;">Phone</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0A0A0A; font-size: 13px;">${data.phone}</td></tr>
              <tr><td style="padding: 6px 0; color: #737373; font-size: 13px;">Time</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #E8706A; font-size: 13px;">${formattedTime} ET</td></tr>
            </table>
          </div>

          <p style="color: #737373; font-size: 12px; margin: 0;">Sent by Prospkt AI · YALID LLC</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[email] Resend error:", text);
  } else {
    console.log("[email] Booking notification sent for", data.businessName);
  }
}

// ─── Daily digest ─────────────────────────────────────────────────────────────

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatOutcome(outcome: string): string {
  return outcome.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function sendDailyDigest(
  recipient: string,
  data: DailyDigestData,
  timezone: string = "America/Detroit"
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = isResendConfigured();
  if (!apiKey) {
    return { sent: false, reason: "Resend not configured" };
  }
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    return { sent: false, reason: `Invalid recipient: ${recipient || "(empty)"}` };
  }

  const dateLabel = new Date(data.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  });

  const outcomeRows = Object.entries(data.callsByOutcome)
    .sort(([, a], [, b]) => b - a)
    .map(
      ([outcome, count]) => `
        <tr>
          <td style="padding: 6px 0; color: #737373; font-size: 13px;">${escape(formatOutcome(outcome))}</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0A0A0A; font-size: 13px; text-align: right;">${count}</td>
        </tr>`
    )
    .join("");

  const bookingRows = data.bookings.length
    ? data.bookings
        .map((b) => {
          const time = b.startTime
            ? new Date(b.startTime).toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                timeZone: timezone,
              })
            : "Time TBD";
          return `
            <tr>
              <td style="padding: 6px 0; color: #0A0A0A; font-size: 13px; font-weight: 600;">${escape(b.businessName)}</td>
              <td style="padding: 6px 0; color: #737373; font-size: 13px; text-align: right;">${escape(time)}</td>
            </tr>`;
        })
        .join("")
    : `<tr><td colspan="2" style="padding: 6px 0; color: #737373; font-size: 13px; font-style: italic;">No bookings today.</td></tr>`;

  const failureBlock =
    data.agentRuns.failed > 0
      ? `
        <div style="background: #FFF1F0; border: 1px solid #FAE3E0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px; font-weight: 600; color: #A32A22; font-size: 13px;">
            ⚠ ${data.agentRuns.failed} agent run${data.agentRuns.failed === 1 ? "" : "s"} failed today
          </p>
          ${data.agentRuns.lastError ? `<p style="margin: 0; color: #A32A22; font-size: 12px; font-family: monospace;">${escape(data.agentRuns.lastError.slice(0, 240))}</p>` : ""}
        </div>`
      : "";

  const cost = (data.costCents / 100).toFixed(2);

  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
      <h1 style="font-size: 22px; font-weight: 700; color: #0A0A0A; margin: 0 0 4px;">
        Daily digest — ${escape(data.workspaceName)}
      </h1>
      <p style="color: #737373; margin: 0 0 24px; font-size: 13px;">${escape(dateLabel)}</p>

      ${failureBlock}

      <div style="background: #F9F9F9; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
        <p style="margin: 0 0 12px; font-size: 11px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.05em;">
          Calls (${data.callsTotal})
        </p>
        <table style="width: 100%; border-collapse: collapse;">
          ${outcomeRows || `<tr><td style="padding: 6px 0; color: #737373; font-size: 13px; font-style: italic;">No calls placed today.</td></tr>`}
        </table>
      </div>

      <div style="background: #F9F9F9; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
        <p style="margin: 0 0 12px; font-size: 11px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.05em;">
          Bookings (${data.bookings.length})
        </p>
        <table style="width: 100%; border-collapse: collapse;">${bookingRows}</table>
      </div>

      <div style="background: #F9F9F9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #737373; font-size: 13px;">New leads scraped</td>
            <td style="padding: 6px 0; font-weight: 600; color: #0A0A0A; font-size: 13px; text-align: right;">${data.newLeads}${data.topNewLeadCategory ? ` <span style="color: #737373; font-weight: 400;">(top: ${escape(data.topNewLeadCategory.category)})</span>` : ""}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #737373; font-size: 13px;">Added to DNC</td>
            <td style="padding: 6px 0; font-weight: 600; color: #0A0A0A; font-size: 13px; text-align: right;">${data.dncAdded}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #737373; font-size: 13px;">Agent runs</td>
            <td style="padding: 6px 0; font-weight: 600; color: #0A0A0A; font-size: 13px; text-align: right;">${data.agentRuns.total}${data.agentRuns.failed ? ` <span style="color: #A32A22;">(${data.agentRuns.failed} failed)</span>` : ""}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #737373; font-size: 13px;">Estimated spend</td>
            <td style="padding: 6px 0; font-weight: 600; color: #0A0A0A; font-size: 13px; text-align: right;">$${cost}</td>
          </tr>
        </table>
      </div>

      <p style="color: #737373; font-size: 12px; margin: 0;">Sent by Prospkt AI · YALID LLC</p>
    </div>
  `;

  const subject = data.bookings.length
    ? `Prospkt — ${data.bookings.length} booking${data.bookings.length === 1 ? "" : "s"} today (${data.workspaceName})`
    : `Prospkt — daily digest (${data.workspaceName})`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [recipient],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[email] digest send failed:", text);
    return { sent: false, reason: text };
  }
  console.log(`[email] Daily digest sent to ${recipient} for ${data.workspaceName}`);
  return { sent: true };
}
