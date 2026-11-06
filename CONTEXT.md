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
- **Current phase:** deployed and auth working (user confirmed end to end at close of session 2/3) -> next: **P2.5 UX pass** (Nielsen audit, 6-box OTP, main-app redesign), then P3
- **Last updated:** 2026-11-05 (end of session 3)
- **Repo:** GitHub `Nyxven` (private), pushed by the user from their Windows/PowerShell machine. The user's push may be behind the newest zip (README + Windows doc fixes). Sandbox commits use placeholder identity "CRIBS Dev <dev@cribs.local>"; the sandbox has no GitHub/Vercel access, so the user pushes.
- **Deployment:** Vercel, live at `https://cribs-ecru.vercel.app` (project domains also `cribs-git-main-gabaii.vercel.app`). Landing/pages load (a 404 earlier was a project-settings issue the user fixed). Deployment was from commit 694a953.
- **Database:** Neon via Vercel Storage (the user briefly had two Neon DBs connected and kept the old one). Tables were created by running `drizzle/0000_*.sql` (also exported as `create_tables.sql`) in Neon's SQL Editor; the GitHub "DB migrate" workflow exists but is not what was used. FUTURE schema changes need a new drizzle migration: generate with `npm run db:generate`, then apply (SQL Editor or the workflow with the `production` environment secret `DATABASE_URL_UNPOOLED`).
- **AI guide:** NOT built (P5). `/ask` is a placeholder page; no AI SDK installed; `AI_*` vars exist only in `.env.example`.

