"""
Email notification service using Resend (https://resend.com) REST API.

Graceful degradation: if RESEND_API_KEY is not configured, emails are
logged but not sent — the application continues to function normally.
"""

import httpx
from loguru import logger

from app.config import settings

RESEND_API_URL = "https://api.resend.com/emails"

# ---------------------------------------------------------------------------
# Brand constants
# ---------------------------------------------------------------------------
BRAND_COLOR = "#0ea5e9"       # sky-500
BRAND_BG = "#0f172a"          # slate-900
CARD_BG = "#1e293b"           # slate-800
TEXT_PRIMARY = "#f1f5f9"      # slate-100
TEXT_SECONDARY = "#94a3b8"    # slate-400
BORDER_COLOR = "#334155"      # slate-700


def _base_template(title: str, body_html: str) -> str:
    """Wrap body_html in a branded dark-themed email shell."""
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background-color:{BRAND_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{BRAND_BG};padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:0 0 24px 0;text-align:center;">
              <span style="font-size:28px;font-weight:700;color:{BRAND_COLOR};letter-spacing:-0.5px;">InfraTrace</span>
              <span style="font-size:12px;color:{TEXT_SECONDARY};display:block;margin-top:4px;letter-spacing:2px;text-transform:uppercase;">Infrastructure Intelligence</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:{CARD_BG};border:1px solid {BORDER_COLOR};border-radius:12px;padding:40px 32px;">
              {body_html}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:{TEXT_SECONDARY};line-height:1.6;">
                This email was sent by InfraTrace. If you did not expect this message, you can safely ignore it.
              </p>
              <p style="margin:8px 0 0 0;font-size:11px;color:#475569;">
                &copy; 2026 InfraTrace &mdash; Transparent Infrastructure Governance
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _button(text: str, url: str) -> str:
    """Render a CTA button."""
    return (
        f'<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">'
        f'<tr><td style="border-radius:8px;background-color:{BRAND_COLOR};">'
        f'<a href="{url}" target="_blank" '
        f'style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;'
        f'color:#ffffff;text-decoration:none;border-radius:8px;">{text}</a>'
        f'</td></tr></table>'
    )


# ---------------------------------------------------------------------------
# Core send
# ---------------------------------------------------------------------------

async def send_email(to: str, subject: str, html: str) -> bool:
    """
    Send an email via Resend REST API.

    Returns True if the email was accepted, False otherwise.
    Logs but never raises — callers should not fail because email is down.
    """
    api_key = settings.RESEND_API_KEY
    if not api_key:
        logger.warning("RESEND_API_KEY not configured — skipping email to {}", to)
        return False

    email_from = settings.EMAIL_FROM

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                RESEND_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": email_from,
                    "to": [to],
                    "subject": subject,
                    "html": html,
                },
            )

        if resp.status_code in (200, 201):
            logger.info("Email sent to {} — subject: {}", to, subject)
            return True

        logger.error(
            "Resend API error (HTTP {}): {}",
            resp.status_code,
            resp.text[:500],
        )
        return False

    except httpx.HTTPError as exc:
        logger.error("Failed to send email to {}: {}", to, exc)
        return False


# ---------------------------------------------------------------------------
# Template helpers
# ---------------------------------------------------------------------------

async def send_welcome(email: str, full_name: str) -> bool:
    """Welcome email after user registration."""
    first_name = full_name.split()[0] if full_name else "there"
    body = f"""\
<h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:{TEXT_PRIMARY};">
  Welcome to InfraTrace, {first_name}!
</h1>
<p style="margin:0 0 12px;font-size:15px;color:{TEXT_SECONDARY};line-height:1.7;">
  Your account has been created successfully. InfraTrace gives you real-time
  visibility into infrastructure projects with blockchain-verified audit trails,
  AI-powered analysis, and live sensor monitoring.
</p>
<p style="margin:0;font-size:15px;color:{TEXT_SECONDARY};line-height:1.7;">
  Log in to explore your dashboard and start tracking projects.
</p>
{_button("Open Dashboard", settings.FRONTEND_URL)}"""

    return await send_email(email, "Welcome to InfraTrace", _base_template("Welcome", body))


