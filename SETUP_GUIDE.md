# SETUP_GUIDE: from zip to first deploy

Time: about 20 minutes. Everything marked **YOU** needs your logins.

## 0. Update checklist for the latest zip (session 6). Do these in order
Already set up from the steps below? Then this is all you need. One step at a time.

1. **Unzip** `cribs-app.zip` into a new folder (right-click > Extract All). Open PowerShell inside that folder, then:
```powershell
npm ci
npm run typecheck
npm test
npm run build
```
Expect: no type errors, `384 passed`, and a finished build (this is the real build with Google Fonts). If one fails, send me the first error.

2. **Tables (Neon).** Neon > SQL Editor > paste the whole file `drizzle/0002_warm_catseye.sql` > Run. Safe to run twice.

2b. **Chat history tables (new, session 6 part 2).** Neon > SQL Editor > paste the whole file `drizzle/0003_confused_guardian.sql` > Run. Safe to run twice. Do this before pushing, or the Ask tab errors when it saves a chat.

2c. **Find CRIBS table (new).** Neon > SQL Editor > paste the whole file `drizzle/0004_mixed_tomas.sql` > Run. Safe to run twice. Also check that `NEXT_PUBLIC_APP_URL` in Vercel is your real https address: it is printed into the QR codes.

3. **Content (seed).** In Neon, click Connect, copy the **unpooled** connection string. In the same PowerShell window:
```powershell
$env:DATABASE_URL_UNPOOLED = "PASTE-THE-UNPOOLED-STRING-HERE"
npm run db:seed
```
Expect: `Seeded 4 modules, 12 guides, 6 FAQs, 5 listings.` Then close that window (the string only lived there).

4. **Push to GitHub** (open a fresh PowerShell inside the folder). Your GitHub has one merge commit this folder lacks, so merge first. Never use `--force`.
```powershell
git status
git remote -v
```
If `git remote -v` prints nothing, add the remote (copy the exact URL from your repo page):
```powershell
git remote add origin https://github.com/Nyxven/C.R.I.B.S.
```
Then:
```powershell
git fetch origin
git merge origin/main -m "Merge origin/main"
git push origin main
```
If Git says "refusing to merge unrelated histories", run `git merge origin/main --allow-unrelated-histories -m "Merge origin/main"` and push again. If it reports conflicts, stop and send me the message.

5. **GitHub.** The red "DB migrate" check no longer runs by itself (it is manual now), so nothing to fix there. Only the CI and secret-scan checks run on a push.

6. **Vercel.** Wait until the new deployment says Ready. Then Settings > Environment Variables > add `ANTHROPIC_API_KEY` (toggle **Sensitive**, Production + Preview), and Deployments > the latest > Redeploy. Get the key from the Anthropic Console > API keys. Never paste it in chat.

6b. **Security settings** (new, no SQL needed): add `CRON_SECRET` and, when you are ready for the AI, the free-model variables from step 7b below. Details and the Turnstile bot check are in `docs/CLOUDFLARE.md`. Deploy these changes **before** you add any AI key.

7. **Try it on your phone** and tell me what feels wrong:
- Quiz: Continue bar stays visible, Skip is top-right, steps fade in, tap ideas for Calming and Interests.
- Home: search box, "Recommended for ..." row, "x of y read" on the cards, Saved guides.
- Open a guide: Mark as read and Save for later. Check Saved guides and the search page.
- Ask tab: tap a question idea, watch the answer stream in with a source chip. Type `my son is not breathing`: you should get the 911 message at once. Does the question box overlap the bottom bar?

Still needed from you: verified Philippine hotline numbers for `src/config/safety.ts` (only 911 is shown now).

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
Copy `DATABASE_URL_UNPOOLED` into the GitHub `production` environment secret (Settings > Environments > production), then GitHub > Actions > **DB migrate** > Run workflow. It runs only when you start it by hand. If it fails with `url: ''`, the secret is missing or empty.

