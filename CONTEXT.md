# CONTEXT.md — C.R.I.B.S. Web App (living state file)

> Read this together with `BUILD_CRIBS.md`. Update it at the end of every phase. Rewrite fully at handoff.

## Status
- **Current phase:** P2 code written (UNVERIFIED) -> next: install + verify, then P3
- **Last updated:** 2026-11-02
- **Repo:** local git repo only (1 commit on main); GitHub repo not created (no gh/network in sandbox)
- **Deployment:** none yet
- **Database:** Neon (via Vercel Marketplace), not provisioned yet

| Phase | Status |
|---|---|
| P0 Scaffold | code written, NOT built (no network to install) |
| P1 Auth | code written, NOT tested |
| P2 Shell | code written, NOT tested |
| P3 Onboarding + Profile | todo |
| P4 Content | partial: modules, article, directory, FAQ pages read seed/content.json; search/progress/DB seed todo |
| P5 AI Guide | todo |
| P6 Find + If-found | todo |
| P7 Community/Notifs/Settings | todo |
| P8 Surprise features | todo |
| P9 Hardening | todo |
| P10 Research mode (optional) | todo |

## Project in one paragraph
Mobile-first (PC-usable) web app for parents of children with ASD: 4 guidance modules, directory, FAQ, community, AI guide (center nav tab), onboarding quiz that builds a Child Profile, and Find Cribseer (tracker-tag companion with QR "if found" page). Built by Taguig Science High School STEM team (adviser: Kristoffer Paulo L. Ramirez). Two papers: July 2026 proposal (C.R.I.B.S.) and October 2026 (CRIBSEER).

## Stack (decided)
Node.js + Next.js (App Router, TS) · Tailwind v4 · Vercel · Neon via Vercel Store · Drizzle · Better Auth (email+password, emailOTP) · Brevo (OTP emails) · Vercel AI SDK (default Claude Haiku-class via `AI_MODEL`, OpenAI fallback) · Vitest + Playwright · GitHub Actions.

## Decisions & flags (carry forward)
- D1 Tag name: prototype "Cribsy" vs paper "Cribseer" → `TAG_NAME` config, default "Cribseer". **Team must confirm.**
- D2 Paper says GPS/geofence/Firebase, but the tag uses Apple Find My / Google Find Hub (no public API). App deep-links only; no live map; Neon not Firebase. **Paper tests 4.1 and 4.3 assume features the app can't provide — tell the team.**
- D3 Directory entries are sample/fictional → labeled "Sample listing".
- D4 New content is `draft` until experts review (`reviewStatus`).
- D5 Paper's usability formula `2.5 × Σ(x_h)` yields 25–125. Use `(Σx_h − 10) × 2.5` for 0–100. Bangor grades are validated for SUS only. **Tell the team.**
- D6 Child data is sensitive; never send names/contacts to the AI provider; public if-found page uses hashed revocable tokens and opt-in fields.
- Seed content: `seed/content.json` (12 articles, 6 FAQs, 5 sample professionals, 3 community seeds, 5 notifications). Visual reference: `seed/prototype-reference.html`.
- Brand palette: coral #F1743E, purple #8E7BD1, sage #B9CE55, amber #F2A759, terracotta #E96B57, gold #F0C15C, pink #EF7E9E, ink #372F4A, cream #FFF8F1. Fonts: Baloo 2 + Nunito. Themes: Sunrise/Ocean/Meadow/Berry (+ dark, sensory-friendly).
- Nav (mobile): Home · Directory · **Ask (AI, center)** · FAQ · Settings. Desktop: sidebar.

## Env vars (see `.env.example`)
Set: none yet. Missing: all except generated BETTER_AUTH_SECRET in local `.env`. User must provide: BREVO_API_KEY + verified sender, ANTHROPIC_API_KEY (or OPENAI_API_KEY), Neon via Vercel, Vercel/GitHub logins.

## Blockers / needs from the user
1. GitHub account/org + repo name (default `cribs-app`, private).
2. Vercel login; add Neon from Vercel Storage.
3. Brevo API key and verified sender email/domain.
4. AI provider key.
5. Confirm tag name (D1) and verified local crisis hotline numbers for `src/config/safety.ts`.

## IMPORTANT: unverified code
The sandbox had no network, so `npm install`, typecheck, build and tests were never run. First task in the next session: `npm install`, `npm run typecheck`, `npm run build`, fix errors. Verify against current docs: Better Auth emailOTP API (sendVerificationOtp / verifyEmail / resetPassword names, `allowedAttempts`, `rateLimit.storage`), `nextCookies` import path, `@better-auth/cli generate` vs hand-written auth tables in `src/db/schema.ts`, Next.js params typing and middleware/proxy naming, Tailwind v4 `@theme`. `package.json` uses "latest" - pin exact versions after install.

## What exists in the repo
`src/config` (brand, nav) · `src/db` (schema: auth tables + profile/child/emergency_contact; neon-http client) · `src/lib` (auth, auth-client, mail with console/Brevo drivers) · `src/content` (typed loader for seed/content.json) · pages: landing, sign-up/in/verify/forgot, (app) layout with session guard, Loader (once per session), AppNav (mobile bottom nav with center Ask + desktop sidebar), home, learn module/article, directory, FAQ, placeholders for ask/settings · CI workflow · security headers.
Not yet: onboarding (P3, also add redirect in `(app)/layout.tsx`), `/find`, `/onboarding` routes (home links to /find which 404s), search, AI, community, PWA manifest/icons, tests, migrations, seed script.

## Next 5 tasks
1. `npm install`; fix typecheck/build errors; pin versions; add vitest smoke test.
2. `npm run auth:generate`, reconcile schema, `db:generate` + `db:migrate` against Neon.
3. P3: 10-step onboarding quiz -> `child` table; guard in `(app)/layout.tsx`; personalize Home.
4. P4 leftovers: search, save/read progress, DB seed script, sanitize HTML.
5. P5: `/api/chat` with grounding, safety layer, rate limit.

## Resume commands
```
pnpm i && cp .env.example .env.local   # fill values
vercel link && vercel env pull .env.local
pnpm db:migrate && pnpm db:seed && pnpm dev
```

## Session log
- 2026-11-02: Build prompt, context, env template, seed content generated.
- 2026-11-02: P0-P2 scaffold written and committed locally (unverified, no network).