async def send_password_reset(email: str, token: str, base_url: str) -> bool:
    """Password reset email with a one-time link."""
    reset_url = f"{base_url}/reset-password?token={token}"
    body = f"""\
<h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:{TEXT_PRIMARY};">
  Reset Your Password
</h1>
<p style="margin:0 0 12px;font-size:15px;color:{TEXT_SECONDARY};line-height:1.7;">
  We received a request to reset your password. Click the button below to
  choose a new one. This link expires in 1 hour.
</p>
{_button("Reset Password", reset_url)}
<p style="margin:20px 0 0;font-size:13px;color:#475569;line-height:1.6;">
  If you didn&rsquo;t request this, you can safely ignore this email &mdash;
  your password will remain unchanged.
</p>"""

    return await send_email(email, "Reset your InfraTrace password", _base_template("Password Reset", body))


async def send_invitation(
    email: str,
    token: str,
    inviter_name: str,
    org_name: str,
    base_url: str,
) -> bool:
    """Invitation email for a user to join an organization."""
    invite_url = f"{base_url}/invitations/accept/{token}"
    body = f"""\
<h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:{TEXT_PRIMARY};">
  You&rsquo;ve Been Invited
</h1>
<p style="margin:0 0 12px;font-size:15px;color:{TEXT_SECONDARY};line-height:1.7;">
  <strong style="color:{TEXT_PRIMARY};">{inviter_name}</strong> has invited you
  to join <strong style="color:{TEXT_PRIMARY};">{org_name}</strong> on InfraTrace
  &mdash; the platform for transparent infrastructure governance.
</p>
<p style="margin:0 0 4px;font-size:15px;color:{TEXT_SECONDARY};line-height:1.7;">
  This invitation expires in 7 days.
</p>
{_button("Accept Invitation", invite_url)}"""

    return await send_email(
        email,
        f"You're invited to join {org_name} on InfraTrace",
        _base_template("Invitation", body),
    )


async def send_decision_alert(
    email: str,
    project_name: str,
    decision_title: str,
    alert_type: str,
) -> bool:
    """Alert email for anomaly/threshold events on a decision."""
    alert_label = alert_type.replace("_", " ").title()
    body = f"""\
<h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:{TEXT_PRIMARY};">
  &#9888; {alert_label} Alert
</h1>
<p style="margin:0 0 12px;font-size:15px;color:{TEXT_SECONDARY};line-height:1.7;">
  An alert has been triggered for a decision in your project.
</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;">
  <tr>
    <td style="padding:12px 16px;background-color:{BRAND_BG};border-radius:8px;border:1px solid {BORDER_COLOR};">
      <p style="margin:0 0 6px;font-size:13px;color:{TEXT_SECONDARY};text-transform:uppercase;letter-spacing:1px;">Project</p>
      <p style="margin:0;font-size:16px;color:{TEXT_PRIMARY};font-weight:600;">{project_name}</p>
    </td>
  </tr>
  <tr><td style="height:8px;"></td></tr>
  <tr>
    <td style="padding:12px 16px;background-color:{BRAND_BG};border-radius:8px;border:1px solid {BORDER_COLOR};">
      <p style="margin:0 0 6px;font-size:13px;color:{TEXT_SECONDARY};text-transform:uppercase;letter-spacing:1px;">Decision</p>
      <p style="margin:0;font-size:16px;color:{TEXT_PRIMARY};font-weight:600;">{decision_title}</p>
    </td>
  </tr>
</table>
<p style="margin:0;font-size:15px;color:{TEXT_SECONDARY};line-height:1.7;">
  Review this alert in your InfraTrace dashboard.
</p>
{_button("View Dashboard", settings.FRONTEND_URL)}"""

    return await send_email(
        email,
        f"[{alert_label}] {project_name} — {decision_title}",
        _base_template("Alert", body),
    )