### Your database was set up by hand (SQL Editor)? Add the Phase 3 columns by hand too
The tables on the live database were created in Neon's SQL Editor, so the DB migrate workflow does not know they exist. If it runs after a push and fails with "already exists", that is expected and harmless. Do this instead, **before** you push the Phase 3 code (Neon > SQL Editor > paste > Run):
```sql
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "onboarding_step" integer DEFAULT 0 NOT NULL;
ALTER TABLE "child" ADD COLUMN IF NOT EXISTS "pronouns" text;
```
It is safe to run twice. If you push first, every signed-in page errors until the columns exist.

### Phase 4 (guides, search, progress): two steps **before** you push
1. **Tables.** Neon > SQL Editor > paste the whole file `drizzle/0002_warm_catseye.sql` > Run. Safe to run twice.
2. **Content.** Load the guides, FAQs and listings into the database. In Neon, open Connect and copy the **unpooled** connection string. Then in PowerShell, inside the project folder:
```powershell
$env:DATABASE_URL_UNPOOLED = "PASTE-THE-UNPOOLED-STRING-HERE"
npm run db:seed
```
It prints `Seeded 4 modules, 12 guides, 6 FAQs, 5 listings.` Safe to run again: it updates by id, never deletes, and keeps review status. The string only lives in that PowerShell window. Close the window when done. If you push before seeding, Home shows "Guides are being set up" until you run it.

## 7. YOU: Brevo
Brevo > Senders, domains > add and verify the sender address (or domain). Put that address in `MAIL_FROM_EMAIL`. Create an API key (SMTP & API > API keys) and put it in `BREVO_API_KEY` in Vercel only. Redeploy.

## 7b. YOU: Turn on Ask CRIBS (the AI guide) on a free model
Do this only after the new code (session 6, security pass) is live.
1. Pick a provider with a free tier that speaks the "OpenAI-compatible" API (for example Google AI Studio for Gemini, OpenRouter free models, or Groq). Create an API key there and note its free limits (requests per minute and per day).
2. Vercel > Settings > Environment Variables (details in `VERCEL_ENV.md` section D): `AI_PROVIDER=openai-compatible`, `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY` (**Sensitive**), and set `AI_GLOBAL_PER_MIN` / `AI_GLOBAL_PER_DAY` to your provider's limits or lower.
3. Also add `CRON_SECRET` (**Sensitive**, see `VERCEL_ENV.md` D2) so the daily cleanup runs.
4. Redeploy, open the Ask tab. Without the key it shows "not available" and nothing breaks.
Emergency numbers live in `src/config/safety.ts`. Only 911 is set. Add a support line there only after you checked it on an official site.
Optional but recommended: the free Turnstile bot check, `docs/CLOUDFLARE.md`.

## 8. Check it works
- `https://YOUR-PROJECT.vercel.app/api/health` returns `{"ok":true,...}`
- Landing page shows the new logo; the tab icon and "Add to Home Screen" use it
- Ask tab: tap a question idea, the answer streams in with source chips. Ask 5 questions quickly: the 5th should say to try again later. Type "my son is not breathing": you get the 911 message at once.
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
| `relation "module" does not exist` when seeding, or pages error after the push | `drizzle/0002_warm_catseye.sql` was not run in Neon yet (step 0.2) |
| Home says "Guides are being set up" | `npm run db:seed` was not run, or it ran against another database (step 0.3) |
| `Missing DATABASE_URL_UNPOOLED` when seeding | Set `$env:DATABASE_URL_UNPOOLED` in that same PowerShell window first |
| Ask says "The guide is not available right now" | `ANTHROPIC_API_KEY` is missing, or you did not redeploy after adding it |
| Ask says "You have asked a lot of questions this hour" | The hourly limit (30) was reached; wait, or raise `AI_RATE_LIMIT_PER_HOUR` |
| GitHub "DB migrate" failed with `url: ''` | Expected if run by hand without the `DATABASE_URL_UNPOOLED` secret; the workflow is manual-only now, ignore it |
