# Survey 2 release QA — 23 September 2026

## Automated checks

- `npm test`: 21 tests passed, including original API contracts, profile lookup privacy, context persistence, all original question coverage, conditional cleanup, image selection, and age-band fallbacks.
- `npx tsc --noEmit`: passed.
- ESLint on the changed TypeScript/TSX files: zero errors; one existing custom-font placement warning in the root layout.
- `npm run build`: passed; existing application, deep-dive, guide, and waiver routes retained.
- `git diff --check`: passed.

## Browser checks on the production build

Run with the isolated local upstream fixture (`npm run qa:serve`), with synthetic participant data and no production writes:

- Personal link pre-fills email and loads the matching profile after confirmation.
- Animated opening, priority ranking (button and keyboard), and question navigation work.
- All 10 chapters complete through review; required questions block Continue until answered.
- All five wearable choices display their corresponding approved image and copy. Multiple selections can be switched individually; “No” skips the wearable insight.
- At 320px and 393px mobile widths, representative screens render without horizontal overflow.
- Reload and email confirmation restore the draft and priority order.
- Review/edit links return to the relevant questions.
- Failed submission preserves answers; retry succeeds. Synthetic saved data retains the 58 Sheet columns, original answers, and new profile/priority context.
- Unknown email, failed lookup, and already-completed states display actionable feedback.

Production verification after deployment is read-only. End-to-end submission and retry are exercised against the isolated fixture rather than creating real participant records or sending emails.
