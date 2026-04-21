// ─── Resend email notifications ───────────────────────────────────────────────

export interface BookingEmailData {
  businessName: string;
  attendeeName: string;
  attendeeEmail: string;
  startTime: string; // ISO string
  phone: string;
}

export async function sendBookingNotification(data: BookingEmailData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "your_key_here") {
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
      from: "Prospkt <notifications@prospkt.ai>",
      to: ["abeni@yalid.com"],
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
