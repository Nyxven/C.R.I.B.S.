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
- **Current phase:** P3 (onboarding quiz + Child Profile) is **written, committed, typechecked and unit-tested, but not yet seen in a browser by the user**. Next: user applies the SQL below, pushes, runs the checks, tries the quiz on a phone -> then **P4 (content)**.
- **Last updated:** 2026-11-07 (end of session 5)
- **Repo:** GitHub `Nyxven` (private), pushed by the user from their Windows/PowerShell machine. The zip's working tree is the source of truth; the user's GitHub copy is behind it (session 3 doc fixes, all of session 4 and all of session 5). Session 5 commits start after `2f53959`. Sandbox commits use placeholder identity "CRIBS Dev <dev@cribs.local>"; the sandbox has no GitHub/Vercel access, so the user pushes.
- **Deployment:** Vercel, live at `https://cribs-ecru.vercel.app` (also `cribs-git-main-gabaii.vercel.app`). The live site is still the pre-session-4 build (commit 694a953) until the user pushes.
- **Database:** Neon via Vercel Storage. Tables were created by running `drizzle/0000_*.sql` (also `create_tables.sql`) in Neon's SQL Editor, so Drizzle's migration journal in the DB does not know about them: **the GitHub 'DB migrate' workflow will fail with "already exists" if it runs; that is expected and harmless.**
  - **Session 5 changed the schema** (`drizzle/0001_blushing_bug.sql`, **NOT yet applied**). Before pushing, the user must run once in Neon's SQL Editor (safe to repeat):
    ```sql
    ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "onboarding_step" integer DEFAULT 0 NOT NULL;
    ALTER TABLE "child" ADD COLUMN IF NOT EXISTS "pronouns" text;
    ```
    If the code is pushed first, every signed-in page errors until the columns exist (`profile` is read in the app layout).
  - FUTURE schema changes: edit `src/db/schema.ts`, run `npm run db:generate` (works offline; set dummy `DATABASE_URL_UNPOOLED` inline), then apply the new SQL in the SQL Editor.
- **AI guide:** NOT built (P5). `/ask` is a friendly "Coming soon" page; no AI SDK installed; `AI_*` vars exist only in `.env.example`.
- **Verified in session 5 (sandbox had npm registry access this time):** `npm ci`, `npm run typecheck` clean, `npm test` 133 passed (92 before, 41 new), a temporary server-render of all 10 quiz screens, and `next build` compiled with `/onboarding` in the route list **only with the Google fonts stubbed** (the sandbox cannot reach Google Fonts; the real build needs your machine). The user's own session 4 checks (typecheck, tests, build) passed.
- **NOT tested in a real browser:** the whole quiz (focus handling, Skip, resume, Edit-from-review, finish animation), the 6-box OTP with paste and autofill, screen reader, 360px layout of the quiz, the new logo on the Ask button.

| Phase | Status |
|---|---|
| P0 Scaffold | done |
| P1 Auth | live and working (sign-up, emailed code, verify; user-confirmed) |
| P2 Shell | done |
| P2.5 UX pass | done; user verified (checks passed, looks good on phone). Ask button now shows the logo |
| P3 Onboarding + Profile | done in code (session 5); needs the user's SQL + push + phone test |
| P4 Content | NEXT: partial today (modules, article, directory, FAQ read seed/content.json; search/progress/DB seed todo) |
| P5 AI Guide | todo |
| P6 Find + If-found | todo (Home shows "Find CRIBS" as a non-link "Coming soon" card) |
| P7 Community/Notifs/Settings | todo (Settings has account info + sign out only; **editing the child profile in Settings belongs here**) |
| P8 Surprise features | todo |
| P9 Hardening | todo |
| P10 Research mode (optional) | todo |

## Project in one paragraph
Mobile-first (PC-usable) web app for parents of children with ASD: 4 guidance modules, directory, FAQ, community, AI guide (center nav tab), onboarding quiz that builds a Child Profile, and Find CRIBS tag (tracker-tag companion with QR "if found" page). Built by Taguig Science High School STEM team (adviser: Kristoffer Paulo L. Ramirez). Two papers: July 2026 proposal (C.R.I.B.S.) and October 2026 (CRIBSEER).

## Stack (decided)
Node.js + Next.js 16 (App Router, TS) · Tailwind v4 · Vercel · Neon via Vercel Storage · Drizzle · **own auth** · Brevo (OTP emails, HTTP API only) · Vercel AI SDK (later; default Claude Haiku-class via `AI_MODEL`, OpenAI fallback) · Vitest + Playwright (e2e todo) · GitHub Actions. Versions pinned exactly in package.json. Icons: `lucide-react`. Zod 4 (`zod` 4.6.7).

