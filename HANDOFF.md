# HANDOFF.md — Session 8 (UI pass: Phase 2 and part of Phase 3) + brand restoration

## Brand restoration (latest, same unverified state)
Gradient buttons, the page wash, the Ask CRIBS logo button, three recommended guides on Home, ribbon lines under titles and on progress bars are back (see CONTEXT.md top block). Next agent: look at Home, the sidebar and one list screen at 360 and 1440 px first and ask the user "more or less gradient?" before spreading it further.

## Summary
Still **Phase 4B** (baseline `bc599d2`, tag `phase-4b-baseline`). The user chose to **skip verification** (typecheck, tests, build, browser) and continue the UI pass. Session 8 applied one page pattern and added empty states, skeletons, feedback, an "Up next" link, a child-profile nudge and a working text-size setting. **Nothing from sessions 7 and 8 has been typechecked, built, run in a browser or screenshotted** (no network in the sandbox). About 20 small commits (cadb50e..HEAD); no database change; no new environment variable.

Note: the uploaded repo already contained five "Phase 1 redesign" commits (landing, auth, Home, layered CSS, `PageHeader`, `EmptyState`) that the previous HANDOFF did not list. They are described in CONTEXT.md.

## Release-readiness
Legend: 1 implemented, 2 tested locally, 3 verified deployed, 4 needs external config, 5 needs human/legal review, 6 not implemented.

| Feature | Status |
|---|---|
| Saved, Notifications, Search, Learn module, Article (+Up next), FAQ, Directory, Ask history, Community, Moderation, Find, Settings sub-pages: one page pattern | 1 (syntax parsed only) |
| Empty states with a next action (saved, notifications, search, FAQ, directory, module, history, moderation, Find without profile, Ask unavailable) | 1 |
| Skeleton `loading.tsx` for 8 routes | 1 |
| Feedback lines (save/read, mark all read, community, Find) | 1 |
| Child profile next-step nudge | 1 |
| Text size setting (Standard / Large / Extra large) | 1; pure logic checked in a harness; Vitest file not run |
| Sign-in / sign-up | untouched this session (Phase 1 work, unverified) |
| Public if-found page `/f/[token]` | **6** (not redesigned) |
| Ask message bubbles and composer polish | **6** |
| Walkthrough beyond Home | **6** |
| Language and Theme settings | **6** on purpose (nothing to switch to) |
| Terms / Privacy | 1, **5** (drafts, contact details missing) |
| Visual QA at 360/390/768/1024/1440, WCAG audit, reduced-motion check | **6** (not done) |
| Everything from sessions 1-6 | unchanged; 473 tests passed in session 6; 3 not verified on live; 4 needs SQL 0002-0005 + seed + env vars |

## Decisions
- Reuse the existing design system; no new tokens, fonts or libraries.
- Lists become one `.list-group` with `LinkRow` rows instead of one card per item (no cards inside cards).
- Success and failure are shown with `Feedback` (icon + words, announced politely, one line reserved).
- Text size is one server-rendered root `font-size` rule in `(app)/layout.tsx` (no flash, no root layout change, no migration). Steps 100/115/130; the schema allows 85-140.
- Focus ring inside `.list-row` (the group clips corners).
- Language and Theme stay out of Settings until they do something.

## Files
Created: `src/components/ui/{BackLink,LinkRow,Feedback,ListSkeleton}.tsx`, `src/lib/domain/textSize.ts` (+test), `src/components/settings/TextSizeForm.tsx`, `src/app/(app)/settings/appearance/page.tsx`, `loading.tsx` in `(app)/{saved,notifications,search,directory,faq,community,learn/[module],learn/[module]/[slug]}`.
Modified: `EmptyState.tsx`, `globals.css`, `(app)/layout.tsx`, `server/account/service.ts` (`getPreferences` + `textSize`), pages for saved, notifications, search, learn (2), faq, directory, ask history, community (+moderation), find, home, settings (hub, profile, security), `ChatView`, `CommunityFeed`, `NotificationControls`, `FoundManager`, `ChildProfile`, `ArticleActions`, `useArticleActions`, `LegalPage`.

## Continue
1. `npm ci && npm run typecheck && npm test && npm run lint && npm run build`. Fix failures first (expect small type errors).
2. `npm run dev` and check every screen at 360/390/768/1024/1440 px, at text size Large and Extra large, keyboard only, and with reduced motion. Take screenshots.
3. Then: redesign `/f/[token]`, polish Ask bubbles/composer, extend the walkthrough to other screens.
Workflow rules from CONTEXT.md still apply (granular Conventional Commits, no force push, no secrets, logic separate from UI). Legal pages stay drafts.
