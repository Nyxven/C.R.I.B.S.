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
- **Current phase:** P4 (content), P5 (AI guide) and a **security/abuse-protection pass for a free AI model ("Stage 1" of the "finish the backend today" plan)** are **written, committed, typechecked, unit-tested and compiled, but not yet applied to the database, pushed, or seen by the user**. Also done in session 6: quiz smoothness pass; the GitHub "DB migrate" error fix. **Stage 1 needs no new SQL** (it reuses the `rate_limit` table). **Stages 2-5 of the agreed plan are NOT started** (see Next tasks). Next: the user follows `SETUP_GUIDE.md` section 0 (SQL 0002, seed, push, env vars) and tests on a phone.
- **Last updated:** 2026-11-08 (end of session 6)
- **Repo:** GitHub `Nyxven/C.R.I.B.S.` (private), pushed by the user from Windows/PowerShell. The zip's working tree is the source of truth. Session 6 commits start after `58217fc` (61 commits plus 4 handoff docs commits). The user's GitHub has an extra merge commit ("Merge remote-tracking branch 'origin/main'") that the sandbox history does not contain, so before pushing the user runs `git fetch origin` then `git merge origin/main` (see SETUP_GUIDE section 0). Never force push. Sandbox commits use the placeholder identity "CRIBS Dev <dev@cribs.local>"; the sandbox has no GitHub/Vercel access.
- **Deployment:** Vercel, `https://cribs-ecru.vercel.app`. As far as known, live runs the session 5 code (user ran the 2 ALTER TABLE statements and pushed it). Session 6 is not pushed yet.
- **Database:** Neon via Vercel Storage. Tables were created by hand in Neon's SQL Editor (`drizzle/0000_*.sql`), so Drizzle's migration journal in the DB does not know about them. `drizzle/0001_blushing_bug.sql` (2 ALTERs) was applied by the user in session 6.
  - **`drizzle/0002_warm_catseye.sql` is NOT applied yet.** It creates `module`, `article`, `faq`, `professional`, `article_progress`. It is written to be **safe to run twice** (IF NOT EXISTS, constraints in DO blocks). Run it in Neon's SQL Editor, **then run `npm run db:seed`, then push.** If the code goes live first, pages that read guides error or show "Guides are being set up".
  - **DB migrate workflow** (`.github/workflows/db-migrate.yml`) is now **manual only** (workflow_dispatch) and checks the secret first. The session 6 failure (`url: ''`) meant the `DATABASE_URL_UNPOOLED` secret was missing in the GitHub `production` environment; running it would also fail with "already exists". Nothing needs fixing: just do not run it. Apply SQL by hand.
  - FUTURE schema changes: edit `src/db/schema.ts`, run `npm run db:generate` (offline; set a dummy `DATABASE_URL_UNPOOLED` inline), then apply the new SQL in the SQL Editor. Keep generated SQL repeatable like 0002.
