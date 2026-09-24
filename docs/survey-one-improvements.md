# Quiz 1 improvements · 23 September 2026

## Behavior

The original hard scroll cap was removed after user feedback about sticking and jumps. The intro now observes native scrolling without intercepting wheel, touch, keyboard, scrollbar or momentum. After a second requested 20% slowdown, story travel and crossfade timings are divided by .64 (two successive factors of .8). The scroll indicator is centered in a dedicated bottom row outside the scrolling content. It stays visible while scrolling, hides at the bottom, and returns when scrolling up; it cannot cover or intercept text. Explicit cream backgrounds behind blend-mode logo artwork prevent white asset rectangles during animation. Page and browser theme color use the approved #f2e9dd. Scrolling during the opening reveals its content immediately. Reduced-motion content stays static.

Age and Sex labels are now 22 px (previously 14 px).

## Supplement improvements — Jenny’s review list

Open [Supplement improvements](https://app.notion.com/p/b5b62c6c31004a64b1bd88b93d3c1828?v=3e453070acde816a92c3000c54768596) in the Participants database. Quiz 1 now puts unlisted supplement or vitamin names from the “Other” answer in **Supplement suggestions**, with **Supplement review = Needs review**. Review this list during your normal participant review.

- Read the original **Supplements other** answer on the participant card when context is needed. Each row is one participant response and may contain several suggestions.
- Check spelling and whether the ingredient is already represented in the quiz. Common known aliases are filtered out; ambiguous wording is kept for your judgment.
- Add your decision in **Supplement review notes**. Use **Reviewed** when checked, **Not needed** for duplicates/non-supplements, and **Added to quiz** only after the quiz option actually ships. Keep **Needs review** for unresolved entries.
- Flag proposed additions for the product team. This list does not automatically change quiz choices or recommend supplements.
- If a submission is present only in the raw answers Sheet because Notion was unavailable, include its **supplements_other** value when reconciling the missing participant card and review fields.

The public Quiz 1 address stays https://marlo-alpha-1st-survey.vercel.app/.

## Implementation and verification

Candidates are saved in the same Notion page-create request as the participant; no second queue write can fail independently. The original answer remains intact. Only an actively selected Other answer is processed. Case/punctuation duplicates within a response and known labels/aliases are excluded; ambiguous wording is retained for human review.

The production build runs an idempotent schema/view setup using the existing Notion connection. It adds three review fields, creates/reuses the filtered view, and backfills qualifying unanswered review entries without changing original responses. First run succeeded; zero existing responses qualified. The view was verified in Notion.

- 25 automated tests pass, including suggestion parsing, atomic Notion payload, stale Other exclusion and raw Sheet logging.
- Production build, TypeScript, targeted ESLint and diff whitespace checks pass.
- Browser: native wheel input moves immediately without a backlog; End travels through intro to Next; next-page navigation works; Age/Sex choices advance; 393 px and 320 px layouts have no horizontal overflow; labels computed at 22 px; no browser console errors.
- Touch path is implemented but not tested on physical iPhone hardware.
- No synthetic production application or email was created. Existing Sheet fallback remains; Jenny’s guide describes reconciliation if Notion is unavailable.

## Visible action area

Quiz 1 non-intro screens use a viewport-height flex layout: branding/navigation and action footer do not shrink; main content alone can scroll. Responsive spacing fits The deal, Contact, About and Frequency at 375×667 and 393×852 without content scrolling. Long supplement lists and expanded answers retain readable text and internal scrolling with Continue always visible, including at 320×568. Main is keyboard focusable. The animated opening retains native scrolling in its own content area.

QA: all primary question screens, expanded Fit/Other and prescription fields, short-phone footer bounds, no horizontal overflow, exit path and no console errors. No applications submitted in production.

## Opening artwork and arrow regression check

After the background-layer regression, restore solid #f2e9dd on the survey/hero and the page/browser chrome. The supplied white-backed brand artwork again multiplies against an actual cream backdrop. Keep a reserved right gutter rather than hiding the arrow beneath text. No border, shadow or background is applied to the arrow.

Checked fresh load (dots), settled icon/wordmark, scrolling immediately during the opening, fast downward movement, reverse scrolling, bottom/return arrow visibility, and Next navigation. At 393px and 320px the arrow starts 25px beyond the text/CTA boundary; no horizontal overflow. Page/hero/body computed colors all match rgb(242,233,221). No browser console errors. Existing action footer remains visible on The deal. Physical iPhone Safari is not directly tested. ESLint reports only the existing root-layout font warning; build, TypeScript and 25 tests pass.

## Centered scroll indicator

Replace the side arrow with a centered scroll icon and “Scroll down” label. A separate 64px bottom row (plus safe area) keeps it outside the text area. The intro uses a native scrolling article with unchanged story travel/timings; its passive listener now observes that article. Restore symmetric content padding. Hide the cue at the end and return it on upward scrolling. Its small wheel animation respects reduced motion. Other survey pages are unchanged.

## Larger questions and queue celebration

Remove horizontal dividers from question choices and deal sections. Enlarge question headings, option labels/descriptions, fields and action text while retaining the viewport action footer. At 393×852, all unexpanded Fit choices fit without scrolling; expanded responses and short screens scroll inside main. Frequency fits at 320×568. No horizontal overflow was found at either width.

The successful application page uses a larger two-line headline, lime highlight, sequential text entrance and a brief brand-color confetti burst. Motion runs once per mount, cleans up on exit, and is skipped or cancelled for reduced-motion preferences. The original queue status and next-step copy remain intact.

QA: completed the entire quiz against `tests/fixtures/mock-quiz-one.cjs`, including Other text and successful submission, without production records or messages. Inspected the entrance and settled success screen, steps 03/04, small-phone layouts and footer visibility. No browser console errors. Production build, TypeScript, targeted ESLint, 25 automated tests and whitespace checks pass. Physical iPhone Safari remains untested.

Local QA command after building:
`MARLO_LOCAL_QA=1 node --require ./tests/fixtures/mock-quiz-one.cjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 8772`
