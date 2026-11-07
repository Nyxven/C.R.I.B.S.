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
8. **Always deliver handoff files** (only when the user asks for the handoff): CONTEXT.md, BUILD_CRIBS.md (if changed), .env.example, SETUP_GUIDE.md, VERCEL_ENV.md, zip.

## Status
- **Current phase:** P2.5 UX pass is **written and committed, not yet verified by the user** -> next: user runs typecheck/test/build and looks at the redesign on a phone, then **P3 (onboarding + profile)**.
- **Last updated:** 2026-11-06 (end of session 4)
- **Repo:** GitHub `Nyxven` (private), pushed by the user from their Windows/PowerShell machine. The zip's working tree is the source of truth; the user's GitHub copy is behind it (session 3 doc fixes + all of session 4 = about 41 commits since 535e775). Sandbox commits use placeholder identity "CRIBS Dev <dev@cribs.local>"; the sandbox has no GitHub/Vercel access, so the user pushes.
- **Deployment:** Vercel, live at `https://cribs-ecru.vercel.app` (also `cribs-git-main-gabaii.vercel.app`). The live site is still the pre-session-4 build (commit 694a953) until the user pushes.
- **Database:** Neon via Vercel Storage. Tables were created by running `drizzle/0000_*.sql` (also `create_tables.sql`) in Neon's SQL Editor. Session 4 changed NO schema, so no migration is needed. FUTURE schema changes: `npm run db:generate`, then apply (SQL Editor or the workflow with the `production` environment secret `DATABASE_URL_UNPOOLED`).
- **AI guide:** NOT built (P5). `/ask` is now a friendly "Coming soon" page; no AI SDK installed; `AI_*` vars exist only in `.env.example`.
- **NOT verified in session 4:** the sandbox had no network, so `npm run typecheck`, the full `npm test` and `next build` were not run. Verified only: new unit tests (otp 18, contrast 41, formChecks 7) via a tiny vitest shim, a syntax pass over all 54 source files, `@/` import resolution, and a server-render of OtpInput/PasswordField. Most likely failure: a `lucide-react` icon name (new ones used: BookOpen, MessageCircle, Heart, GraduationCap, Stethoscope, ChevronDown, ChevronRight, ArrowLeft, Eye, EyeOff, Check). If `build` fails, read the first error.
- **NOT tested in a real browser:** the 6-box OTP with real paste, SMS/email autofill (iOS/Android), screen reader, and the redesign on a 360px phone. Ask the user for feedback.

| Phase | Status |
|---|---|
| P0 Scaffold | done |
| P1 Auth | live and working (sign-up, emailed code, verify; user-confirmed). 26 unit tests |
| P2 Shell | done |
| P2.5 UX pass | done in code (audit, 6-box OTP, redesign, audit fixes); needs the user's verify + push |
| P3 Onboarding + Profile | NEXT (add redirect in `(app)/layout.tsx`, there is a TODO) |
| P4 Content | partial: modules, article, directory, FAQ read seed/content.json; search/progress/DB seed todo |
| P5 AI Guide | todo |
| P6 Find + If-found | todo (Home shows "Find CRIBS" as a non-link "Coming soon" card) |
| P7 Community/Notifs/Settings | todo (Settings has account info + sign out only) |
| P8 Surprise features | todo |
| P9 Hardening | todo |
| P10 Research mode (optional) | todo |

## Project in one paragraph
Mobile-first (PC-usable) web app for parents of children with ASD: 4 guidance modules, directory, FAQ, community, AI guide (center nav tab), onboarding quiz that builds a Child Profile, and Find CRIBS tag (tracker-tag companion with QR "if found" page). Built by Taguig Science High School STEM team (adviser: Kristoffer Paulo L. Ramirez). Two papers: July 2026 proposal (C.R.I.B.S.) and October 2026 (CRIBSEER).

## Stack (decided)
Node.js + Next.js 16 (App Router, TS) · Tailwind v4 · Vercel · Neon via Vercel Storage · Drizzle · **own auth** · Brevo (OTP emails, HTTP API only) · Vercel AI SDK (later; default Claude Haiku-class via `AI_MODEL`, OpenAI fallback) · Vitest + Playwright (e2e todo) · GitHub Actions. Versions pinned exactly in package.json. Icons: `lucide-react`.

