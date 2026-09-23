# Jenny — current survey links

The approved interactive Survey 2 is served at the existing production route:

**https://marlo-alpha-1st-survey.vercel.app/deep-dive**

For Email 2, pull the **Survey 2 link** property from the participant's current Notion Participants card. It has this form:

`https://marlo-alpha-1st-survey.vercel.app/deep-dive?p=<participant page id>`

Keep the `p` parameter. The link pre-fills the email; after the participant confirms it, the matching personal link can show the saved Survey 1 profile. Generic links still accept the application email, with optional self-entered profile details. Old personal links become invalid if their participant cards are deleted and recreated; always pull from the current card.

A stable machine-readable link directory is published at:

**https://marlo-alpha-1st-survey.vercel.app/survey-links.json**

Read `survey_2` for the generic route and `survey_2_personalized_template` for the shape of personal links. No Notion formula change or Apps Script redeployment is required. Never send a localhost design preview or a Vercel branch preview.

## What changed

Animated brand opening, profile confirmation, priority ranking, individual questions, seven possible insight breaks, and device-specific wearable imagery. “No” skips the wearable insight. Multiple wearables can be viewed individually. All 38 original questions, 12 pain ratings, Notion tag names, Sheet columns, and final submission endpoint are retained.

Priority order and participant edits to profile context are in the existing Survey 2 `raw_json.context` field. Profile edits do not rewrite the original application or change Jenny's persona scoring. Benchmark cards show published population statistics; they are not clinical assessments or a measured full-profile match.

## Quality checks

`npm test`, `npx tsc --noEmit`, and `npm run build` must pass. To exercise submission without writing to real systems, build then run `npm run qa:serve` and use `http://127.0.0.1:8771/deep-dive?p=00000000-0000-0000-0000-000000000001`. The QA server uses fake upstream responses, fails the first Notion write to test retry, and saves only a synthetic payload to `/tmp/marlo-survey2-qa-last-submit.json`. It has no public QA route and is never deployed.

## Program guide and participant agreement

The approved Marlo document design is published at the same permanent links:

- Program guide: **https://marlo-alpha-1st-survey.vercel.app/guide**
- Agreement: **https://marlo-alpha-1st-survey.vercel.app/waiver**
- Personal agreement: use the current participant card's **Waiver link**, preserving `?p=<participant page id>`.

The link directory now also provides `program_guide`, `participant_agreement`, and `participant_agreement_personalized_template`. Fetch these stable URLs to retrieve the latest pages; do not send the HTML design preview. The coverage is **up to $200 per month** during the program. Newly signed agreements use **v2 · 23 Sep 2026**, and the signed PDF records that version and its text hash. Previously signed records and PDFs are not rewritten.
