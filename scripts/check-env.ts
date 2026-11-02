// Run: npm run check-env  (prints variable NAMES only, never values)
const secretMin32 = ["AUTH_SECRET", "PASSWORD_PEPPER"];
const required = ["NEXT_PUBLIC_APP_URL", "DATABASE_URL", ...secretMin32];
const prod = ["MAIL_DRIVER", "BREVO_API_KEY", "MAIL_FROM_EMAIL"]; // needed when NODE_ENV=production

const problems: string[] = [];
for (const k of required) if (!process.env[k]) problems.push(`missing ${k}`);
for (const k of secretMin32) if (process.env[k] && process.env[k]!.length < 32) problems.push(`${k} must be 32+ characters`);
for (const k of ["AUTH_SECRET", "PASSWORD_PEPPER"]) {
  const prev = process.env[`${k}_PREVIOUS`];
  if (prev && prev === process.env[k]) problems.push(`${k}_PREVIOUS equals ${k}`);
}
if (process.env.NODE_ENV === "production") {
  for (const k of prod) if (!process.env[k]) problems.push(`missing ${k}`);
  if (process.env.MAIL_DRIVER && process.env.MAIL_DRIVER !== "brevo") problems.push("MAIL_DRIVER must be brevo in production");
}
if (problems.length) { console.error("Env problems:\n - " + problems.join("\n - ")); process.exit(1); }
console.log("Env OK");
