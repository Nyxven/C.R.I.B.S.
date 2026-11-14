# HANDOFF.md — Session 7 (UI/UX pass on Phase 4B)

## Summary
Baseline = Phase 4B (`bc599d2`, tag `phase-4b-baseline`). The uploaded repo was already there, so no revert was needed. This session added the design-system CSS, one-question onboarding with a tap age picker, a contextual walkthrough, grouped Settings (+profile, security), a Child Profile screen, structured draft Terms and Privacy pages, and error/loading/offline/session-expired states. About 12 small commits. No database change.

**Big limitation: the sandbox had no network.** Nothing was typechecked, built, linted or viewed in a browser. Only a syntax parse (0 errors) and 12 new pure-logic tests (run with a mini runner) were executed. Expect some type errors on first `npm run typecheck`.

## Release-readiness
Legend: 1 implemented, 2 tested locally, 3 verified deployed, 4 needs external config, 5 needs human/legal review, 6 not implemented.

| Feature | Status |
|---|---|
| One-question onboarding + age picker | 1 (pure rules partly tested via mini runner; UI not run) |
| Walkthrough | 1 (pure rules partly tested; not seen in a browser; localStorage persistence) |
| Settings hub, profile, security, notifications switch, delete dialog | 1 (not run) |
| Child profile + section editing | 1 (not run) |
| Terms / Privacy | 1, **5** (drafts; contact details missing) |
| 404, error boundaries, loading skeleton, offline banner, session-expired notice | 1 (not run) |
| Motion / micro-interactions | 1 for CSS only (no motion library used; not seen) |
| Empty states for Saved/Community/Notifications/Search/Directory | **6** (not audited or redesigned) |
| Redesign of Home, Learn, Directory, FAQ, Ask, Community, Find, auth pages | **6** (only small Home changes) |
| Appearance / language / text size settings | **6** (backend fields exist, no UI) |
| Visual QA at 360/390/768/1024/1440, WCAG audit, reduced-motion check | **6** (not done) |
| Everything from session 6 (auth, AI, find, account, community) | unchanged; 2 earlier (473 tests passed in session 6); 3 not verified on live; 4 needs SQL 0002-0005 + seed + env vars |

## Decisions
- Panels over splitting server steps: avoids a risky blind schema/service change and keeps resume pointers valid.
- Walkthrough completion in localStorage (no migration). Moves to the DB later if wanted.
- Omitted Appearance/Language/Text size in Settings (no UI exists; rule: no settings that do nothing).
- Removed the dead "Coming soon" Find card from Home.
- Legal text describes only verified behavior; everything else is an open question for the adviser/privacy professional.

## Files
Created: `ENV_REFERENCE.md`, `HANDOFF.md`, `NEXT_PROMPT.md`, `src/lib/domain/{panels,tour}.ts` (+tests), `src/components/onboarding/{AgePicker,PanelFields}.tsx`, `src/components/tour/{Tour.tsx,storage.ts}`, `src/components/settings/{SettingsParts,SettingsActions,ProfileForm}.tsx`, `src/components/child/ChildProfile.tsx`, `src/components/ui/{StatePage,ConnectionBanner}.tsx`, `src/app/(app)/{child,settings/profile,settings/security}/page.tsx`, `src/app/(app)/{error,loading}.tsx`.
Modified: `globals.css`, `useOnboarding.ts`, `OnboardingFlow.tsx`, `copy.ts`, `controls.tsx`, `AppNav.tsx`, `(app)/layout.tsx`, `(app)/home/page.tsx`, `(app)/settings/page.tsx`, `(auth)/sign-in/page.tsx`, `AccountControls.tsx`, `LegalPage.tsx`, `terms/page.tsx`, `privacy/page.tsx`, `error.tsx`, `not-found.tsx`, `src/server/account/service.ts` (+`getPreferences`), `CONTEXT.md`, `BUILD_CRIBS.md`.
Deleted: `src/components/onboarding/StepFields.tsx`.

## Continue
1. `npm ci && npm run typecheck && npm test && npm run build` (build needs Google Fonts / network). Fix failures first.
2. `npm run dev`, walk through the checklist in `NEXT_PROMPT.md`, take screenshots at the five widths.
3. Then continue the UI pass on the screens marked 6.
Workflow rules from CONTEXT.md still apply (granular Conventional Commits, no force push, no secrets, logic separate from UI).
