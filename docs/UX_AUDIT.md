# UX audit: Nielsen's 10 usability heuristics

Session 4, 2026-11-06. Scope: every screen that exists today (landing, sign-up, verify, sign-in, forgot/reset, loader, home, learn module and article, directory, FAQ, nav, settings and ask placeholders, error and 404 states).
Method: expert review of the code in `cribs-app.zip` (commit 535e775) plus contrast measured with the WCAG formula. Not a test with real users: the team's pre/post-test and the 50-item questionnaire stay the official evaluation.
Audience kept in mind: stressed parents of children with ASD, often on a phone, often one-handed. Plain, kind words and low cognitive load come first.

## Heuristics (short)
H1 Visibility of system status · H2 Match with the real world · H3 User control and freedom · H4 Consistency and standards · H5 Error prevention · H6 Recognition rather than recall · H7 Flexibility and efficiency · H8 Aesthetic and minimalist design · H9 Help users recover from errors · H10 Help and documentation

## Severity (Nielsen)
0 not a problem · 1 cosmetic · 2 minor · 3 major (fix before real users) · 4 catastrophe (fix now)

## "When" column
**OTP** = fixed by the 6-box code screen · **Redesign** = fixed while redesigning · **Fix** = separate small fix commit · **Later** = belongs to a later phase, not done now

## Findings

### Whole app, navigation, shell
| ID | Screen | H | Problem | Sev | Fix | When |
|---|---|---|---|---|---|---|
| G1 | Settings (whole app) | H3 | There is no sign-out anywhere. On a shared phone or family tablet, a parent cannot leave their child's information. | 4 | Add a "Sign out" button in Settings using `signOutAction`. | Fix |
| G2 | Ask, Settings | H2 | Pages show developer text: "coming in P5" and "coming in P7". Parents do not know what P5 means. | 3 | Friendly "coming soon" cards that say what the page will do, with a way back to Home. | Fix |
| G3 | Home | H5 | The "Find CRIBS" card links to `/find`, which does not exist (404). | 3 | Show it as a clear "Coming soon" tile, not a link, until P6. | Fix |
| G4 | Any bad link or crash | H9 | No custom 404 or error page. A wrong module or article address shows the default unbranded page with no way back. | 3 | Add `not-found.tsx`, `error.tsx`, `global-error.tsx` in plain language with a "Go to Home" button. | Fix |
| G5 | Contrast (many screens) | H8 | Fails WCAG AA. White on the coral end of the button gradient is 2.87:1. White on the terracotta tile is 3.13:1 and on the pink-to-purple tile 2.58:1. The coral sub-heading on cream is 2.73:1. Terracotta and sage-dark labels on white are about 3.1:1 and 2.63:1. The amber disclaimer text on its tint is 2.31:1. Needed: 4.5:1 for normal text. | 3 | New logo-based tokens with checked pairs. Dark ink on light tints. Solid darker button color. | Redesign |
| G6 | Article | H10 | The seed articles use `<div class="disclaimer">` (2 articles: early signs, meltdowns) but no CSS exists for it, so these safety notes look like plain text. | 3 | Style the `.disclaimer` block (tinted box, icon, readable contrast). Content is not edited. | Redesign |
| G7 | Whole app | H7 | No `<main>` landmark and no "skip to content" link in the app shell. Keyboard and screen-reader users must tab through the whole nav on every page. | 2 | `<main id="content">` and a skip link. | Redesign |
| G8 | Whole app | H1 | Every page has the same browser tab title. Tabs and screen readers cannot tell Home from FAQ. | 2 | Per-page titles using a title template. | Fix |
| G9 | Nav | H1 | Opening a module or article highlights no tab, so the parent loses their place. | 2 | Treat `/learn/*` as part of Home. | Redesign |
| G10 | Module, article | H3 | No back link or breadcrumb. The only way back is the browser's back button. | 2 | "Back to {module}" and "Back to Home" links. | Redesign |
| G11 | Focus (all) | H4 | Inputs hide the focus outline and use a faint 25% ring. Buttons, links and nav pills have no designed focus state. | 2 | One clear, high-contrast focus ring for everything. | Redesign |
| G12 | Loader | H1 | On every full page load the screen is blank cream for a moment, even when the loader already ran this session. The loader is also a fixed timer, not real loading (known, comes with P3/P4). | 2 | Avoid the blank flash. Real prefetch stays for P3/P4. | Fix |
| G13 | Mobile nav | H6 | Labels are 11px. Small for tired eyes. | 2 | 12-13px labels, 48px targets, clear active pill. | Redesign |
| G14 | Mobile app | H6 | No top bar, so the logo and app name disappear after the landing page. | 1 | Slim top bar with the logo. | Redesign |
| G15 | Desktop | H8 | Content is pushed left beside the sidebar and leaves a large empty area on wide screens. | 1 | Center the content in the space beside the sidebar. | Redesign |

