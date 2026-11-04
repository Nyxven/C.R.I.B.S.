# CONTEXT.md — C.R.I.B.S. Web App (living state file)

> Read this together with `BUILD_CRIBS.md`. Update it at the end of every phase. Rewrite fully at handoff.

## Working agreement (user's rules - follow every session)
1. **Ask what the user wants** at session start and after each stage.
2. **Tell the plan first** (files, commits, risks); change nothing until the user says **"go"**.
3. **Granular commits**, Conventional Commits, short subjects like `feat(auth): add email otp verify` (no whole phrases/sentences).
4. **No force push**, ever; fix with new commits / `git revert`.
5. **No secrets in repo**: only `.env.example`; `.gitignore` covers all other env files; secret scan in hook + CI. Secrets live only in Vercel (and the one GitHub Actions secret). Never ask the user to paste keys into chat.
6. **Logic separated from UI** (layers in BUILD_CRIBS.md 0.4); components never import db/auth/server.
7. **CI/CD**: GitHub Actions CI + secret scan; Vercel preview per PR, prod on main; migrations via workflow.
8. **Always deliver handoff files**: CONTEXT.md, BUILD_CRIBS.md (if changed), .env.example, SETUP_GUIDE.md, VERCEL_ENV.md, zip.

## Status
- **Current phase:** first deploy prep done (session 2) -> next: user pushes + deploys, then P3
- **Last updated:** 2026-11-03 (session 2)
- **Repo:** local git repo, granular commits on `main`; GitHub `Nyxven/C.R.I.B.S` NOT pushed yet (sandbox has no GitHub login). Local commits use placeholder identity "CRIBS Dev <dev@cribs.local>".
- **Deployment:** none yet (user does Vercel import; see SETUP_GUIDE.md)
- **Database:** Neon via Vercel Storage, not provisioned yet. `drizzle/0000_*.sql` applied OK to a local Postgres 16 in the sandbox.

