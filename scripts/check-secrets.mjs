// Blocks secrets from entering git. Usage: `node scripts/check-secrets.mjs` (staged files) or `--all` (whole tree).
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const all = process.argv.includes("--all");
const sh = (c) => execSync(c, { encoding: "utf8", maxBuffer: 1 << 28 });
const files = (all ? sh("git ls-files") : sh("git diff --cached --name-only --diff-filter=ACMR")).split("\n").filter(Boolean);

const patterns = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
  [/xkeysib-[A-Za-z0-9-]{20,}/, "Brevo API key"],
  [/sk-ant-[A-Za-z0-9_-]{20,}/, "Anthropic API key"],
  [/\bsk-(proj-)?[A-Za-z0-9_-]{32,}/, "OpenAI-style API key"],
  [/\b(ghp|gho|ghs|github_pat)_[A-Za-z0-9_]{30,}/, "GitHub token"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key"],
  [/postgres(?:ql)?:\/\/(?!user:pass@)[^:\s/'"]+:[^@\s'"]{6,}@(?!localhost)/, "database URL with credentials"],
  [/\b(AUTH_SECRET|PASSWORD_PEPPER|BREVO_API_KEY|ANTHROPIC_API_KEY|OPENAI_API_KEY)\s*[=:]\s*['"]?[A-Za-z0-9+/_=-]{20,}/, "secret assigned a real-looking value"],
];
const problems = [];
for (const f of files) {
  if (/(^|\/)\.env(\.|$)/.test(f) && !f.endsWith(".env.example")) problems.push(`${f}: env file must not be committed`);
  if (/\.(png|jpg|jpeg|ico|woff2?|zip|lock)$/.test(f) || f === "package-lock.json" || f === "scripts/check-secrets.mjs") continue;
  let text;
  try { text = all ? readFileSync(f, "utf8") : sh(`git show :"${f}"`); } catch { continue; }
  text.split("\n").forEach((line, i) => {
    for (const [re, name] of patterns) if (re.test(line)) problems.push(`${f}:${i + 1}: ${name}`);
  });
}
if (problems.length) {
  console.error("Possible secrets found (values not shown):\n - " + problems.join("\n - "));
  console.error("Remove them, rotate the secret if it was ever pushed, and commit again.");
  process.exit(1);
}
console.log(`No secrets found in ${files.length} file(s).`);