## Auth design (session 2, unchanged)
- Email + password; passwords = argon2id (`@node-rs/argon2`, m=19456,t=2,p=1) over HMAC-SHA256(`PASSWORD_PEPPER`, password). Pepper only in Vercel.
- 6-digit email OTP (Brevo) for verify + reset: stored as HMAC with `AUTH_SECRET`, 10-min expiry, 5 attempts, one live code per email+purpose.
- Sessions: random 256-bit cookie token (`cribs_session`, httpOnly/secure/lax), stored only as keyed hash; 7-day idle / 30-day absolute; new token every sign-in; password reset revokes all sessions.
- Rotation: `AUTH_SECRET_PREVIOUS`, `PASSWORD_PEPPER_PREVIOUS`; old hashes upgrade silently at next sign-in.
- Anti-enumeration: same response for known/unknown emails on sign-up and reset; dummy hash work on unknown sign-in; "already have an account" email for existing sign-ups (the verify screen says "No code? Sign in or reset your password").
- DB rate limits (`rate_limit` table) on sign-up, sign-in (per IP and per email), code requests, verify/reset (3 codes per 10 min per email).
- Layers: `src/server/auth/{crypto,repo,session,service,validation}.ts` · UI boundary `src/features/auth/actions.ts` (server actions; `signOutAction` redirects to /sign-in) · forms in `src/components/auth/AuthForms.tsx` import only the actions.
- Known limits: no per-account lockout beyond rate limits; no 2FA; no "sign out other devices" UI; email change and password change (signed in) not built.

## Onboarding / Child Profile design (session 5)
- **Flow:** `/onboarding` (route group `(onboarding)`, no bottom nav, own layout: signed-out -> /sign-in, already finished -> /home). `(app)/layout.tsx` redirects to `/onboarding` when `profile.onboardingCompletedAt` is empty (accounts with no `profile` row count as not onboarded). Finishing -> "You're all set!" screen -> `/home`.
- **10 steps** (`STEPS` in `src/lib/domain/onboarding.ts`): about · child · journey · communication · sensory · calming · challenges (max 3) · daily · safety · review. First two are required (parent name + relationship; child nickname, age in years, optional pronouns); the rest have "Skip for now". Each step saves on Continue; `profile.onboarding_step` is the resume pointer (moves forward only). Resume never goes past a missing required answer. "Edit" on the review screen returns to the review after saving.
- **Skip** is per step: it saves nothing, keeps what was saved before, and moves on. There is no "skip the whole quiz" (the app needs the names). The server enforces that `about`/`child`/`review` cannot be skipped and that later steps need an existing child.
- **Data:** answers land in `profile` (displayName, relationship, onboardingStep, onboardingCompletedAt), `child` (v1: one child per account, the oldest) and `emergency_contact` (v1: one per child; both name and phone or neither; phone normalized to digits with optional +). Sensory stores only real answers (`seeks`/`avoids`); "No strong reaction" = not stored. Empty choices are stored as `null`. Values read back are filtered to the current option lists.
- **Layers:** pure rules + option lists + review summary `src/lib/domain/onboarding.ts` (+test) · Zod schemas shared by client and server `src/features/onboarding/schema.ts` (+test) · `src/server/onboarding/{repo,service}.ts` (+ service test with a faked repo; every child query includes the user id) · server actions `src/features/onboarding/actions.ts` (user comes from the session; logs name+message only, never answers) · client hook `src/features/onboarding/useOnboarding.ts` · UI `src/components/onboarding/{OnboardingFlow,StepFields,ReviewCard,controls,copy}` · pages `src/app/(onboarding)/onboarding/{layout,page}.tsx`. `tagName` reaches the client only as a prop from the server page (`TAG_NAME` is not a public env var).
- **Home** greets with `getGreeting(userId)`: "Hello, {first name}!" and "You and {child}!".
- **Not used yet:** challenges / communication / sensory answers do not personalize anything until P4 ("Recommended for {child}") and P5 (AI starter chips, privacy-filtered). Nothing from the quiz goes to any third party.