## Auth design (session 2, unchanged)
- Email + password; passwords = argon2id (`@node-rs/argon2`, m=19456,t=2,p=1) over HMAC-SHA256(`PASSWORD_PEPPER`, password). Pepper only in Vercel.
- 6-digit email OTP (Brevo) for verify + reset: stored as HMAC with `AUTH_SECRET`, 10-min expiry, 5 attempts, one live code per email+purpose.
- Sessions: random 256-bit cookie token (`cribs_session`, httpOnly/secure/lax), stored only as keyed hash; 7-day idle / 30-day absolute; new token every sign-in; password reset revokes all sessions.
- Rotation: `AUTH_SECRET_PREVIOUS`, `PASSWORD_PEPPER_PREVIOUS`; old hashes upgrade silently at next sign-in.
- Anti-enumeration: same response for known/unknown emails on sign-up and reset; dummy hash work on unknown sign-in; "already have an account" email for existing sign-ups (so that case shows the code screen but no code arrives: the verify screen now says "No code? Sign in or reset your password").
- DB rate limits (`rate_limit` table) on sign-up, sign-in (per IP and per email), code requests, verify/reset (3 codes per 10 min per email).
- Layers: `src/server/auth/{crypto,repo,session,service,validation}.ts` · UI boundary `src/features/auth/actions.ts` (server actions; `signOutAction` now redirects to /sign-in) · forms in `src/components/auth/AuthForms.tsx` import only the actions.
- Known limits: no per-account lockout beyond rate limits; no 2FA; no "sign out other devices" UI; email change and password change (signed in) not built.

## UI layer map (session 4)
- Tokens + shared styles: `src/app/globals.css` (`@theme` tokens from the logo, `.btn-primary/.btn-secondary/.field/.card/.chip/.ribbon-bar/.prose-cribs/.skip-link`, global `:focus-visible` ring, reduced-motion rule). Spec of the palette is in BUILD_CRIBS.md.
- Pure logic (tested): `src/lib/otp.ts` (+test), `src/lib/formChecks.ts` (+test), `src/lib/contrast.ts` + `contrast.test.ts` (reads `globals.css` tokens; add a pair there when you add a color).
- UI components: `src/components/ui/{OtpInput,ComingSoon,LegalPage}.tsx`, `src/components/auth/{AuthForms,PasswordField}.tsx`, `src/components/nav/AppNav.tsx`, `src/components/content/moduleStyle.tsx` (icon + tint per module), `src/components/{Logo,Loader}.tsx`. Hook: `src/features/auth/useCooldown.ts`.
- `OtpInput`: 6 boxes, UI only; to clear it after an error, change its `key`. Parent supplies `onComplete` (auto-submit) and shows the error text itself.
- Loader: shown once per browser session; server reads session cookie `cribs_loaded` (name in `src/config/ui.ts`) so repeat loads skip it. The 1.8 s timer is a placeholder (replace with real prefetch in P3/P4). **Lesson:** a constant used by a server component must not live in a `"use client"` file.
- Pages have titles via a `%s · C.R.I.B.S.` template; `(app)` has skip link + `<main id="content">`; mobile has a top bar, desktop a sidebar; Learn pages keep Home lit.
- Audit: `docs/UX_AUDIT.md` (40 findings, status at the bottom).

