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
  "sign-in": "Your sign-in code",
  "email-verification": "Verify your email",
  "forget-password": "Reset your password",
} as const;

export function otpEmail(type: keyof typeof titles, otp: string) {
  return {
    subject: `${titles[type]} — C.R.I.B.S.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;color:#372F4A">
      <h2 style="color:#F1743E">C.R.I.B.S.</h2><p>${titles[type]}:</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold">${otp}</p>
      <p>This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p></div>`,
  };
}