### Landing
| ID | Screen | H | Problem | Sev | Fix | When |
|---|---|---|---|---|---|---|
| L1 | Landing, sign-up | H10 | Sign-up says "accept the Terms and Privacy Policy", but there are no links and no such pages. | 3 | Links plus simple `/privacy` and `/terms` pages marked as drafts. **The team must write and approve the real text before real users.** | Fix |
| L2 | Landing, auth | H8 | The logo image has alt text "C.R.I.B.S. logo" right next to the name "C.R.I.B.S.", so screen readers say it twice. | 1 | Empty alt when the name is beside it. | Fix |

### Sign-up
| ID | Screen | H | Problem | Sev | Fix | When |
|---|---|---|---|---|---|---|
| S1 | Sign-up | H5 | The 10-character rule is only a hint in the label. Browser pop-ups (`required`, `minLength`) appear first and look different in each browser. The app's own kind message rarely shows. | 3 | Show the rules under the field up front, tick them as the parent types, and show messages inline. | Fix |
| S2 | Sign-up, sign-in, forgot | H9 | One error box at the bottom, not next to the field with the problem. Focus does not move to it. | 2 | Field-level messages linked with `aria-describedby`. Focus the first problem. | Fix |
| S3 | Sign-up, reset | H7 | "Show/Hide" is a tiny hand-placed text button with no accessible state. Sign-in has no toggle at all. | 2 | A 44px toggle with `aria-pressed`, same on every password field. | Fix |
| S4 | Sign-up | H5 | Consent checkbox is 20px, easy to miss on a phone. | 2 | Bigger target with links (see L1). | Fix |
| S5 | Sign-up | H9 | If the email already has a verified account, sign-up still opens the code screen, but no code is sent (a "you already have an account" email is sent). The parent waits for a code that never comes. The same screen must stay the same to avoid revealing accounts. | 3 | On the code screen add: "No code? If you already have an account, sign in or reset your password." | OTP |
| S6 | Sign-up to verify | H3 | A mistyped email cannot be corrected from the code screen. | 2 | "Wrong email?" link back to sign-up. | OTP |

### Verify email
| ID | Screen | H | Problem | Sev | Fix | When |
|---|---|---|---|---|---|---|
| V1 | Verify | H7 | One text input with wide letter-spacing for the code. Hard to see digit by digit, errors are hard to spot. | 3 | 6 individual boxes (spec in CONTEXT.md). | OTP |
| V2 | Verify | H1 | "Send a new code" has no timer. The server allows 3 codes per 10 minutes and the parent only finds out after tapping. The success message is stiff ("If that email can be verified..."). | 3 | 60-second visible countdown. Friendly message: "A new code is on its way to {email}." | OTP |
| V3 | Verify | H2 | The intro line is awkward ("If x can be used, we sent...") and does not say the code lasts 10 minutes or to check spam. | 2 | Plain wording that still does not confirm whether an account exists. | OTP |
| V4 | Verify | H5 | Opening `/verify` without `?email=` shows "your email" and cannot work. There is no email field. | 2 | Without an email, send the parent to sign-in with a short note. | OTP |
| V5 | Verify | H1 | The parent must press "Verify" after the 6th digit. | 1 | Auto-submit with a visible "Verifying..." state. | OTP |

