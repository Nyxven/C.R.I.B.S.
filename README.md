# C.R.I.B.S. web app
Next.js (App Router) + Tailwind v4 + own auth (argon2id, Neon) + Drizzle/Neon + Brevo. See `BUILD_CRIBS.md` (spec) and `CONTEXT.md` (state).

## Setup
```
npm install
cp .env.example .env.local      # fill values (vercel env pull .env.local after adding Neon)
npm run auth:generate           # compare generated auth schema with src/db/schema.ts
npm run db:generate && npm run db:migrate
npm run dev
```
Dev OTP emails print to the server console while `MAIL_DRIVER=console`.
