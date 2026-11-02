// Mail transport: console (dev) or Brevo transactional API (prod). Never logs OTPs in production.
type Mail = { to: string; subject: string; html: string };

export async function sendMail({ to, subject, html }: Mail) {
  if (process.env.MAIL_DRIVER !== "brevo") {
    if (process.env.NODE_ENV === "production") throw new Error("MAIL_DRIVER must be 'brevo' in production");
    console.log(`[mail:console] to=${to} subject=${subject}\n${html.replace(/<[^>]+>/g, " ")}`);
    return;
  }
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY ?? "", "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: process.env.MAIL_FROM_EMAIL, name: process.env.MAIL_FROM_NAME ?? "C.R.I.B.S." },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) throw new Error(`Brevo error ${res.status}`);
}

const titles = {
  verify: "Verify your email",
  reset: "Reset your password",
} as const;
export type CodePurpose = keyof typeof titles;

const wrap = (inner: string) =>
  `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;color:#372F4A"><h2 style="color:#F1743E">C.R.I.B.S.</h2>${inner}</div>`;

export function codeEmail(purpose: CodePurpose, code: string) {
  return {
    subject: `${titles[purpose]} — C.R.I.B.S.`,
    html: wrap(`<p>${titles[purpose]}:</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold">${code}</p>
      <p>This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>`),
  };
}

// Sent instead of a code when someone signs up with an email that already has an account (prevents account enumeration).
export function existingAccountEmail() {
  return {
    subject: "You already have a C.R.I.B.S. account",
    html: wrap(`<p>Someone tried to create a C.R.I.B.S. account with this email, but you already have one.</p>
      <p>If it was you, just sign in (or use "Forgot password?"). If not, you can ignore this email.</p>`),
  };
}
