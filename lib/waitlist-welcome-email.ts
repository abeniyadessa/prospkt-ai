/**
 * Branded "You're on the list" waitlist confirmation email for Prospkt.
 *
 * Design mirrors the reference: a grainy multi-color gradient backdrop, a
 * floating white card, a glossy iridescent hero graphic in the header band, a
 * pill badge, "what happens next" icon rows, and a CTA. Table-based, inline
 * styled, system fonts — built to render consistently across Gmail, Apple Mail
 * and Outlook (no external CSS/JS, no web fonts).
 *
 * The hero graphic + grain are hosted PNGs (emails can't run the CSS the
 * prelaunch page uses), served from the app's public/email directory.
 */

export interface WaitlistWelcomeEmailOptions {
  /** Optional first name to personalize the greeting. */
  firstName?: string | null;
  /** Absolute origin for hosted image assets, e.g. https://prospkt-ai.vercel.app */
  assetOrigin?: string;
}

const DEFAULT_ASSET_ORIGIN = "https://prospkt-ai.vercel.app";

const BRAND = {
  ink: "#16181D",
  muted: "#5B6470",
  subtle: "#8A929D",
  hairline: "#ECECEA",
  card: "#FFFFFF",
  cardInner: "#F6F5F4",
};

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function waitlistWelcomeSubject(): string {
  return "You're on the Prospkt waitlist";
}

export function waitlistWelcomeText(opts: WaitlistWelcomeEmailOptions = {}): string {
  const hi = opts.firstName ? `Hey ${opts.firstName},` : "Hey,";
  return [
    hi,
    "",
    "You're on the list — thank you. Prospkt is the AI sales rep for local service businesses: it calls your leads, qualifies them, and books real meetings onto your calendar. And if a call ever gets missed, it follows up before that customer calls someone else.",
    "",
    "What happens next:",
    "• You'll be among the first to hear when your spot opens.",
    "• Founder pricing is locked in for early access.",
    "• Want in faster? Just reply and tell me about your business.",
    "",
    "Follow the build: https://www.linkedin.com/company/prospktai",
    "",
    "— Abeni Dinsa, Founder, Prospkt",
    "Prospkt · YALID LLC",
  ].join("\n");
}

