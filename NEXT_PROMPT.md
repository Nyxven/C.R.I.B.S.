You are continuing **C.R.I.B.S.** (parenting guidance web app for parents of children with ASD). We are still on **Phase 4B**. Do NOT start Stage 5 / Phase 5 until the user says so.

Read first, in this order: `CONTEXT.md` (top block first), `HANDOFF.md`, `BUILD_CRIBS.md`, `ENV_REFERENCE.md`. Unzip `cribs-app.zip` and work in that repo; its working tree and git history are the source of truth. Work continues on branch `feat/ui-verify-polish` (or `main` once it is merged).

## Where we are
Session 10 was the first verified session: typecheck clean, 502/502 tests, `next build` green, and every main screen was used in a real browser at 390 and 1440 px. The brand look (purple-to-coral gradient on primary actions, warm/mint wash, ribbon lines, logo on Ask CRIBS) is in place everywhere. Keep it. The if-found page, Ask chat and walkthrough from earlier NEXT_PROMPTs are built and were seen working.

## Setup on a new machine
- `npm ci --ignore-scripts` (plain `npm ci` fails on Windows because of drizzle-kit's old nested esbuild).
- To see signed-in screens without touching production: create a Neon branch, put its URL and fresh dev `AUTH_SECRET`/`PASSWORD_PEPPER` in `.env.local` with `MAIL_DRIVER=console`, run `npm run db:seed`, `npm run dev`, sign up; the OTP prints in the server log. Delete the branch afterwards.

## What to do next, in this order
1. Decide with the user how to fix `npm run lint` (Next 16 removed `next lint`): add ESLint 9 flat config with the import-boundary rule from BUILD_CRIBS 0.4, or remove the script.
2. Check what session 10 did not: 768 and 1024 px, Large text, keyboard only, walkthrough steps on Ask/Child/Saved/Settings, Filipino screens, a real AI answer (needs the user's provider key in Vercel, never in chat).
3. Push the branch and open a PR (ask first); delete the Neon dev branch `dev-ui-preview-2026-11-16` (ask first).
4. Then offer: more languages, a Theme setting (only if it really works), a better Learn reading experience (e.g. "Ask about this guide"), and Stage 5 from `CONTEXT.md` "Next tasks" (only with the user's "go").

## Rules
- Tell the user your plan first (files, commits, what you will change) and wait for "go".
- Granular Conventional Commits with short subjects, no force push, no secrets in the repo or chat, logic separate from UI.
- No schema change without a migration. Keep auth, authorization and privacy defaults. No fake data and no dead buttons.
- Accessible (WCAG 2.2 AA): white text on gradients stays at 4.5:1 or better, visible focus, `prefers-reduced-motion`, motion 150 to 250 ms, no layout shift. Mobile first.
- The legal pages are drafts. Do not claim legal compliance.
- Be honest about what was and was not tested. Never say something works if it was not run.
- At about 20 to 25 percent context left, stop and update `CONTEXT.md`, `HANDOFF.md`, `BUILD_CRIBS.md`, `NEXT_PROMPT.md`, and rebuild the ZIP (project at its root, no `node_modules`, `.next` or `.env*` except `.env.example`).
