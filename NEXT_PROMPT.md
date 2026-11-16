You are continuing **C.R.I.B.S.** (parenting guidance web app for parents of children with ASD). We are still on **Phase 4B**. Do NOT start Stage 5 / Phase 5 until the user says so.

Read first, in this order: `CONTEXT.md` (top block first), `HANDOFF.md`, `BUILD_CRIBS.md`, `ENV_REFERENCE.md`. Unzip `cribs-app.zip` and work in that repo; its working tree and git history are the source of truth. If a session 9 handoff exists, read it too and merge carefully.

## Where we are
The UI pass is mostly built. The brand look (purple-to-coral gradient buttons, warm/mint page wash, ribbon line under titles, the logo on the Ask CRIBS button, three "Recommended for {child}" guides on Home) was restored after the user said the flat version looked bland. Keep it. Every screen follows one pattern: back link, page header, grouped list, empty state with a next step, skeleton, and a feedback line after actions.

## What to build next, in this order
1. **Public if-found page `/f/[token]`**: redesign it in the brand look. It must stay safe: only fields the parent switched on are shown, the autism line is off by default, and nothing private appears when the tag is off or stopped. Big, calm layout for a stranger on a phone: a clear heading, the child's name, a one-tap Call button when a contact exists, and short plain instructions.
2. **Ask CRIBS chat**: polish the message bubbles, source chips, retry and feedback buttons, the composer, and the starter chips so they match the brand (gradient send button, friendly empty state). Keep the emergency check and the "not medical advice" line.
3. **Carry the brand across every screen** that still looks flat: sign-in and sign-up, onboarding, Settings, Child profile, Community, Directory, FAQ, Learn and article pages. Use gradient only on primary actions, ribbon lines and progress. Keep cards, rows and inputs quiet. Consider sentence-case headings instead of the small uppercase labels.
4. **Walkthrough**: extend it beyond Home only where a real, visible element exists (for example Ask, the child profile, Settings, and Saved on first visit). Keep it short, skippable, once by default, and restartable from Settings.
5. When the user asks for more, offer the next candidates: Language and Theme settings (only if they really work), a better Learn reading experience, and then Stage 5 from `CONTEXT.md` "Next tasks" (with the user's "go").

## Rules
- Tell the user your plan first (files, commits, what you will change) and wait for "go".
- Granular Conventional Commits with short subjects, no force push, no secrets in the repo or chat, logic separate from UI.
- No schema change without a migration. Keep auth, authorization and privacy defaults. No fake data and no dead buttons.
- Accessible (WCAG 2.2 AA): white text on gradients stays at 4.5:1 or better, visible focus, `prefers-reduced-motion`, motion 150 to 250 ms, no layout shift. Mobile first.
- The legal pages are drafts. Do not claim legal compliance.
- Be honest about what was and was not tested. Never say something works if it was not run.
- At about 20 to 25 percent context left, stop and update `CONTEXT.md`, `HANDOFF.md`, `BUILD_CRIBS.md`, `NEXT_PROMPT.md`, and rebuild the ZIP (project at its root, no `node_modules`, `.next` or `.env*` except `.env.example`).
