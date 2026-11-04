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

## D. Not needed yet (phase P5 AI guide)
```
AI_PROVIDER=anthropic
AI_MODEL=claude-haiku-5-5
AI_RATE_LIMIT_PER_HOUR=30
ANTHROPIC_API_KEY=<secret, Sensitive>
```

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
