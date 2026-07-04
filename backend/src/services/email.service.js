'use strict';

const nodemailer = require('nodemailer');

// ──────────── Transporter ────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // STARTTLS on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ──────────── sendEmail ───────────────────────────────────────────────────────
/**
 * Send a raw email.
 * @param {string} to      Recipient address
 * @param {string} subject Email subject
 * @param {string} html    HTML body
 * @returns {Promise<void>}
 */
const sendEmail = async (to, subject, html) => {
  const from = process.env.EMAIL_FROM || `"Job Tracker" <${process.env.SMTP_USER}>`;
  await transporter.sendMail({ from, to, subject, html });
};

// ──────────── sendReminderEmail ───────────────────────────────────────────────
/**
 * Build a dark-themed reminder email and send it.
 * @param {{ name: string, email: string }} user
 * @param {Array<{ company: string, role: string, status: string, last_updated: Date }>} staleJobs
 * @returns {Promise<void>}
 */
const sendReminderEmail = async (user, staleJobs) => {
  const count   = staleJobs.length;
  const subject = `You have ${count} application${count !== 1 ? 's' : ''} needing attention — TRACK`;

  // ── Days-since helper ──────────────────────────────────────────────────────
  const daysSince = (date) =>
    Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);

  // ── Job rows ───────────────────────────────────────────────────────────────
  const rows = staleJobs
    .map((job) => {
      const days = daysSince(job.last_updated);
      const statusLabel = job.status.charAt(0).toUpperCase() + job.status.slice(1);
      return `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #222222;color:#FFFFFF;font-size:14px;">${job.company}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #222222;color:#CCCCCC;font-size:14px;">${job.role}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #222222;font-size:14px;">
            <span style="background:#1A1A1A;border:1px solid #333333;color:#FFE500;padding:3px 8px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">${statusLabel}</span>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #222222;color:#888888;font-size:14px;">${days} day${days !== 1 ? 's' : ''} ago</td>
        </tr>`;
    })
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 32px;">
              <span style="font-size:22px;font-weight:800;color:#FFE500;letter-spacing:-0.02em;">TRACK</span>
              <span style="font-size:22px;font-weight:300;color:#FFFFFF;letter-spacing:-0.02em;"> Job Tracker</span>
            </td>
          </tr>

          <!-- Title card -->
          <tr>
            <td style="background:#111111;border:1px solid #222222;padding:28px 32px 24px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#FFE500;">Reminder</p>
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#FFFFFF;line-height:1.2;">
                Hi ${user.name}, you have ${count} stale application${count !== 1 ? 's' : ''}
              </h1>
              <p style="margin:0;font-size:14px;color:#888888;line-height:1.6;">
                The following applications haven't been updated in over 7 days. Consider following up or updating their status.
              </p>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:2px;background:#FFE500;"></td></tr>

          <!-- Jobs table -->
          <tr>
            <td style="background:#0D0D0D;border:1px solid #222222;border-top:none;padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr style="border-bottom:1px solid #222222;">
                    <th style="padding:10px 16px;text-align:left;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#555555;">Company</th>
                    <th style="padding:10px 16px;text-align:left;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#555555;">Role</th>
                    <th style="padding:10px 16px;text-align:left;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#555555;">Status</th>
                    <th style="padding:10px 16px;text-align:left;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#555555;">Last Update</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:24px 0 0;">
              <a href="http://localhost:5173" style="display:inline-block;background:#FFE500;color:#000000;font-size:13px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;padding:12px 28px;text-decoration:none;">
                Review Applications
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 0 0;border-top:1px solid #1A1A1A;margin-top:32px;">
              <p style="margin:0;font-size:11px;color:#444444;line-height:1.6;">
                You are receiving this because reminders are enabled on your TRACK account.<br />
                To disable reminders, update your account settings.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendEmail(user.email, subject, html);
};

module.exports = { sendEmail, sendReminderEmail };
