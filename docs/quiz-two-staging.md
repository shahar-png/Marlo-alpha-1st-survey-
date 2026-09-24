# Quiz 2 staging — 24 September 2026

The user approved this tested version for production on 24 September 2026. The separate staging project remains available for QA.

## Release boundary

- Work is on local branch `staging/quiz-two-review`, committed for staging QA.
- Public QA link: https://marlo-quiz-2-staging.vercel.app/deep-dive
- Dedicated Vercel project: `marlo9/marlo-quiz-2-staging`.
- Staging has `NEXT_PUBLIC_MARLO_STAGING=1` in all three Vercel environments; no participant database or email credentials were copied.
- The existing project `marlo-alpha-1st-survey`, Jenny's link guide, public survey-links.json and participant link formulas remain unchanged.
- Production approval received. Deploy to the existing participant project with staging mode disabled; keep Jenny's existing production URLs unchanged.

## How reviewers test

Open the staging `/deep-dive` link, use any valid test email (for example `qa@example.com`), and complete the quiz. It displays fictional Alex's profile, which can be edited during the run. Refresh at any point to start fresh with an empty form. Refresh also resets after completion; repeated test runs are allowed.

A small STAGING label identifies every screen without consuming layout space. No draft is stored or restored. The participant endpoint returns only fictional data, submission validates a complete response then returns a simulated success without saving it, and other write endpoints are blocked. Production migration setup is skipped in staging. Test feedback should include the page heading, phone/browser, steps to reproduce and a screenshot; send it back in the review conversation.

## Approved changes implemented

- Larger headings with relaxed line spacing and larger option text.
- Boxed choices on years, current/peak counts, testing services and monthly spend.
- Revised profile/email/insight/question copy from the round-two review.
- Removed stopped, stop_why and allow screens. Legacy response-sheet columns stay in the same order (58 columns); new pain_priority ordering is retained in raw_json.
- Reusable ranking for priorities and all 12 eligible frustrations: only six-dot handles start dragging, touch uses a 220ms hold, stable pointer capture, edge autoscroll and keyboard Up/Down/Home/End.
- Viewport-height pages with visible action areas, scrolling only for longer question content. Compact insight cards and source details overlay.
- Summary edits offer Save & return to summary, Back to summary and optional next question in that section.

## Verification

- 28 automated tests passed, including staging isolation with production-shaped credentials present and zero external fetches; repeat simulated submissions; removed questions, branching, rank restore/pruning, fixed sheet schema, wearable selection and existing API contracts.
- TypeScript, targeted ESLint, build and diff whitespace checks passed.
- Browser run: all chapters to completion; boxed choices; required answers; one-motion last-to-first drag; dragging row text leaves order unchanged; keyboard ranking; summary spending edit returns directly and displays changed value; simulated completion; refresh resets email and opening. No console errors.
- Phone layouts inspected at 393x852 and 375x667, including compact wearable cards. Touch hold has implementation coverage but requires a real-device check by human QA.

## Hosted verification

The shareable hostname returned HTTP 200 without authentication. Hosted participant responses contain only fictional Alex. Two complete simulated POSTs returned 200; apply/later/waiver returned 403; subsequent lookup remained done=false. A second browser run on the hosted build completed the no-wearable branch at 375x667; all 42 visited question/insight/review screens kept the primary button in view and had no horizontal overflow. Ranking edits returned directly to the summary with the new top answer.

Hosted completion showed “QA run complete”; refresh restored Welcome back with an empty email. No browser warnings/errors. The staging tab was left open at the fresh start with viewport overrides cleared. Changes are committed on the staging branch; production remains unmodified. The original `.vercel/project.json` still points to the participant project, so all further staging deployments MUST pass `--project marlo-quiz-2-staging --scope marlo9`; never run an unqualified production deployment.


## Mobile review round three

Approved mobile HTML design and four latest feedback comments implemented:
- All 12 original frustration categories available to rank; two-column grid with stable six-dot-only dragging in both dimensions. Not-an-issue choices are excluded from the ranking as before.
- iPhone Pro 393 x 714 usable-page baseline, allowing for browser controls; denser option lists preserve every choice, independent scrolling as a fallback and persistent action area.
- Larger centered ring and 72% statistic, centered text; larger history/wearable typography and edge-to-edge photos.
- Sources screen retains all eight choices, with about 50px between its last row and Continue at the reference size.
- Small non-layout STAGING label replaces black fixed footer.

Validation: 29 tests passed, TypeScript, targeted ESLint, optimized build and whitespace checks passed. Browser QA covered a complete fictional run, all 12 pain ranks, last-to-first drag, label drag leaving order unchanged, keyboard End, summary editing returning directly, simulated completion and reset on refresh. Mobile browser emulation is not a substitute for the user's physical iPhone QA. Production and Jenny's link remain unchanged.

Final hosted QA: deployment `dpl_77MLe5KtuXPccuijdQQD3ksTkjeH` at the same staging hostname. Checked larger 186px ring, 18px history/watch statistical text, full-bleed images, all 12 ranking choices, all eight sources choices, and zero overflow on Apple Watch/Garmin cards with multiple devices selected. A complete hosted run reached “QA run complete”; refresh returned an empty email form. No console warnings/errors. Commits 06425d6 and 46eefe5 were pushed to origin/staging/quiz-two-review. No production merge or participant-link update.

## Opening and card spacing follow-up

- Opening copy now participates in normal layout flow, with a fixed 32px separation above the email form. Continue is 48px high like other quiz buttons and sits 20px above the viewport bottom. Replay moved to the top so it no longer pushes Continue upward.
- Insight titles, copy, source notes, brand header, and actions share a 24px horizontal inset. Photos retain full-card width. The smartwatch statistic has its own 140px column plus a 16px gap to prevent the percentage touching the text.
- Verified opening at 393x714, 375x667, and 393x852: 32px text/form gap, 48px button, 20px bottom gap, zero opening overflow. Required-email validation and refresh reset pass.
- Audited every insight theme and all five wearable variants at the iPhone Pro usable size: text is inset at least 24px and default cards do not vertically overflow. Complete simulated quiz run and reset pass without console warnings/errors. All 29 automated tests, TypeScript and targeted lint pass.
- User's term “Pindem” is awaiting clarification; no external design-system synchronization is claimed.


## Production release

User approved the current staging version for production. Production uses the existing Notion and Apps Script integrations; `NEXT_PUBLIC_MARLO_STAGING` is absent from the production project and is explicitly set to `0` during this deployment. Real identity lookup, draft persistence and final submission remain enabled. The canonical Quiz 2 link remains https://marlo-alpha-1st-survey.vercel.app/deep-dive. The independent staging project retains fictional profiles and refresh reset.
