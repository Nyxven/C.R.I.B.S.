# ENV_REFERENCE.md — environment variable names

Names only. **Never put real values in this repo.** Template: `.env.example`. Production values live in Vercel (see `VERCEL_ENV.md`). Env changes apply only after a redeploy. The session 7 UI/UX work added **no** new variables.

| Variable | Required? | Secret? | Used in |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes in production (real https address; used for QR links) | No | `src/server/found`, found actions |
| `TAG_NAME` | Optional (default `CRIBS`) | No | `src/config/brand.ts` (passed to the client as a prop only) |
| `RESEARCH_MODE` | Optional | No | reserved (P10) |
| `AUTH_SECRET` (+ `AUTH_SECRET_PREVIOUS`) | Yes | **Yes** | `src/server/auth/*`, limiter keys |
| `PASSWORD_PEPPER` (+ `_PREVIOUS`) | Yes | **Yes** | `src/server/auth/crypto.ts` |
| `DATABASE_URL` | Yes | **Yes** | `src/db` (runtime, pooled) |
| `DATABASE_URL_UNPOOLED` | Yes for seed / migrations | **Yes** | `scripts/seed.ts`, drizzle |
| `MAIL_DRIVER` | Yes (`brevo` in production, `console` for dev) | No | `src/lib/mail.ts` |
| `BREVO_API_KEY` | Yes when `MAIL_DRIVER=brevo` | **Yes** | `src/lib/mail.ts` |
| `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME` | Yes with Brevo | No | `src/lib/mail.ts` |
| `AI_PROVIDER`, `AI_BASE_URL`, `AI_MODEL` | Optional (Ask is off without a provider) | No | `src/config/env.ts` `getAiConfig` |
| `AI_API_KEY` or `ANTHROPIC_API_KEY` | Optional (needed to switch Ask on) | **Yes** | `src/server/ai/*` |
| `AI_MAX_OUTPUT_TOKENS`, `AI_RATE_LIMIT_PER_HOUR`, `AI_USER_PER_DAY`, `AI_USER_TOKENS_PER_DAY`, `AI_GLOBAL_PER_MIN`, `AI_GLOBAL_PER_DAY`, `AI_GLOBAL_TOKENS_PER_DAY` | Optional (defaults exist) | No | `src/lib/ai/policy.ts` |
| `TRUST_PROXY` | Optional (`vercel` default) | No | `src/lib/net/clientIp.ts` |
| `MAIL_DAILY_CAP` | Optional (250) | No | auth service |
| `CRON_SECRET` | Yes for the daily cleanup | **Yes** | `src/app/api/cron/cleanup/route.ts` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Optional (bot check) | secret key: **Yes** | `src/server/security/turnstile.ts`, widget |
| `MODERATOR_EMAILS` | Optional (nobody can moderate if empty) | No | community moderation |
| `COMMUNITY_REPORT_HIDE_AT` | Optional (2) | No | community rules |