## Decisions & flags (carry forward)
- D1 Tag name: **CRIBS**; `TAG_NAME` config in `src/config/brand.ts`.
- D2 Paper says GPS/geofence/Firebase, but the tag uses Apple Find My / Google Find Hub (no public API). App deep-links only; no live map; Neon not Firebase. **Paper tests 4.1 and 4.3 assume features the app can't provide — tell the team.**
- D3 Directory entries are sample/fictional → labeled "Sample listing".
- D4 New content is `draft` until experts review (`reviewStatus`).
- D5 Paper's usability formula `2.5 × Σ(x_h)` yields 25–125. Use `(Σx_h − 10) × 2.5` for 0–100. Bangor grades are validated for SUS only. **Tell the team.**
- D6 Child data is sensitive; never send names/contacts to the AI provider; public if-found page uses hashed revocable tokens and opt-in fields.
- D7 Auth is our own on Neon + Brevo; no third-party auth library.
- D8 Logo = user's PNG/JPG cut to transparent (`public/brand/logo.png`), icons generated from it. Raster only; swap in a vector original if the team has one.
- D9 (session 4) Redesign concept "the ribbon": warm and playful (user's choice), logo's rainbow loop as the accent, soft tinted cards with dark text, solid dark button gradient (purple to coral, AA at every point), same features/content/navigation. `seed/prototype-reference.html` is no longer binding.
- D10 (session 4) Only the default theme exists. The Sunrise/Ocean/Meadow/Berry/dark/sensory themes come back with Appearance settings (P7/P8).
- D11 (session 4) `/privacy` and `/terms` are **DRAFT placeholders** (banner on the page, `TODO(team)` in code). The team must write/approve real text (check the Philippine Data Privacy Act of 2012) before real families use the app. Sign-up consent links to them.
- Seed content: `seed/content.json` (articles are plain p/ul/b plus `.disclaimer` boxes, styled via `.prose-cribs`). Fonts: Baloo 2 + Nunito. Nav (mobile): Home · Directory · **Ask (AI, center)** · FAQ · Settings. Desktop: sidebar.

## User environment
Windows + PowerShell. Keep commands PowerShell-safe (no `openssl`, `source`, `unzip`; avoid `&&`). The user wants simple, short instructions: keep steps short, no long option lists. The sandbox may have no network (session 4): `/opt/npm-tools/node_modules` has typescript, react, react-dom, esbuild; Node 22 can run `.ts` directly, so pure logic tests can run with a small vitest shim.

## Env vars
Full copy-paste list and secret/non-secret split: `VERCEL_ENV.md`; template: `.env.example` (both unchanged in session 4; no new vars). Used by code today: NEXT_PUBLIC_APP_URL, TAG_NAME, AUTH_SECRET(+_PREVIOUS), PASSWORD_PEPPER(+_PREVIOUS), DATABASE_URL, DATABASE_URL_UNPOOLED, MAIL_DRIVER, BREVO_API_KEY, MAIL_FROM_EMAIL, MAIL_FROM_NAME. In production `MAIL_DRIVER` must be `brevo` or sign-up email fails by design.

## Lessons from session 3 (still true)
- Sign-up failed with the generic message: tables missing on the DB in use, then an invalid `BREVO_API_KEY` (needs an **API key `xkeysib-...`** from SMTP & API > API keys, not an SMTP key).
- Logging shows causes: `[auth] unexpected error: <name>: <message>` and `[mail] send failed: ... Brevo error <status> (<code>: <message>)` (no keys, no recipient). Keep that pattern.
- Vercel "Needs Attention" on `DATABASE_URL*` is only a nudge to mark them Sensitive. Env changes apply only after a redeploy.
- Check `git ls-files` for stray root-level `.ts` files. The zip's working tree is the source of truth.

## Blockers / needs from the user
1. Run `npm ci`, `npm run typecheck`, `npm test`, `npm run build` locally and send the first error if any.
2. Look at the redesign on a phone (360px) and in a desktop browser; try the 6-box code with paste and email autofill; tell me what to change.
3. Push the commits to GitHub (zip contains them); Vercel redeploys.
4. Team: write real Privacy/Terms text (D11); decide on D2 and D5 flags.
5. Later: AI provider key (P5); verified local crisis hotline numbers for `src/config/safety.ts`.

## Known deviations / todo (hardening)
- Missing: ESLint config + import-restriction rules, commitlint, lint-staged, PR template, CODEOWNERS, dependabot, Playwright e2e, seed script (`db:seed` does not exist), `src/config/env.ts` only covers auth vars.
- No DOM component tests (OtpInput is covered through its pure logic only). Adding them needs `@testing-library/react` + `jsdom` and an updated lockfile: do it on the user's machine (`npm i -D ...`).
- Inline field errors exist on sign-up only; sign-in and forgot use one message box (audit S2).
- Pre-commit uses `.githooks` + `scripts/check-secrets.mjs` (activated by `npm run prepare`), not Husky.
- Auth service is tested with a faked repo; real SQL was checked by hand on Postgres 16, not through the Neon HTTP driver.

## Next 5 tasks (each begins with a change plan; wait for "go")
1. Ask the user what they want and for their verify/feedback results (Blockers 1-2); fix any build error or redesign feedback first.
2. P3: onboarding quiz -> `child` table; guard in `(app)/layout.tsx` (drizzle migration only if the schema changes).
3. Settings: change password, sign out other devices, then Appearance (themes + sensory mode) when ready.
4. Hardening todo above (ESLint import rules, Playwright e2e for auth, dependabot, DOM tests).
5. Update this file, regenerate zip.

## Resume commands
```
npm ci
copy .env.example .env.local      # fill values (see VERCEL_ENV.md)
vercel link
vercel env pull .env.local
npm run typecheck
npm test
npm run build
npm run dev
```
(Migrations run via the GitHub 'DB migrate' workflow or Neon's SQL Editor; see SETUP_GUIDE.md.)

## Session log
- 2026-11-02: Build prompt, context, env template, seed content generated; P0-P2 scaffold written (unverified).
- 2026-11-02: User added working rules (plan-then-go, granular commits, no force push, no secrets, logic/UI separation, CI/CD, handoff files).
- 2026-11-03 (session 2): installed + pinned deps; removed Better Auth; built own Neon auth (argon2id + pepper, Brevo OTP, hashed sessions, rate limits, rotation) with 24 tests; applied the logo; tag name CRIBS; env docs, secret scanner + hook + CI scan, db-migrate workflow, SETUP_GUIDE.md.
- 2026-11-04: user deployed to Vercel (cribs-ecru.vercel.app), fixed a 404 via project settings; sign-up errored with a generic message; user is on Windows PowerShell.
- 2026-11-05 (session 3): fixed live sign-up (tables missing, then invalid Brevo API key); added cause logging (26 tests); user confirmed it works; queued the P2.5 UX pass.
- 2026-11-06 (session 4): asked questions (user chose warm and playful; colors from the logo; priority screens Home, Learn, Directory + FAQ, nav). Wrote the Nielsen audit (40 findings) and got the user's OK. Built the 6-box OtpInput (pure logic + tests, cooldown hook) on verify and reset. Redesigned shell, nav, Home, Learn, Directory, FAQ on new logo-based tokens (contrast test). Fixed audit items: sign-out, coming-soon pages, 404/error pages, titles, skip link, loader flash, sign-up inline errors + password rule + show/hide, sign-in reset notice, legal draft pages. About 41 small commits; typecheck/test/build not run (no network).
