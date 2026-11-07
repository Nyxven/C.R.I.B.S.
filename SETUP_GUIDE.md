# SETUP_GUIDE: from zip to first deploy

Time: about 20 minutes. Everything marked **YOU** needs your logins.

## 1. Open the project locally
```bash
# unzip cribs-app.zip (right-click > Extract All), open a terminal inside the folder
npm ci
git config user.name "Your Name"
git config user.email "you@example.com"   # future commits use your identity
```
`npm ci` also turns on the pre-commit secret scan (`.githooks/pre-commit`).

## 2. Local run (optional but recommended)
```bash
copy .env.example .env.local   # (macOS/Linux: cp)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"     # AUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"     # PASSWORD_PEPPER (different value)
```
Set `DATABASE_URL` to a Neon dev branch (step 5), keep `MAIL_DRIVER=console` (codes print in the terminal), then `npm run dev`.

## 3. YOU: GitHub (private repo)
Create an **empty** repo under `Nyxven` (no README/license/.gitignore). You asked for the name `C.R.I.B.S.`; if GitHub shows a slightly different name, use whatever its page shows.
```bash
git remote add origin https://github.com/Nyxven/C.R.I.B.S.   # copy the exact URL from the repo page
git push -u origin main                                      # never use --force
```
Then in the repo: Settings > Environments > New environment `production`, and add the secret from `VERCEL_ENV.md` section E (after step 5).

## 4. YOU: Vercel
1. Vercel > Add New > Project > import the GitHub repo. Framework is detected as Next.js; keep the defaults.
2. Before pressing Deploy, open **Environment Variables** and add sections **A** and **B** of `VERCEL_ENV.md` (mark B as Sensitive). `MAIL_FROM_EMAIL` can be a placeholder until Brevo is verified; sign-up emails just won't send yet.
3. Deploy. The build does not need the database.

## 5. YOU: Neon database
Vercel project > Storage > Create > **Neon** > connect to this project (Production + Preview). It adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED`. Redeploy once after connecting.

## 6. Create the tables (one time, then automatic)
Copy `DATABASE_URL_UNPOOLED` into the GitHub `production` environment secret, then GitHub > Actions > **DB migrate** > Run workflow. It also runs on its own whenever `drizzle/**` changes on `main`.

### Your database was set up by hand (SQL Editor)? Add the Phase 3 columns by hand too
The tables on the live database were created in Neon's SQL Editor, so the DB migrate workflow does not know they exist. If it runs after a push and fails with "already exists", that is expected and harmless. Do this instead, **before** you push the Phase 3 code (Neon > SQL Editor > paste > Run):
```sql
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "onboarding_step" integer DEFAULT 0 NOT NULL;
ALTER TABLE "child" ADD COLUMN IF NOT EXISTS "pronouns" text;
```
It is safe to run twice. If you push first, every signed-in page errors until the columns exist.

## 7. YOU: Brevo
Brevo > Senders, domains > add and verify the sender address (or domain). Put that address in `MAIL_FROM_EMAIL`. Create an API key (SMTP & API > API keys) and put it in `BREVO_API_KEY` in Vercel only. Redeploy.

## 8. Check it works
- `https://YOUR-PROJECT.vercel.app/api/health` returns `{"ok":true,...}`
- Landing page shows the new logo; the tab icon and "Add to Home Screen" use it
- Sign up > the 6-digit email arrives > verify > you land on `/home` > Forgot password flow works

## Keeping secrets out of the repo
- Only `.env.example` (empty values) is tracked; `.env` and `.env.*` are ignored.
- `npm run check-secrets` scans the whole tree. The pre-commit hook scans staged files. CI runs this scan plus gitleaks on every push and PR.
- If a secret ever reaches GitHub: rotate it first (see Rotation in `VERCEL_ENV.md`), then clean up. Do not force-push.

## Troubleshooting
| Symptom | Likely cause |
|---|---|
| "We couldn't send the email" on sign-up | `MAIL_DRIVER`, `BREVO_API_KEY` or `MAIL_FROM_EMAIL` missing/unverified |
| 500 on sign-up / sign-in | Migration not run yet (step 6), or `AUTH_SECRET` / `PASSWORD_PEPPER` missing or under 32 characters |
| Everyone suddenly can't sign in | `PASSWORD_PEPPER` was changed without keeping the old one in `PASSWORD_PEPPER_PREVIOUS` |
| Build fails on `@node-rs/argon2` | Make sure `next.config.ts` still lists it in `serverExternalPackages` |