## UI layer map (session 4, plus session 5 notes)
- Tokens + shared styles: `src/app/globals.css` (`@theme` tokens from the logo, `.btn-primary/.btn-secondary/.field/.card/.chip/.ribbon-bar/.prose-cribs/.skip-link/.pop-in`, global `:focus-visible` ring, reduced-motion rule). Spec of the palette is in BUILD_CRIBS.md.
- Pure logic (tested): `src/lib/otp.ts`, `src/lib/formChecks.ts`, `src/lib/contrast.ts` + `contrast.test.ts` (reads `globals.css` tokens; add a pair there when you add a color), `src/lib/domain/onboarding.ts`.
- UI components: `src/components/ui/{OtpInput,ComingSoon,LegalPage}.tsx`, `src/components/auth/{AuthForms,PasswordField}.tsx`, `src/components/nav/AppNav.tsx`, `src/components/content/moduleStyle.tsx`, `src/components/{Logo,Loader}.tsx`, `src/components/onboarding/*`. Hooks: `src/features/auth/useCooldown.ts`, `src/features/onboarding/useOnboarding.ts`.
- **Nav (session 5):** the middle Ask button (mobile) shows the logo in a white circle inside the rainbow ring; the desktop "Ask CRIBS" button shows a white logo. Accessible name unchanged. If the logo looks too small on a phone, raise `Logo size` (now 42) in `AppNav.tsx`.
- `OtpInput`: 6 boxes, UI only; to clear it after an error, change its `key`.
- Loader: shown once per browser session; server reads session cookie `cribs_loaded` (name in `src/config/ui.ts`). The 1.8 s timer is a placeholder (real prefetch in P3/P4 still todo). **Lesson:** a constant used by a server component must not live in a `"use client"` file.
- Pages have titles via a `%s · C.R.I.B.S.` template; `(app)` has skip link + `<main id="content">`; mobile has a top bar, desktop a sidebar; Learn pages keep Home lit.
- Audit: `docs/UX_AUDIT.md` (40 findings, status + session 5 note at the bottom).

## Decisions & flags (carry forward)
- D1 Tag name: **CRIBS**; `TAG_NAME` config in `src/config/brand.ts`.
- D2 Paper says GPS/geofence/Firebase, but the tag uses Apple Find My / Google Find Hub (no public API). App deep-links only; no live map; Neon not Firebase. **Paper tests 4.1 and 4.3 assume features the app can't provide — tell the team.**
- D3 Directory entries are sample/fictional → labeled "Sample listing".
- D4 New content is `draft` until experts review (`reviewStatus`).
- D5 Paper's usability formula `2.5 × Σ(x_h)` yields 25–125. Use `(Σx_h − 10) × 2.5` for 0–100. Bangor grades are validated for SUS only. **Tell the team.**
- D6 Child data is sensitive; never send names/contacts to the AI provider; public if-found page uses hashed revocable tokens and opt-in fields.
- D7 Auth is our own on Neon + Brevo; no third-party auth library.
- D8 Logo = user's PNG/JPG cut to transparent (`public/brand/logo.png`), icons generated from it. Raster only; swap in a vector original if the team has one.
- D9 Redesign concept "the ribbon": warm and playful, logo's rainbow loop as the accent, soft tinted cards with dark text, solid dark button gradient (AA at every point). `seed/prototype-reference.html` is no longer binding.
- D10 Only the default theme exists. Sunrise/Ocean/Meadow/Berry/dark/sensory themes return with Appearance settings (P7/P8).
- D11 `/privacy` and `/terms` are **DRAFT placeholders**. The team must write/approve real text (check the Philippine Data Privacy Act of 2012) before real families use the app. **The quiz now collects child data, so this matters more.**
- D12 (session 5) Ask button uses the logo, not the sparkle icon (user request).
- D13 (session 5) Child age is asked in years (not birth year); pronouns optional (she/her, he/him, they/them); relationship is required; v1 = one child and one emergency contact per account.
- Seed content: `seed/content.json` (articles are plain p/ul/b plus `.disclaimer` boxes, styled via `.prose-cribs`). Fonts: Baloo 2 + Nunito. Nav (mobile): Home · Directory · **Ask (AI, center)** · FAQ · Settings. Desktop: sidebar.

## User environment
Windows + PowerShell. Keep commands PowerShell-safe (no `openssl`, `source`, `unzip`; avoid `&&`). The user wants simple, short instructions: keep steps short, no long option lists. The sandbox may or may not have network: in session 5 `npm ci`, typecheck, tests and `db:generate` worked, but Google Fonts could not be fetched, so `next build` needs `src/app/layout.tsx` fonts stubbed temporarily (restore with a copy afterwards) to verify compilation. Vitest only picks up `src/**/*.test.ts` (not `.tsx`); use `createElement` for render tests.

## Env vars
Full copy-paste list and secret/non-secret split: `VERCEL_ENV.md`; template: `.env.example` (both unchanged in session 5; no new vars). Used by code today: NEXT_PUBLIC_APP_URL, TAG_NAME, AUTH_SECRET(+_PREVIOUS), PASSWORD_PEPPER(+_PREVIOUS), DATABASE_URL, DATABASE_URL_UNPOOLED, MAIL_DRIVER, BREVO_API_KEY, MAIL_FROM_EMAIL, MAIL_FROM_NAME. In production `MAIL_DRIVER` must be `brevo` or sign-up email fails by design.

