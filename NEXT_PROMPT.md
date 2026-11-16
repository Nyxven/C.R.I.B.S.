You are continuing **C.R.I.B.S.** (parenting guidance web app for parents of children with ASD). We are still on **Phase 4B**; do NOT start Phase 5 / Stage 5.

Read first, in this order: `CONTEXT.md` (top "Session 8" block, then "Session 7"), `HANDOFF.md`, `BUILD_CRIBS.md` (Session 7 and 8 addenda), `ENV_REFERENCE.md`. Sessions 7 and 8 built a large UI/UX pass (`git log phase-4b-baseline..HEAD`) in a sandbox with **no network**, so none of it has been typechecked, built, linted or seen in a browser.

The brand look (gradient buttons, page wash, Ask CRIBS logo button, three recommended guides, ribbon lines) was restored after session 8 at the user's request; see the top block of `CONTEXT.md`. Keep it, and check it by eye. If a session 9 handoff exists, read it too and merge carefully.

Do this, in order, and report what you actually ran:
1. `npm ci`, `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`. Fix errors introduced by sessions 7 and 8 (likely small type errors in `PanelFields`, Home, the dialogs, `Tour`, `ChatView` header, `FoundManager.act`, `ChildProfile`).
2. Run the app and verify with a real browser (Playwright is fine) at 360, 390, 768, 1024, 1440 px, with screenshots: `/onboarding`, `/home` walkthrough, `/settings` (+ profile, security, appearance), delete dialog, `/child`, `/find`, `/saved`, `/notifications`, `/search`, `/learn/...` (module and article), `/faq`, `/directory`, `/ask` (+ history), `/community`, `/privacy`, `/terms`, a 404, an error boundary, offline banner, reduced motion, horizontal overflow, layout shift. Also at text size Large and Extra large, and keyboard only (focus ring inside list rows and FAQ summaries). Fix what you see.
3. Then: redesign the public if-found page `/f/[token]` (privacy defaults must stay), polish Ask bubbles and composer, extend the walkthrough only where a real target exists.
4. Rules: no schema change without a migration; keep auth/authorization; no fake data or dead buttons; WCAG 2.2 AA; motion 150-250 ms and `prefers-reduced-motion`; granular commits, no force push, no secrets. Legal pages are drafts: do not claim compliance.
5. Update `CONTEXT.md`, `HANDOFF.md`, `BUILD_CRIBS.md`, rebuild the ZIP (project at its root, no `node_modules`, `.next`, or `.env*` except `.env.example`). At about 20-25% context left, stop and write the handoff.
