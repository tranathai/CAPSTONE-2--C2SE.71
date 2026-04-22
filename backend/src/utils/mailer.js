import nodemailer from "nodemailer";

function createTransporter() {
  const host = process.env.MAIL_HOST || process.env.SMTP_HOST;
  const port = Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587);
  const username = process.env.MAIL_USERNAME || process.env.SMTP_USER;
  const password = process.env.MAIL_PASSWORD || process.env.SMTP_PASS || "";
  const secure = String(process.env.MAIL_SECURE || process.env.SMTP_SECURE || "false") === "true";

  if (!host) {
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: username
      ? { user: username, pass: password }
      : undefined,
  });
}

export async function sendMail({ to, subject, html }) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log("[MAIL-DEV]", { to, subject, html });
    return;
  }
  await transporter.sendMail({
    from:
      process.env.MAIL_FROM ||
      process.env.SMTP_FROM ||
      process.env.MAIL_USERNAME ||
      "noreply@mentoraigrad.local",
    to,
    subject,
    html,
  });
}
