# C.R.I.B.S.

**Child Raising Information Basis System**: a mobile-first web app that gives parents of children with autism one organized, trustworthy place for guidance, an AI guide, a directory, FAQs and community.

Built by the Taguig Science High School STEM team.

**Stack:** Next.js (App Router) · Tailwind v4 · Neon (Postgres) + Drizzle · own email/password auth · Brevo (email codes) · Vercel

## Run locally
```bash
npm ci
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000
```
With `MAIL_DRIVER=console`, sign-up codes print in the terminal instead of being emailed.

## Deploy
Follow [`SETUP_GUIDE.md`](SETUP_GUIDE.md). Environment variables are listed in [`VERCEL_ENV.md`](VERCEL_ENV.md).

## Useful commands
| Command | What it does |
|---|---|
| `npm run dev` | start the app |
| `npm test` | run tests |
| `npm run typecheck` | check types |
| `npm run db:migrate` | create/update database tables |
| `npm run db:seed` | load guides, FAQs and listings into the database (needs `DATABASE_URL_UNPOOLED`) |
| `npm run check-secrets` | scan the repo for leaked secrets |

## Secrets
Never commit real keys. Only `.env.example` (empty values) is tracked. Real values live in Vercel. A pre-commit hook and CI both scan for secrets.

## More
[`BUILD_CRIBS.md`](BUILD_CRIBS.md) is the full spec and [`CONTEXT.md`](CONTEXT.md) is the current project state.
