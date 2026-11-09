# Vercel environment variables (copy-paste)

Vercel > Project > Settings > Environment Variables. Tip: paste a whole block into the **Key** field and Vercel splits it into rows.
Never commit real values. Never paste them into chat, issues or PRs.

## A. Non-secrets (leave as "Plain"; scope: Production + Preview)
```
NEXT_PUBLIC_APP_URL=https://YOUR-PROJECT.vercel.app
MAIL_DRIVER=brevo
MAIL_FROM_NAME=C.R.I.B.S.
MAIL_FROM_EMAIL=YOUR-VERIFIED-BREVO-SENDER@example.com
TAG_NAME=CRIBS
RESEARCH_MODE=false
```
(`NEXT_PUBLIC_APP_URL`: after you attach a custom domain, change it to that domain and redeploy.)

## B. Secrets (toggle **Sensitive** on each; scope: Production + Preview)
Generate the two auth secrets yourself, a different value each, on your own computer:
```
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
```
AUTH_SECRET=<paste output 1>
PASSWORD_PEPPER=<paste output 2>
BREVO_API_KEY=<Brevo > SMTP & API > API keys > Generate>
```
Use different `AUTH_SECRET` / `PASSWORD_PEPPER` values for Preview than for Production.
**Warning:** changing `PASSWORD_PEPPER` without moving the old one to `PASSWORD_PEPPER_PREVIOUS` locks every user out.

## C. Added automatically by Neon (Vercel > Storage > Create > Neon > Connect to project)
```
DATABASE_URL             (pooled, runtime)
DATABASE_URL_UNPOOLED    (direct, migrations)
```
Do not copy these by hand. Neon also adds `POSTGRES_*` / `PG*` variables; they are unused and can stay.

## D. AI guide on a free model
Plain (scope: Production + Preview). Check your provider's docs for the OpenAI-compatible address, a current free model id and its limits:
```
AI_PROVIDER=openai-compatible
AI_BASE_URL=<provider's OpenAI-compatible address, https>
AI_MODEL=<model id>
AI_GLOBAL_PER_MIN=<your provider's requests per minute, or lower>
AI_GLOBAL_PER_DAY=<your provider's requests per day, or lower>
```
Secret (toggle **Sensitive**):
```
AI_API_KEY=<key from your provider>
```
Optional, defaults shown: `AI_MAX_OUTPUT_TOKENS=450`, `AI_RATE_LIMIT_PER_HOUR=20`, `AI_USER_PER_DAY=60`, `AI_USER_TOKENS_PER_DAY=40000`, `AI_GLOBAL_TOKENS_PER_DAY=400000`.
Using Anthropic instead: `AI_PROVIDER=anthropic` plus `ANTHROPIC_API_KEY` (Sensitive); the model defaults to `claude-haiku-5-5`.
Without a key the Ask tab says "not available" and search keeps working. Never paste keys in chat.

## D2. Security settings
```
TRUST_PROXY=vercel
MAIL_DAILY_CAP=250
```
Secret (Sensitive): `CRON_SECRET` = a random string of 16+ characters (`node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`). Vercel Cron then calls `/api/cron/cleanup` daily with it. Without it the cleanup never runs.
Optional bot check (see `docs/CLOUDFLARE.md`): `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (plain) and `TURNSTILE_SECRET_KEY` (Sensitive).

## E. GitHub Actions secret (only for the migration workflow)
Repo > Settings > Environments > New environment `production` > add secret:
```
DATABASE_URL_UNPOOLED=<copy from Vercel > Storage > Neon > .env.local tab>
```

## Rotation
1. Generate a new value, move the current one to `AUTH_SECRET_PREVIOUS` / `PASSWORD_PEPPER_PREVIOUS`, put the new one in the main variable, redeploy.
2. Users stay signed in; passwords re-hash on each user's next sign-in.
3. After about 30 days, delete the `_PREVIOUS` variable.
4. If a secret ever leaked (even briefly in git), rotate it right away, and remove it from the previous slot too.
