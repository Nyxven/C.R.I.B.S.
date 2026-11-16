You are continuing **C.R.I.B.S.** (parenting guidance web app for parents of children with ASD). We are still on **Phase 4B**. Do NOT start Stage 5 / Phase 5 until the user says so.

Read first, in this order: `CONTEXT.md` (top block first), `HANDOFF.md`, `BUILD_CRIBS.md`, `ENV_REFERENCE.md`. Unzip `cribs-app.zip` and work in that repo; its working tree and git history are the source of truth. If a session 9 handoff exists, read it too and merge carefully.

## Where we are
The UI pass is mostly built. The brand look (purple-to-coral gradient buttons, warm/mint page wash, ribbon line under titles, the logo on the Ask CRIBS button, three "Recommended for {child}" guides on Home) was restored after the user said the flat version looked bland. Keep it. Every screen follows one pattern: back link, page header, grouped list, empty state with a next step, skeleton, and a feedback line after actions.

## What to build next, in this order
00. Session 9b added Filipino (see CONTEXT.md top block). If asked to continue languages: translate more screens (key in `en.ts` first, then `fil.ts`), Ask replies in the chosen language, then more languages. Stage 5 stays postponed until the user says so.
0. Session 9 built the if-found page, Ask polish, sentence-case headings and the 8-step walkthrough (all unverified, see CONTEXT.md top block). If the user can run `npm`, verify first: `npm ci && npm run typecheck && npm test && npm run lint && npm run build`, fix failures, then check screens at 360/390/768/1024/1440 px.
1. Judge by eye with the user: Settings, Child profile, Community, Directory, FAQ, Learn and article pages. Ask "more or less gradient?" before spreading it. Gradient only on primary actions, ribbon lines and progress.
2. Offer next candidates: Language and Theme settings (only if they really work), a better Learn reading experience, then Stage 5 from `CONTEXT.md` "Next tasks" (only with the user's "go").

## Rules
- Tell the user your plan first (files, commits, what you will change) and wait for "go".
- Granular Conventional Commits with short subjects, no force push, no secrets in the repo or chat, logic separate from UI.
- No schema change without a migration. Keep auth, authorization and privacy defaults. No fake data and no dead buttons.
- Accessible (WCAG 2.2 AA): white text on gradients stays at 4.5:1 or better, visible focus, `prefers-reduced-motion`, motion 150 to 250 ms, no layout shift. Mobile first.
- The legal pages are drafts. Do not claim legal compliance.
- Be honest about what was and was not tested. Never say something works if it was not run.
- At about 20 to 25 percent context left, stop and update `CONTEXT.md`, `HANDOFF.md`, `BUILD_CRIBS.md`, `NEXT_PROMPT.md`, and rebuild the ZIP (project at its root, no `node_modules`, `.next` or `.env*` except `.env.example`).
