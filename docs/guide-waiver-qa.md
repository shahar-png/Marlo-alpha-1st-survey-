# Guide and agreement release — 23 September 2026

## Published routes and source

- `/guide` and `/waiver` retain their existing production URLs; `?p=<participant page id>` remains supported for waiver email prefill.
- The approved cream/ink/slate/lime design uses the original wordmark and icon, expandable chapters, rounded SVG-arrow CTAs, and separate reading/signing steps.
- Coverage is up to $200 per month. The shared Drive source files `02_Acceptance (agreement, waiver)/program-guide-v1.md` and `alpha-participant-agreement-v1.md` were updated in place (v2, 23 September 2026), preserving their paths. Pre-change copies are retained in the task's local source-backup directory.
- `WAIVER_VERSION` is v2. Newly signed PDFs carry that version and the new text hash; historical PDFs/records are untouched. Outdated tabs cannot sign unseen replacement terms: the API rejects a different/missing version and the current client reloads on that response.
- An explicit unknown email cannot fall back to signing for a different participant ID.
- Jenny's documentation and `public/survey-links.json` list the same permanent guide and agreement links.

## Automated verification

- `npm test`: 22 tests passed, including the new waiver API/PDF contract check and the existing survey tests.
- `npx tsc --noEmit`: passed.
- ESLint on all changed TS/TSX files: passed.
- `npm run build`: passed. All existing routes retained; PDF branding assets included in the waiver function's traced files.
- `git diff --check`: passed.
- New tests verify monthly terms, agreement version/hash, malformed signature rejection, missing participant (including mismatched personal link), outdated version rejection, failed write, successful PDF upload and delivery payload, and duplicate refusal.

## Local browser verification

Run the production build with isolated synthetic services:

```sh
MARLO_LOCAL_QA=1 node --require ./tests/fixtures/mock-documents.cjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 8772
```

The fixture overrides credentials, mocks Notion/Apps Script, and blocks unexpected external writes. No real participant records or messages are created.

Passed:
- Guide cover, all eight expand/collapse chapters, coverage copy, existing section anchors, agreement link.
- Agreement cover, unknown-email error, personal-link prefill and lookup, ten readable sections, read/sign navigation.
- Full-name/signature/consent gating; typed submission and drawn submission.
- Drawing makes signing available only with consent; Clear disables signing again.
- Simulated database failure (`retry@example.com`) presents recovery; retry succeeds; subsequent lookup shows Already signed.
- Final versioned client completes through confirmation against the final build.
- 393px and 320px views: no horizontal overflow on representative guide, agreement, reading, signature and confirmation screens.
- No browser JavaScript errors.
- All four generated PDF pages visually inspected for branding, monthly terms, text layout, signature area, pagination and audit record.

Production checks are read-only; signing is exercised only with the local synthetic fixture.