| Phase | Status |
|---|---|
| P0 Scaffold | installed, pinned, typecheck + build pass (Google Fonts can't load in sandbox; fine on Vercel) |
| P1 Auth | live and working (sign-up, emailed code, verify; user-confirmed). 26 unit tests pass |
| P2.5 UX pass | NEXT (see "Session 4 agenda") |
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

## User environment
Windows + PowerShell. Keep commands PowerShell-safe (no `openssl`, `source`, `unzip`; avoid `&&`). The user asked for simpler, shorter instructions: keep steps short and avoid long option lists.

## Env vars
Full copy-paste list and secret/non-secret split: `VERCEL_ENV.md`; template: `.env.example`. Used by code today: NEXT_PUBLIC_APP_URL, TAG_NAME, AUTH_SECRET(+_PREVIOUS), PASSWORD_PEPPER(+_PREVIOUS), DATABASE_URL, DATABASE_URL_UNPOOLED, MAIL_DRIVER, BREVO_API_KEY, MAIL_FROM_EMAIL, MAIL_FROM_NAME. AI/role vars are for later phases. In production `MAIL_DRIVER` must be `brevo` or sign-up email fails by design.

## Resolved in session 3 (lessons)
- Sign-up failed with the generic message. Causes were, in order: tables not created on the DB that Production used (drizzle wraps DB errors as plain `Error`, hiding the cause), then an invalid `BREVO_API_KEY` (Brevo replied `401 unauthorized: Key not found`; needs an **API key `xkeysib-...`** from SMTP & API > API keys, not an SMTP key).
- Logging now shows causes: `[auth] unexpected error: <name>: <message>` and `[mail] send failed: ... Brevo error <status> (<code>: <message>)` (no keys, no recipient). Keep that pattern for new code.
- Vercel "Needs Attention" on `DATABASE_URL*` is only a nudge to mark them Sensitive, not an error. Env changes only apply after a redeploy.
- The user applied some fixes by copying single files; their GitHub history may differ from the zip's. The zip's working tree is the source of truth. Check `git ls-files` for stray root-level `.ts` files (a misplaced `service.ts` once broke the build).
- Brevo is used through its HTTP API only (no SMTP settings needed).

## Session 4 agenda: P2.5 UX pass (user's request, before P3)
Start by asking questions + a plan; wait for "go". Three items:
1. **Nielsen's 10 usability heuristics audit** of every existing screen (landing, sign-up, verify, sign-in, forgot/reset, loader, home, learn module/article, directory, FAQ, nav, settings placeholder, error/404 states). Deliver a findings table (screen, heuristic, problem, severity 0-4, fix), get the user's OK, then fix in granular commits. Especially: visibility of system status (loading/sending states), error prevention and recovery (clear messages, inline validation, password rules shown up front, resend cooldown), consistency, recognition over recall, flexibility, minimalist design, help. Audience is stressed parents of children with ASD: keep cognitive load low, language plain and kind.
2. **OTP screen: 6 individual digit boxes**, based on common UI/UX practice: 6 separate inputs, `inputmode="numeric"`, `autocomplete="one-time-code"` (first box, also enables SMS/email autofill), auto-focus on the first box, auto-advance on typing, Backspace moves back, arrow keys navigate, paste of a 6-digit code fills all boxes, only digits accepted, auto-submit when the 6th digit is entered (with a visible loading state), clear error state (shake/red outline plus text, not color alone) that clears and refocuses the first box, "Resend code" with a visible cooldown timer, shows which email the code went to with a "wrong email?" link, large touch targets (min 44px, ~48-56px boxes), accessible (group `role="group"` + `aria-label`, each box labelled "Digit 1 of 6"), reduced-motion respected. Build as a reusable `OtpInput` component in `src/components/` (UI only, no server imports); used by verify and reset-password steps. Add a unit/component test for paste, backspace and auto-advance.
3. **Redesign the main app (the (app) shell and its pages)**: "scratch the old idea, but keep it the same": new visual design concept, SAME features, content, information architecture and navigation (Home, Directory, Ask center tab, FAQ, Settings; desktop sidebar). Keep logo, name and the warm brand feel. Ask the user before starting: preferred direction (e.g. calmer/minimal vs playful), whether to keep the current palette/themes, any reference apps they like. Must meet WCAG AA, 360px mobile first, reduced motion and sensory-friendly mode intact. Do the redesign after the heuristics audit so findings feed into it. Treat `seed/prototype-reference.html` as no longer binding.
Then P3 (onboarding + profile).

## Blockers / needs from the user
1. Answers about the redesign direction (Session 4 agenda item 3) and which screens matter most.
2. Push the newest commits to GitHub (zip contains them; user pushes from their Windows machine).
3. Later: AI provider key (P5); verified local crisis hotline numbers for `src/config/safety.ts`.

## Known deviations / todo (hardening)
- Missing: ESLint config + import-restriction rules, commitlint, lint-staged, PR template, CODEOWNERS, dependabot, Playwright e2e, seed script (`db:seed` does not exist), `src/config/env.ts` only covers auth vars.
- Pre-commit uses `.githooks` + `scripts/check-secrets.mjs` (activated by `npm run prepare`), not Husky.
- Auth service is tested with a faked repo; real SQL (migration + rate-limit upsert + code upsert) was checked by hand on Postgres 16, not through the Neon HTTP driver.

## Next 5 tasks (each begins with a change plan; wait for "go")
1. Ask the user what they want; run the P2.5 UX pass (Session 4 agenda), plan first, wait for "go".
2. P3: onboarding quiz -> `child` table; guard in `(app)/layout.tsx` (needs a drizzle migration only if the schema changes).
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
- 2026-11-05 (session 3): fixed live sign-up (tables missing on the DB in use, then invalid Brevo API key); added cause logging for auth and mail (+ mail test, 26 tests); user confirmed everything works. User queued the P2.5 UX pass (Nielsen audit, 6-box OTP, main-app redesign) before P3.
- 2026-11-04: user deployed to Vercel (cribs-ecru.vercel.app), fixed a 404 via project settings; sign-up errors with generic message; asked if AI is integrated (no, P5). User is on Windows PowerShell (no openssl; docs now use a Node one-liner; no `&&` in docs).
- 2026-11-03 (session 2): installed + pinned deps; removed Better Auth; built own Neon auth (argon2id + pepper, Brevo OTP, hashed sessions, rate limits, rotation) with 24 tests; applied the logo (assets, Logo component, icons, manifest); tag name set to CRIBS; env docs (VERCEL_ENV.md), secret scanner + hook + CI scan, db-migrate workflow, SETUP_GUIDE.md. Deploy itself is for the user (sandbox can't reach Vercel/GitHub).
