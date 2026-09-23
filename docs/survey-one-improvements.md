# Quiz 1 improvements · 23 September 2026

## Behavior

The original hard scroll cap was removed after user feedback about sticking and jumps. The intro now observes native scrolling without intercepting wheel, touch, keyboard, scrollbar or momentum. Story travel is 1.25 times its original length (20% slower progress for the same gesture); the crossfade timings are also divided by .8. Scrolling during the opening reveals its content immediately. Reduced-motion content stays static.

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