- **AI guide:** built (P5) and hardened for a free model; **off until the provider variables are set in Vercel** (`AI_PROVIDER`, `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`, or `AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`). Without them `/ask` says "The guide is not available right now" and offers search/FAQ; emergency replies still work. The user said they run it on a **free model** (provider not named yet; defaults assume Gemini-style free-tier limits). **Deploy the security pass before adding any AI key.**
- **Verified in session 6 (sandbox, npm registry reachable, Google Fonts not):** `npm ci`, `npm run typecheck` clean, `npm test` **354 passed** (133 at the start of the session), `next build` compiled with the Google fonts stubbed (real build needs the user's machine). Also run for real on in-process Postgres (pglite, outside the repo, temp tests deleted afterwards): migrations 0000-0002 (0002 twice), the seed upserts, the progress upserts, the abuse-guard SQL (limits, token counters, locks, flags, cleanup) and the maintenance deletes; the Anthropic provider against a local fake streaming server; the OpenAI-compatible provider against fake SSE streams. User's own results at the start of session 6: typecheck, tests and build all passed on their PC for the session 5 code; the Ask logo is fine; the quiz needed to be "smoother and easier to answer" (done).
- **NOT tested:** anything in a real browser or phone for the new work (quiz sticky bar and fade, search, Save/Read, progress, Saved page, Recommended, directory filter, Ask chat, composer above the mobile nav, Turnstile widget), **any live model provider** (Gemini/OpenRouter/Groq/Anthropic: streaming, citations, answer quality, the exact provider usage fields), real Neon through the HTTP driver for the new SQL (identical statements ran on pglite), `npm run db:seed` against Neon, the Vercel cron call, Cloudflare Turnstile end to end, and the real build with Google Fonts.

| Phase | Status |
|---|---|
| P0 Scaffold | done |
| P1 Auth | live and working (sign-up, emailed code, verify; user-confirmed) |
| P2 Shell | done |
| P2.5 UX pass | done; user verified (checks passed, looks good on phone). Ask button now shows the logo |
| P3 Onboarding + Profile | done; user ran SQL and checks; smoothness pass done in session 6 (needs phone re-test) |
| P4 Content | done in code (session 6): content in Neon via `db:seed`, search, Save/Read + progress, Saved page, Recommended row, directory filter. Needs SQL + seed + push |
| P5 AI Guide | done in code (session 6) incl. abuse protection and free-model support. **P5b todo:** chat history (30 days + delete), thumbs feedback; optional starter-answer cache |
| P6 Find + If-found | todo (Home shows "Find CRIBS" as a non-link "Coming soon" card) |
| P7 Community/Notifs/Settings | todo (Settings has account info + sign out only; **editing the child profile in Settings belongs here**) |
| P8 Surprise features | todo |
| P9 Hardening | todo |
| P10 Research mode (optional) | todo |

## Project in one paragraph
Mobile-first (PC-usable) web app for parents of children with ASD: 4 guidance modules, directory, FAQ, community, AI guide (center nav tab), onboarding quiz that builds a Child Profile, and Find CRIBS tag (tracker-tag companion with QR "if found" page). Built by Taguig Science High School STEM team (adviser: Kristoffer Paulo L. Ramirez). Two papers: July 2026 proposal (C.R.I.B.S.) and October 2026 (CRIBSEER).

## Stack (decided)
Node.js + Next.js 16 (App Router, TS) · Tailwind v4 · Vercel · Neon via Vercel Storage · Drizzle · **own auth** · Brevo (OTP emails, HTTP API only) · `@anthropic-ai/sdk` 1.3.0 called directly (Claude Haiku via `AI_MODEL`, default `claude-haiku-5-5`; no OpenAI, no Vercel AI SDK) · Vitest + Playwright (e2e todo) · GitHub Actions. Versions pinned exactly in package.json. Icons: `lucide-react`. Zod 4 (`zod` 4.6.7).

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

## Content layer design (session 6, P4)
- **Tables** (`src/db/schema.ts`): `module`, `article` (slug is the key; `html`, `reviewStatus`, `sortOrder`), `faq`, `professional` (`verifiedAt` empty = "Sample listing"), `article_progress` (PK user + article slug; `saved`, `read`, `readAt`; cascades). Seeded by `scripts/seed.ts` (`npm run db:seed`) from `seed/content.json` through the pure mapper `src/server/content/seedRows.ts` (+test). Seed **upserts by id, never deletes, and never touches `reviewStatus`, `verifiedAt` or `source`** once set. FAQ ids are positional (`faq-01`...), so add new questions at the end of the file. The script uses `DATABASE_URL_UNPOOLED` (falls back to `DATABASE_URL`) and loads `.env.local` if present.
- **Reading:** `src/server/content/{repo,service}.ts` (repo = only DB reader; service returns plain objects; `groupModules` is pure and tested). Pages Home, Learn, article, Directory and FAQ read through the service. **The public landing page (`(marketing)/page.tsx`) still reads `src/content` (the JSON) on purpose**, so it needs no database. `src/content/index.ts` now serves only the seed script, the landing page and tests.
- **Pure rules** (`src/lib/domain/`, all tested): `content.ts` (types, `stripHtml`, `isExpertReviewed`, `isSampleListing`, `slugify`, `rolesOf`, `filterByRole`), `search.ts`, `progress.ts`, `recommend.ts`.
- **Search:** `/search?q=` is a server-rendered GET form (works without JS) with a box on Home. Every word must match the start of a word; title > label > body; accents ignored; snippet around the match; 2-80 characters. Searches guides, FAQs and listings. No search-as-you-type (not built).
- **Progress:** `src/server/progress/{repo,service}.ts` (every query has the user id; the service validates the slug and that the guide exists), server actions `src/features/content/actions.ts` (user from session), hook `useArticleActions` (updates first, undoes on failure), UI `ArticleActions`, `ProgressBar`. Module pages show "2 of 3 read" and a check on read guides; Home cards show the same; `/saved` lists saved guides (linked from Home).
- **Recommended for {child}** (`src/lib/domain/recommend.ts`, service `src/server/content/recommendations.ts`): up to 3 unread guides, reasons shown. Rules use only matches the guide text really supports: meltdowns, transitions, sleep (routines), eating (sensory), communication, school; any sensory avoid/seek; few words or non-speaking; journey stage; fallback starter guides. **Gap: wandering, toileting, screen time and safety outside have no guide**, so they recommend nothing (the user said they will fix this later: write `draft` guides, then add rules).
- **Directory:** role filter chips via `?role=` (server-rendered).
- Not built from the P4 spec: text-size control, table of contents, related articles, search-as-you-type.

## AI guide design (session 6, P5)
- **Flow:** `/ask` page (server: starter chips from the quiz, `isAiConfigured()`) -> `ChatView` -> `useChat` -> `POST /api/chat` (`src/app/api/chat/route.ts`: same-origin check, session, body size and shape checks) -> `startChat` in `src/server/ai/service.ts` -> `src/server/ai/provider.ts` (the only file that talks to Anthropic; 30 s timeout, 1 retry). The route streams one JSON event per line (`start`, `text`, `done` with sources, `error`; `src/lib/ai/events.ts`).
- **Order of checks in `startChat`:** clean input (1,000 chars, last 6 turns, control characters removed) -> **emergency keyword check (no model, no key, no rate limit needed)** -> key present (else 503) -> rate limit `chat:{userId}` via `hitRateLimit` (default 30/hour, `AI_RATE_LIMIT_PER_HOUR`; 429) -> stream. Max 700 output tokens.
- **Safety:** `src/lib/ai/safety.ts` detects self-harm, abuse (incl. fear of hurting the child), missing child, medical emergency in English/Filipino/Taglish and returns fixed replies with **911** (`src/config/safety.ts`; `CRISIS_LINES` is empty until the team verifies numbers; never invent numbers). Patterns target "right now" phrasing, not questions like "what is a seizure?". It is a safety net, not a classifier.
- **Privacy:** the model sees only the system prompt, the knowledge entries (guides, FAQs, listings as escaped data), an age band, communication level, sensory flags, challenges and school setting (`pickChildContext` + `buildChildContext`). Never names, email, phone or the emergency contact (tests enforce this). Only token counts are logged (`[ai] usage`), never questions, answers or user ids.
- **Citations:** the model writes `[[id]]`; `splitCitations` keeps only ids that exist (guide slug, `faq-NN`, listing id) and the UI shows chips; markers are hidden while streaming.
- **Client:** pure state rules `src/features/ask/chatState.ts` (+test), hook `useChat` (stop on leave, retry), `src/components/ask/{ChatView,Message,Composer}.tsx`. Plain text only (no HTML rendering). The composer is sticky above the mobile nav (`bottom-[calc(5.75rem+env(safe-area-inset-bottom))]`): **check this on a phone**.
- **Not built (P5b):** chat history (30 days, delete), thumbs up/down, stop button, conversation titles.

## Security layer design (session 6, Stage 1)
Full table in `docs/CLOUDFLARE.md`. The rules, in code:
- **Client address:** `src/lib/net/clientIp.ts` trusts only the platform's headers chosen by `TRUST_PROXY` (`vercel` default: `x-vercel-forwarded-for`, `x-real-ip`, `x-forwarded-for`; `cloudflare`: `cf-connecting-ip` only; `none`: nothing). Values must be real IPs; IPv6 shrinks to its /64; the result is a keyed HMAC bucket (`ipBucketKey`, secret = `AUTH_SECRET`), never a raw address. Unknown address = one shared strict bucket. `src/server/security/request.ts` -> `requestIpBucket(headers)` is used by the chat route and the auth actions. **Do not set `TRUST_PROXY=cloudflare` while `*.vercel.app` is reachable directly** (the header could be forged).
- **Guard:** `src/lib/security/guard.ts` (`AbuseGuard`: `consume` with amounts, `used`, `lock`/`unlock`, `flag`/`flagged`, plus `firstBroken(rules)`), database version `src/server/security/repo.ts` (`dbGuard`, atomic statements on `rate_limit`), in-memory twin `memoryGuard` for tests. Counting is fixed-window: a window starts at the first hit.
- **AI limits** (`src/lib/ai/policy.ts`, numbers from env, defaults deliberately small): per address (minute x2 of the person limit, hour = 2x person hour), per person (minute 2-6, hour 20, day 60; **accounts under 24 h old: 15/day**), per person daily token budget (40k), app-wide minute (10) and day (400) and daily tokens (400k). Order in `startChat` (`src/server/ai/service.ts`): clean input -> **emergency check (never limited, never calls the model)** -> configured? -> provider cooldown flag -> address limits -> token budgets -> per-person lock (one answer at a time, 45 s TTL, released in `finally`) -> person limits -> app-wide limits -> stream. Person/address limits run before app-wide ones so one abuser cannot drain the shared budget. After an answer, real token usage is added to the person and app counters.
- **Provider trouble:** `ProviderError` kinds (`rate_limited`, `quota`, `auth`, `unavailable`) set a global cooldown flag (60-300 s, 15 min for quota, 10 min for auth) so a failing provider is not hammered. Error text never includes the provider's response body. Errors are logged with API-key-looking strings removed.
- **Cost shaping:** `MAX_INPUT_CHARS` 600, `MAX_HISTORY_MESSAGES` 4, assistant history capped at 2,000 chars, `AI_MAX_OUTPUT_TOKENS` 450. `scrubPii` replaces emails, links and 9+ digit numbers in every user turn before the provider sees it (the emergency check sees the original text).
- **Providers:** `AI_PROVIDER=openai-compatible` (default; `src/server/ai/openaiCompat.ts`, plain `fetch` + SSE parser `src/lib/ai/sse.ts`, works with any OpenAI-style `/chat/completions` stream; usage estimated at ~4 chars/token when the provider omits it) or `anthropic` (SDK 1.3.0). Config in `getAiConfig` (`src/config/env.ts`, per-variable lenient parsing, `aiReady`). `AI_BASE_URL` must be https (or localhost).
- **Auth side:** rate-limit keys are `limiterKey(...)` HMACs (no emails or buckets stored readable); per-address sign-ups also capped at 20/day; **global email cap** `MAIL_DAILY_CAP` (default 250/day; the free mail plan has a daily limit) applied to every code and existing-account email; optional **Cloudflare Turnstile** (`src/server/security/turnstile.ts`, widget `src/components/auth/Turnstile.tsx`, only when `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` are set; fails closed; required on sign-up and the first "forgot password" request; the reset **resend** uses `resendResetAction` with `{bot:false}` and stays rate-limited and email-capped). Sign-in is not bot-checked (it has its own limits).
- **Chat route** (`src/app/api/chat/route.ts`): same-origin check, `Content-Type: application/json` required (415), sign-in required, 30 KB body cap, `Retry-After: 60` on 429/503.
- **Cleanup cron:** `vercel.json` calls `/api/cron/cleanup` daily (`Authorization: Bearer $CRON_SECRET`, constant-time check, closed when no secret): deletes expired limiter rows (>1 h old), sessions, login codes, and accounts never verified within 7 days. Vercel Hobby allows this once-a-day schedule.
- **Not built:** answer cache for starter questions (idea: cache first-turn starter-chip answers generated WITHOUT child context for 7 days; needs a table), FAQ fast path, strict CSP/security headers (Stage 5), bot check on sign-in, per-IP limits on the public found-page (Stage 3).

## UI layer map (session 4, plus session 5 notes)
- Tokens + shared styles: `src/app/globals.css` (`@theme` tokens from the logo, `.btn-primary/.btn-secondary/.field/.card/.chip/.ribbon-bar/.prose-cribs/.skip-link/.pop-in`, global `:focus-visible` ring, reduced-motion rule). Spec of the palette is in BUILD_CRIBS.md.
- Pure logic (tested): `src/lib/otp.ts`, `src/lib/formChecks.ts`, `src/lib/contrast.ts` + `contrast.test.ts` (reads `globals.css` tokens; add a pair there when you add a color), `src/lib/domain/onboarding.ts`.
- UI components: `src/components/ui/{OtpInput,ComingSoon,LegalPage}.tsx`, `src/components/auth/{AuthForms,PasswordField}.tsx`, `src/components/nav/AppNav.tsx`, `src/components/content/moduleStyle.tsx`, `src/components/{Logo,Loader}.tsx`, `src/components/onboarding/*`. Hooks: `src/features/auth/useCooldown.ts`, `src/features/onboarding/useOnboarding.ts`.
- **Quiz smoothness pass (session 6):** the Continue/Back bar is sticky at the bottom of the quiz (`sticky`, not `fixed`, so it behaves with the phone keyboard); **Skip moved to the top-right next to "Step n of 10"**; each step fades in (`.step-in` in `globals.css`, off under reduced motion) and the page scrolls to the top on a new step; sensory buttons say Fine / Avoids / Seeks (UI labels only; saved values unchanged); Calming and Interests have tap-to-add chips (`appendIdea`, `CALMING_IDEAS`, `INTEREST_IDEAS` in the domain file, tested); the challenges counter explains the limit; the first screen says "about 2 minutes". Not done on purpose: auto-advance on tap (accessibility, accidental taps).
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
- D14 (session 6) Guides, FAQs and listings live in Neon and are loaded by `npm run db:seed`; the public landing page still reads the JSON. The seed never downgrades review status.
- D15 (session 6) "Recommended" only uses guide-to-challenge matches the text supports; uncovered challenges recommend nothing rather than something loose.
- D16 (session 6) AI: Anthropic only, SDK pinned to 1.3.0 (newest versions younger than 14 days are avoided on purpose). Emergency check runs before the model. No chat history in v1 (child-related conversations are not stored until a retention and delete design is approved).
- D17 (session 6) Chat and progress writes: user id always from the session, never from the request.
- D18 (session 6) Abuse protection lives in the app (works on Vercel without Cloudflare); Cloudflare adds only the free Turnstile check. We do not proxy through Cloudflare for now (see `docs/CLOUDFLARE.md`).
- D19 (session 6) AI provider default is OpenAI-compatible so a free model can be used; limits are small by default and meant to be matched to the provider's free quota.
- D20 (session 6) Emergency replies are never rate-limited and never call the model.
- D21 (session 6) The user wants all backend finished first and UI/UX design last: where a screen is unavoidable, make it plain but working.
- Seed content: `seed/content.json` (articles are plain p/ul/b plus `.disclaimer` boxes, styled via `.prose-cribs`). Fonts: Baloo 2 + Nunito. Nav (mobile): Home · Directory · **Ask (AI, center)** · FAQ · Settings. Desktop: sidebar.

## User environment
Windows + PowerShell. Keep commands PowerShell-safe (no `openssl`, `source`, `unzip`; avoid `&&`). The user wants simple, short instructions: keep steps short, no long option lists. The sandbox may or may not have network: in session 5 `npm ci`, typecheck, tests and `db:generate` worked, but Google Fonts could not be fetched, so `next build` needs `src/app/layout.tsx` fonts stubbed temporarily (restore with a copy afterwards) to verify compilation. Vitest only picks up `src/**/*.test.ts` (not `.tsx`); use `createElement` for render tests.

## Env vars
Full copy-paste list and secret/non-secret split: `VERCEL_ENV.md` (sections D, D2); template: `.env.example`. Used by code: NEXT_PUBLIC_APP_URL, TAG_NAME, AUTH_SECRET(+_PREVIOUS), PASSWORD_PEPPER(+_PREVIOUS), DATABASE_URL, DATABASE_URL_UNPOOLED, MAIL_DRIVER, BREVO_API_KEY, MAIL_FROM_EMAIL, MAIL_FROM_NAME, and (session 6) AI: `AI_PROVIDER` (openai-compatible|anthropic), `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY` (secret) or `ANTHROPIC_API_KEY` (secret), `AI_MAX_OUTPUT_TOKENS`, `AI_RATE_LIMIT_PER_HOUR`, `AI_USER_PER_DAY`, `AI_USER_TOKENS_PER_DAY`, `AI_GLOBAL_PER_MIN`, `AI_GLOBAL_PER_DAY`, `AI_GLOBAL_TOKENS_PER_DAY`; security: `TRUST_PROXY`, `MAIL_DAILY_CAP`, `CRON_SECRET` (secret), `TURNSTILE_SECRET_KEY` (secret), `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. `getAiConfig()` / `getSecurityConfig()` never throw: each bad value falls back to its own default and a bad key counts as missing. `OPENAI_API_KEY` was removed (unused). In production `MAIL_DRIVER` must be `brevo` or sign-up email fails by design.

## Lessons (still true)
- Sign-up failed with the generic message in session 3: tables missing on the DB in use, then an invalid `BREVO_API_KEY` (needs an **API key `xkeysib-...`** from SMTP & API > API keys, not an SMTP key).
- Logging shows causes: `[auth] unexpected error: <name>: <message>`, `[onboarding] unexpected error: ...`, `[mail] send failed: ...`. No keys, recipients or answers. Keep that pattern.
- Vercel "Needs Attention" on `DATABASE_URL*` is only a nudge to mark them Sensitive. Env changes apply only after a redeploy.
- Check `git ls-files` for stray root-level `.ts` files. The zip's working tree is the source of truth.
- **Apply schema changes in Neon BEFORE pushing code that reads the new columns, and run `npm run db:seed` before pushing code that reads guides.**
- Real-SQL check without Neon: `npm i @electric-sql/pglite` in a temp folder (`/tmp/pgt`), symlink it into `node_modules/@electric-sql` of the repo, run a throwaway `.mts` script that applies `drizzle/*.sql` and the same drizzle statements with `drizzle-orm/pglite`, then delete the script and the symlink. This caught nothing wrong in session 6 but proves the SQL runs.
- Testing the safety patterns first paid off: two bugs ("gusto ko nang mamatay" missed; "missing the bus" wrongly flagged) were caught by tests before shipping. Add a test for every new phrase.
- `npm run lint` is broken (Next 16 removed `next lint`); CI does not use it. ESLint config is still a todo.
- The pre-commit secret scanner flags fake key-looking strings in tests (it blocked a commit once). Build such fixtures at runtime (`["sk","ant","x"].join("-")`) instead of writing them literally. Read the commit output: a blocked commit prints "Possible secrets found" AFTER other commands may look fine.
- Windows/PowerShell: a zip made on Linux marks `.githooks/pre-commit` executable, so Git on Windows shows it as modified and blocks `git merge`. Fix: `git config core.filemode false`.
- Never paste connection strings or keys in chat (the user pasted a Neon string once; it must be rotated). PowerShell needs the whole `$env:` value in double quotes because of `&`.
- GitHub Actions run names such as "Merge remote-tracking branch 'origin/main' #1" are just the commit message of the push that triggered them.

## Blockers / needs from the user
1. Follow `SETUP_GUIDE.md` section 0 in order: unzip, `npm ci`, local checks, `drizzle/0002_warm_catseye.sql` in Neon, `npm run db:seed`, fix the git merge (core.filemode false, `git fetch origin`, `git merge origin/main`), push, add `CRON_SECRET`, **then** the AI provider variables, redeploy. Rotate the Neon password if not done (it was pasted in chat).
2. Tell me **which free model/provider** they use (and its requests-per-minute/day limits) so `AI_GLOBAL_PER_MIN` / `AI_GLOBAL_PER_DAY` and the base URL can be set exactly; and whether they have a custom domain.
3. Optional: free Turnstile keys (`docs/CLOUDFLARE.md`).
4. Phone test (360px): quiz, Home (search, Recommended, progress, Saved), a guide's Mark as read / Save, search, directory filter, Ask (starter chips, streaming, source chips, `my son is not breathing` -> 911 message, 5 quick questions -> "try again later", composer vs bottom nav). Send feedback.
5. Verified Philippine hotline numbers for `src/config/safety.ts` (only 911 now).
6. Team: Privacy/Terms text (D11), D2/D5 flags. Missing guides (wandering, toileting, screen time, safety outside, parent self-care): "we'll fix that later".

## Known deviations / todo (hardening)
- Missing: ESLint config + import-restriction rules (and a working `lint` script), commitlint, lint-staged, PR template, CODEOWNERS, dependabot, Playwright e2e. (Seed script and AI/env config now exist.)
- No DOM component tests (quiz, chat and buttons are covered through pure logic, services and route tests). Adding them needs `@testing-library/react` + `jsdom`.
- Inline field errors exist on sign-up only; sign-in, forgot and the quiz use one message box.
- Quiz and progress server actions have no rate limit (session required); no unique index on `child.user_id` (a double submit could create two children; the app uses the oldest); `setContact` is select-then-write.
- Editing the profile after onboarding is only possible through the review screen before finishing; Settings editing is P7.
- Pre-commit uses `.githooks` + `scripts/check-secrets.mjs` (activated by `npm run prepare`), not Husky.
- Real Neon HTTP driver has not run the new SQL (pglite did): watch `db:seed` and the first Save/Read click. The `greatest(...)`/`coalesce(...)` upserts in `src/server/onboarding/repo.ts` are still unproven on Neon too.
- `src/components/ui/ComingSoon.tsx` is unused now (Ask no longer uses it); keep it for the Find CRIBS/community pages or delete it.
- The chat has no CSP/`connect-src` work (the browser only calls its own `/api/chat`); a strict CSP is still a P9 item.
- Stage 1 gaps: the chat address limits run after the emergency check (by design) but before sign-in is required for the 429 body; the bot check covers sign-up and the first reset request only; no starter-answer cache or FAQ fast path; chat/auth limits are fixed windows (a burst at a window edge can briefly double); counters live in the `rate_limit` table (a dedicated store such as Redis would be faster at scale).
- Directory and search text mention "Sample listing" only on the directory page; the AI is told listings are samples.

## Next tasks (each begins with a change plan; wait for "go"; the user approved ONE "go" for all stages below in session 6 and wants the backend finished first, UI/UX last)
1. Ask for the user's results (Blockers 1-4); fix any SQL, seed, merge, build, provider or Turnstile problem first.
2. **Stage 2 (P5b):** chat history (thread/message tables, 30-day deletion in the cron, delete button, export), thumbs feedback. New SQL `drizzle/0003_*.sql` (repeatable).
3. **Stage 3 (P6):** Find CRIBS + If-found: `found_token` (hash of a 256-bit token, never the token), QR as SVG, revoke/regenerate, public `/f/[token]` (rate-limited per address and per token, `noindex`, `no-store`, `Referrer-Policy: no-referrer`, same 404 for any bad token, access count only).
4. **Stage 4 (P7 backend):** edit child profile (reuse onboarding service), change password (+ sign out other devices), delete account, data export, notifications, community posts (moderation via env allowlist, `scrubPii`, rate limits, reports).
5. **Stage 5 (P8 + P9 backend):** check-ins, schedules, appointment-prep summary logic; strict CSP + security headers, `SECURITY.md`, `npm audit` in CI + dependabot, working ESLint with import rules, unique index on `child.user_id`. Also the missing draft guides + hotline numbers, starter-answer cache, FAQ fast path. Update this file and the zip after each stage.

## Resume commands
```
npm ci
copy .env.example .env.local      # fill values (see VERCEL_ENV.md)
vercel link
vercel env pull .env.local
npm run typecheck
npm test
npm run build
npm run db:seed                   # after applying drizzle/0002 in Neon; needs DATABASE_URL_UNPOOLED
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
- 2026-11-08 (session 6): user reported checks passed, the ALTER TABLEs were run, the Ask logo is fine, and the quiz should be smoother and easier to answer; also pasted a failing GitHub "DB migrate" run (`url: ''`). Planned and got "go" for: quiz smoothness (6 commits), migrate workflow made manual-only, and **P4** (about 30 commits: tables + migration 0002, seed script, content repo/service, pages moved to the service, search, progress/saved, Recommended, directory filter). User then said "keep progressing, we'll fix that later" (about the missing guides), planned **P5**, got "go", and it was built in about 18 commits (SDK, safety config and emergency check, prompt, citations, limits, starters, events, same-origin check, provider, service, deps, route, chat state, hook, components, page, docs). 277 tests pass; typecheck clean; build compiles with fonts stubbed. User's last message: "handoff" and asked to be guided through the setup (new section 0 in SETUP_GUIDE.md).
- 2026-11-09 (session 6, part 2): user asked to finish all backend today, UI/UX last, and to act as a security expert (Cloudflare skill on GitHub) with rate limiting and IP protection because the AI runs on a free model. Plan with 5 stages approved with "go" (defaults: OpenAI-compatible provider, no Cloudflare proxy). **Stage 1 built (about 30 commits):** trusted IP bucket, abuse guard + database/in-memory implementations, AI limit policy (address/person/new-account/app-wide, token budgets, lock, cooldown), OpenAI-compatible provider + SSE parser, PII scrubber, shorter prompts, hashed auth limiter keys, daily email cap, Turnstile, cleanup cron, docs (`docs/CLOUDFLARE.md`, env files, setup guide). 354 tests pass; build compiles with fonts stubbed. Stages 2-5 not started (handoff due to session budget). The user also hit a Windows git merge problem (`.githooks/pre-commit` mode) and pasted a Neon connection string in chat (told to rotate).