### Sign-in, forgot and reset
| ID | Screen | H | Problem | Sev | Fix | When |
|---|---|---|---|---|---|---|
| I1 | Sign-in | H1 | An unverified account jumps to the code screen with no explanation. | 2 | Short line: "Let's finish verifying your email. We sent a new code." | OTP |
| F1 | Reset | H1 | After a successful reset the parent lands on sign-in with no confirmation. | 3 | "Password updated. Sign in with your new password." | Fix |
| F2 | Reset | H3 | The second step shows code and new password together, with no email shown, no resend and no way back to fix the email. | 3 | Show the email, use the code boxes, add resend with timer and "Wrong email?". | OTP |
| F3 | Forgot | H4 | The email field has only a placeholder, while other forms have visible labels. | 2 | Visible label. | Fix |
| F4 | Forgot | H1 | "Send code" and "Reset password" buttons show no busy state. | 1 | "Sending..." and "Saving..." labels. | Fix |

### Home, learn, directory, FAQ
| ID | Screen | H | Problem | Sev | Fix | When |
|---|---|---|---|---|---|---|
| HM1 | Home | H6 | The 6 tiles are text only. No icon and no article count, so they are harder to recognise at a glance. | 2 | Icon plus "3 guides" on each tile. | Redesign |
| HM2 | Home | H4 | The Find card uses a 📍 emoji that looks different on each phone and is read aloud by screen readers. The rest of the app uses line icons. | 1 | One icon set, marked decorative. | Redesign |
| LN1 | Article | H8 | The articles have no sub-headings (only paragraphs, lists and bold). Long text at 16px is tiring. Content stays word for word. | 2 | Larger body text (18px), more line spacing, shorter line length, clearer bold and list styling. | Redesign |
| LN2 | Module | H6 | Article cards show only a title and reading time. | 1 | Number, title, reading time and a clear arrow. | Redesign |
| FQ1 | FAQ | H6 | The marker is removed, so nothing shows that a question opens. | 2 | Chevron icon, 48px question row. | Redesign |
| D1 | Directory | H8 | Role labels are low contrast (see G5). The "Sample listing" tag is small. | 2 | Darker role color and a clearer tag. Keep the top notice. | Redesign |
| D2 | Directory | H7 | No call or directions buttons, no filters. | 2 | Not now. | Later (P4) |
| LATER | Home, FAQ, Ask | H7 | Search, personalized greeting, "Ask about this" buttons, text-size control and "mark as read" are in the spec but belong to later phases. | n/a | Not added in this pass. | Later (P3-P5) |

## Already working well (keep)
- Same message for known and unknown emails, and a generic sign-in error (good for privacy).
- Busy labels on sign-up, sign-in and verify buttons.
- Large form fields (48px) and a `prefers-reduced-motion` rule.
- "Sample listing" labels and the not-a-medical-service note on the landing page and the directory.
- Seed content is complete and preserved.

## Summary
40 findings: 1 catastrophe (sev 4), 12 major (sev 3), 20 minor (sev 2), 7 cosmetic (sev 1).
By plan: 9 fixed by the OTP screen, 15 by the redesign, 15 by small fix commits, 1 left for P4 (D2). Spec items for later phases are listed in the LATER row.
Items marked sev 3 or 4 should be done before any real parent uses the app.

## Status after session 4
Done: every finding marked OTP, Redesign or Fix, except the two notes below. D2 stays for P4.
- S2 (field-level errors): done on sign-up, where there are four fields. Sign-in and forgot-password keep one message box because they have one or two fields. Server errors on every form still show in one box.
- L1: `/privacy` and `/terms` are **draft placeholders**. The team must replace them with reviewed text before real families use the app.
- Not verified yet: the sandbox had no network, so typecheck, the full test run and `next build` were not run here. Run them locally (see CONTEXT.md, Resume commands) before deploying.

## Update, session 5
- The Ask button in the mobile bottom nav and the desktop sidebar now shows the C.R.I.B.S. logo instead of the sparkle icon (user request after the phone check). The accessible name is unchanged ("Ask CRIBS, the AI guide") and the logo is decorative (empty alt).
- User check: typecheck, tests and build passed on the user's machine; the redesign looked good on a phone.