export function waitlistWelcomeHtml(opts: WaitlistWelcomeEmailOptions = {}): string {
  const origin = (opts.assetOrigin || DEFAULT_ASSET_ORIGIN).replace(/\/$/, "");
  const heroUrl = `${origin}/email/orb-hero.png`;
  const grainUrl = `${origin}/email/grain-bg.png`;
  const greeting = opts.firstName ? `Hey ${escapeHtml(opts.firstName)},` : "Hey there,";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${waitlistWelcomeSubject()}</title>
</head>
<body style="margin:0; padding:0; background:#E9D5E8; -webkit-font-smoothing:antialiased; -ms-text-size-adjust:100%; -webkit-text-size-adjust:100%;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
    You're in. Here's what Prospkt does and what happens next.
  </div>

  <!-- Grainy gradient backdrop -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         background="${grainUrl}"
         style="background-color:#C9B8E8; background-image:linear-gradient(160deg, #9DB7F0 0%, #D8B8E0 38%, #F2A9C0 64%, #F6A56A 100%); background-image:url('${grainUrl}'), linear-gradient(160deg, #9DB7F0 0%, #D8B8E0 38%, #F2A9C0 64%, #F6A56A 100%); background-size:cover; background-position:center;">
    <tr>
      <td align="center" style="padding:44px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:500px; width:100%;">

          <!-- Brand row -->
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle; padding-right:9px;">
                    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                      <td width="32" height="32" align="center" valign="middle"
                          style="width:32px; height:32px; background:${BRAND.ink}; border-radius:9px; color:#fff; font:700 17px/1 ${FONT_STACK}; text-align:center;">&#9889;</td>
                    </tr></table>
                  </td>
                  <td style="vertical-align:middle; font:700 18px/1 ${FONT_STACK}; color:${BRAND.ink}; letter-spacing:-0.01em;">Prospkt</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Floating white card -->
          <tr>
            <td style="background:${BRAND.card}; border-radius:24px; box-shadow:0 24px 60px rgba(60,40,90,0.22);">

              <!-- Header band: badge + title left, hero graphic right -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cardInner}; border-radius:20px; margin:14px;">
                <tr>
                  <td style="padding:22px 0 22px 22px; vertical-align:middle; width:62%;">
                    <span style="display:inline-block; background:#fff; border:1px solid ${BRAND.hairline}; border-radius:999px; padding:6px 12px; font:600 11px/1 ${FONT_STACK}; color:${BRAND.muted}; letter-spacing:0.02em;">
                      You're on the list
                    </span>
                    <div style="font:800 27px/1.1 ${FONT_STACK}; color:${BRAND.ink}; letter-spacing:-0.02em; margin:16px 0 4px;">
                      Welcome to<br>Prospkt
                    </div>
                    <div style="font:400 13.5px/1.45 ${FONT_STACK}; color:${BRAND.subtle};">
                      early access is on the way
                    </div>
                  </td>
                  <td align="right" valign="middle" style="padding:10px 14px 10px 0; width:38%;">
                    <img src="${heroUrl}" width="128" height="128" alt=""
                         style="width:128px; height:128px; display:block; border:0;">
                  </td>
                </tr>
              </table>

              <!-- Greeting + pitch -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:18px 28px 4px;">
                    <p style="margin:0 0 14px; font:400 14.5px/1.6 ${FONT_STACK}; color:${BRAND.muted};">
                      ${greeting} you're in &mdash; thank you. Prospkt is the AI sales rep
                      for local service businesses: it calls your leads, qualifies them,
                      and books real meetings onto your calendar. Miss a call? It follows
                      up before that customer phones someone else.
                    </p>
                  </td>
                </tr>

                <!-- What happens next (icon rows) -->
                <tr>
                  <td style="padding:8px 28px 4px;">
                    <p style="margin:0 0 14px; font:600 12px/1 ${FONT_STACK}; color:${BRAND.subtle}; letter-spacing:0.04em;">What happens next:</p>
                    ${row("&#9889;", "You'll be <b style=\"color:" + BRAND.ink + "\">first to hear</b> when your spot opens")}
                    ${row("&#9819;", "<b style=\"color:" + BRAND.ink + "\">Founder pricing</b> locked in for early access")}
                    ${row("&#9993;", "Want in faster? <b style=\"color:" + BRAND.ink + "\">Reply</b> and tell me about your business")}
                  </td>
                </tr>

                <!-- CTA: follow the build -->
                <tr>
                  <td style="padding:18px 28px 6px;">
                    <p style="margin:0 0 8px; font:600 12px/1 ${FONT_STACK}; color:${BRAND.subtle}; letter-spacing:0.04em;">Follow the build:</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cardInner}; border-radius:999px;">
                      <tr>
                        <td style="padding:10px 8px 10px 18px; font:500 13.5px/1 ${FONT_STACK}; color:${BRAND.muted};">
                          linkedin.com/company/prospktai
                        </td>
                        <td align="right" style="padding:6px;">
                          <a href="https://www.linkedin.com/company/prospktai" target="_blank"
                             style="display:inline-block; background:${BRAND.ink}; color:#fff; text-decoration:none; border-radius:999px; padding:10px 18px; font:600 12.5px/1 ${FONT_STACK};">
                            Follow
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Founder sign-off -->
                <tr>
                  <td style="padding:22px 28px 30px;">
                    <p style="margin:0; font:400 14px/1.5 ${FONT_STACK}; color:${BRAND.ink};">&mdash; Abeni Dinsa</p>
                    <p style="margin:2px 0 0; font:400 12.5px/1.4 ${FONT_STACK}; color:${BRAND.subtle};">Founder, Prospkt</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:22px 16px 0;">
              <p style="margin:0; font:400 11.5px/1.6 ${FONT_STACK}; color:rgba(22,24,29,0.55);">
                Prospkt &middot; YALID LLC<br>
                You're receiving this because you joined the Prospkt waitlist.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function row(glyph: string, text: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
    <tr>
      <td width="26" valign="middle" style="font:400 16px/1 ${FONT_STACK}; color:${BRAND.ink};">${glyph}</td>
      <td valign="middle" style="font:400 14px/1.4 ${FONT_STACK}; color:${BRAND.muted};">${text}</td>
    </tr>
  </table>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