| Phase | Status |
|---|---|
| P0 Scaffold | installed, pinned, typecheck + build pass (Google Fonts can't load in sandbox; fine on Vercel) |
| P1 Auth | own auth done: 24 unit tests pass; NOT tested end-to-end against Neon/Brevo |
| P2 Shell | builds; smoke-tested (/, /sign-in, /sign-up, /api/health, manifest, icons = 200; /home redirects to /sign-in when signed out) |
| P3 Onboarding + Profile | todo (add redirect in `(app)/layout.tsx`) |
| P4 Content | partial: modules, article, directory, FAQ read seed/content.json; search/progress/DB seed todo |
| P5 AI Guide | todo |
| P6 Find + If-found | todo (home links to /find which 404s) |
| P7 Community/Notifs/Settings | todo (settings is a placeholder: add sign-out button using `signOutAction`) |
| P8 Surprise features | todo |
| P9 Hardening | todo |
| P10 Research mode (optional) | todo |

## Project in one paragraph
Mobile-first (PC-usable) web app for parents of children with ASD: 4 guidance modules, directory, FAQ, community, AI guide (center nav tab), onboarding quiz that builds a Child Profile, and Find CRIBS tag (tracker-tag companion with QR "if found" page). Built by Taguig Science High School STEM team (adviser: Kristoffer Paulo L. Ramirez). Two papers: July 2026 proposal (C.R.I.B.S.) and October 2026 (CRIBSEER).

## Stack (decided)
Node.js + Next.js 16 (App Router, TS) · Tailwind v4 · Vercel · Neon via Vercel Storage · Drizzle · **own auth** (session 2: Better Auth removed) · Brevo (OTP emails) · Vercel AI SDK (later; default Claude Haiku-class via `AI_MODEL`, OpenAI fallback) · Vitest + Playwright (e2e todo) · GitHub Actions. Versions pinned exactly in package.json.

## Auth design (session 2)
- Email + password; passwords = argon2id (`@node-rs/argon2`, m=19456,t=2,p=1) over HMAC-SHA256(`PASSWORD_PEPPER`, password). Pepper only in Vercel, so a DB leak alone can't be cracked.
- 6-digit email OTP (Brevo) for verify + reset: stored as HMAC with `AUTH_SECRET`, 10-min expiry, 5 attempts, one live code per email+purpose.
- Sessions: random 256-bit cookie token (`cribs_session`, httpOnly/secure/lax), stored only as keyed hash; 7-day idle / 30-day absolute; new token every sign-in; password reset revokes all sessions.
- Rotation: `AUTH_SECRET_PREVIOUS`, `PASSWORD_PEPPER_PREVIOUS` accepted for verification; old hashes upgraded silently at next sign-in.
- Anti-enumeration: same response for known/unknown emails on sign-up, reset; dummy hash work on unknown sign-in; "already have an account" email for existing sign-ups.
- DB rate limits (`rate_limit` table, atomic upsert) on sign-up, sign-in (per IP and per email), code requests, verify/reset.
- Layers: `src/server/auth/{crypto,repo,session,service,validation}.ts` · UI boundary `src/features/auth/actions.ts` (server actions) · forms in `src/components/auth/AuthForms.tsx` import only the actions.
- Known limits: no per-account lockout beyond rate limits; no 2FA; no "sign out other devices" UI; email change not built.

## Decisions & flags (carry forward)
- D1 Tag name: **CRIBS** (user confirmed session 2); `TAG_NAME` config in `src/config/brand.ts`.
- D2 Paper says GPS/geofence/Firebase, but the tag uses Apple Find My / Google Find Hub (no public API). App deep-links only; no live map; Neon not Firebase. **Paper tests 4.1 and 4.3 assume features the app can't provide — tell the team.**
- D3 Directory entries are sample/fictional → labeled "Sample listing".
- D4 New content is `draft` until experts review (`reviewStatus`).
- D5 Paper's usability formula `2.5 × Σ(x_h)` yields 25–125. Use `(Σx_h − 10) × 2.5` for 0–100. Bangor grades are validated for SUS only. **Tell the team.**
- D6 Child data is sensitive; never send names/contacts to the AI provider; public if-found page uses hashed revocable tokens and opt-in fields.
- D7 (session 2) Auth is our own on Neon + Brevo; no third-party auth library.
- D8 (session 2) Logo = user's PNG/JPG cut to transparent (`public/brand/logo.png`), icons generated from it (`src/app/icon.png`, `apple-icon.png`, `favicon.ico`, `public/brand/icon-*.png`, `src/app/manifest.ts`). Raster only; swap in a vector original if the team has one. Old SVG logo removed.
- Seed content: `seed/content.json`. Visual reference: `seed/prototype-reference.html`.
- Brand palette: coral #F1743E, purple #8E7BD1, sage #B9CE55, amber #F2A759, terracotta #E96B57, gold #F0C15C, pink #EF7E9E, ink #372F4A, cream #FFF8F1. Fonts: Baloo 2 + Nunito. Nav (mobile): Home · Directory · **Ask (AI, center)** · FAQ · Settings. Desktop: sidebar.

## Env vars
Full copy-paste list and secret/non-secret split: `VERCEL_ENV.md`; template: `.env.example`. Used by code today: NEXT_PUBLIC_APP_URL, TAG_NAME, AUTH_SECRET(+_PREVIOUS), PASSWORD_PEPPER(+_PREVIOUS), DATABASE_URL, DATABASE_URL_UNPOOLED, MAIL_DRIVER, BREVO_API_KEY, MAIL_FROM_EMAIL, MAIL_FROM_NAME. AI/role vars are for later phases. In production `MAIL_DRIVER` must be `brevo` or sign-up email fails by design.

## Blockers / needs from the user
1. Push to GitHub (`Nyxven/C.R.I.B.S`, private) and import in Vercel.
2. Add Neon from Vercel Storage; run the migration (SETUP_GUIDE step 6).
3. Brevo: verified sender + API key (put directly into Vercel, never in chat).
4. Generate `AUTH_SECRET` and `PASSWORD_PEPPER` and put them in Vercel (Sensitive).
5. Later: AI provider key (P5); verified local crisis hotline numbers for `src/config/safety.ts`.

## Known deviations / todo (hardening)
- Missing: ESLint config + import-restriction rules, commitlint, lint-staged, PR template, CODEOWNERS, dependabot, Playwright e2e, seed script (`db:seed` does not exist), `src/config/env.ts` only covers auth vars.
- Pre-commit uses `.githooks` + `scripts/check-secrets.mjs` (activated by `npm run prepare`), not Husky.
- Auth service is tested with a faked repo; real SQL (migration + rate-limit upsert + code upsert) was checked by hand on Postgres 16, not through the Neon HTTP driver.

## Next 5 tasks (each begins with a change plan; wait for "go")
1. Ask the user what they want; check deploy result (health, sign-up, email) and fix issues in small commits.
2. P3: onboarding quiz -> `child` table; guard in `(app)/layout.tsx`.
3. Settings page: sign-out button, change password, sign out other devices.
4. Hardening todo above (ESLint import rules, Playwright e2e for auth, dependabot).
5. Update this file, regenerate zip.

## Resume commands
```
npm ci && cp .env.example .env.local   # fill values (see VERCEL_ENV.md)
vercel link && vercel env pull .env.local
# migrations run via the GitHub 'DB migrate' workflow (see SETUP_GUIDE.md)
npm run dev
```

## Session log
- 2026-11-02: Build prompt, context, env template, seed content generated; P0-P2 scaffold written (unverified).
- 2026-11-02: User added working rules (plan-then-go, granular commits, no force push, no secrets, logic/UI separation, CI/CD, handoff files).
- 2026-11-03 (session 2): installed + pinned deps; removed Better Auth; built own Neon auth (argon2id + pepper, Brevo OTP, hashed sessions, rate limits, rotation) with 24 tests; applied the logo (assets, Logo component, icons, manifest); tag name set to CRIBS; env docs (VERCEL_ENV.md), secret scanner + hook + CI scan, db-migrate workflow, SETUP_GUIDE.md. Deploy itself is for the user (sandbox can't reach Vercel/GitHub).