## Lessons (still true)
- Sign-up failed with the generic message in session 3: tables missing on the DB in use, then an invalid `BREVO_API_KEY` (needs an **API key `xkeysib-...`** from SMTP & API > API keys, not an SMTP key).
- Logging shows causes: `[auth] unexpected error: <name>: <message>`, `[onboarding] unexpected error: ...`, `[mail] send failed: ...`. No keys, recipients or answers. Keep that pattern.
- Vercel "Needs Attention" on `DATABASE_URL*` is only a nudge to mark them Sensitive. Env changes apply only after a redeploy.
- Check `git ls-files` for stray root-level `.ts` files. The zip's working tree is the source of truth.
- **Apply schema changes in Neon BEFORE pushing code that reads the new columns.**

## Blockers / needs from the user
1. Run the two `ALTER TABLE` statements in Neon's SQL Editor (see Database above), then push the commits to GitHub; Vercel redeploys.
2. Run `npm ci`, `npm run typecheck`, `npm test`, `npm run build` locally and send the first error if any (the real build, with Google Fonts, has not run on the session 5 code).
3. Try the quiz on a phone (360px): sign in with the existing account, go through the steps, Skip one, close and reopen to check resume, Edit from the review, finish, check Home greets you and the child. Also look at the logo on the Ask button. Send feedback.
4. Team: write real Privacy/Terms text (D11); decide on D2 and D5 flags.
5. Later: AI provider key (P5); verified local crisis hotline numbers for `src/config/safety.ts`.

## Known deviations / todo (hardening)
- Missing: ESLint config + import-restriction rules, commitlint, lint-staged, PR template, CODEOWNERS, dependabot, Playwright e2e, seed script (`db:seed` does not exist), `src/config/env.ts` only covers auth vars.
- No DOM component tests (OtpInput and the quiz are covered through pure logic, services and a one-off server render only). Adding them needs `@testing-library/react` + `jsdom`.
- Inline field errors exist on sign-up only; sign-in, forgot and the quiz use one message box.
- Quiz server actions have no rate limit (session required); no unique index on `child.user_id` (a double submit could create two children; the app uses the oldest); `setContact` is select-then-write, not atomic.
- Editing the profile after onboarding is only possible through the review screen before finishing; Settings editing is P7.
- Pre-commit uses `.githooks` + `scripts/check-secrets.mjs` (activated by `npm run prepare`), not Husky.
- Auth service and onboarding service are tested with a faked repo; real SQL was not run through the Neon HTTP driver in the sandbox (the `greatest(...)` and `coalesce(...)` upserts in `src/server/onboarding/repo.ts` are the parts to watch on first use).

## Next 5 tasks (each begins with a change plan; wait for "go")
1. Ask the user what they want and for their results (Blockers 1-3); fix any build error, SQL problem or quiz/nav feedback first.
2. P4 Content: seed script (`db:seed`), search across articles/FAQ/directory, progress + saved, and the "Recommended for {child}" row using `challenges` from the profile.
3. P7 slice: Settings > edit child profile (reuse `StepFields` and the onboarding service), change password, sign out other devices.
4. Hardening todo above (ESLint import rules, Playwright e2e for sign-up -> quiz -> home, dependabot, DOM tests, rate limit on quiz actions).
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
(Schema changes: `npm run db:generate`, then run the new SQL in Neon's SQL Editor; see SETUP_GUIDE.md step 6.)

## Session log
- 2026-11-02: Build prompt, context, env template, seed content generated; P0-P2 scaffold written (unverified).
- 2026-11-02: User added working rules (plan-then-go, granular commits, no force push, no secrets, logic/UI separation, CI/CD, handoff files).
- 2026-11-03 (session 2): installed + pinned deps; removed Better Auth; built own Neon auth (argon2id + pepper, Brevo OTP, hashed sessions, rate limits, rotation) with 24 tests; applied the logo; tag name CRIBS; env docs, secret scanner + hook + CI scan, db-migrate workflow, SETUP_GUIDE.md.
- 2026-11-04: user deployed to Vercel (cribs-ecru.vercel.app), fixed a 404 via project settings; sign-up errored with a generic message; user is on Windows PowerShell.
- 2026-11-05 (session 3): fixed live sign-up (tables missing, then invalid Brevo API key); added cause logging (26 tests); user confirmed it works; queued the P2.5 UX pass.
- 2026-11-06 (session 4): Nielsen audit (40 findings), 6-box OtpInput, "ribbon" redesign on logo-based tokens, audit fixes; about 44 small commits; not built in the sandbox.
- 2026-11-07 (session 5): user's checks all passed and the redesign looked good on a phone; their only change was the Ask button logo (done). User chose to go straight to P3 and answered the plan questions (pronouns fine, age in years), then said "go". Built P3 in 19 granular commits plus docs: schema + migration 0001, domain rules, Zod schemas, repo/service, actions, hook, step forms, review, stepper flow, quiz page, onboarding redirect, Home greeting. 133 tests pass (41 new); typecheck clean; build compiles with fonts stubbed. User's last answer to "what next?": "handoff".
