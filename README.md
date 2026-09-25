# Marlo alpha — Survey 1

The application survey for the Marlo alpha. Eight screens plus the later-round exit flow, mobile-first, one 393px column on every width, design system v5 "Unified" (Hanken Grotesk, cream, salmon).
Copy and screens: `survey-1-screens-v1.md` (Drive: Alpha program/01_Recruiting) and the approved canvas "Marlo Alpha Survey". Do not change copy here without changing it there.

## How it links up

```
applicant ──▶ survey (Vercel) ──▶ POST /api/apply
                                    │
                                    ├─▶ Notion · Participants     new page, State = Applied, all Survey 1 fields   ← the database
                                    │
                                    └─▶ Apps Script web app in the Google Sheet (runs as jenny@)
                                              ├─▶ Sheet · "Survey 1"  one raw row (backup, Jenny's export)
                                              └─▶ Email 1 to the applicant from Jenny's inbox, stamps email1_sent_at

"I don't fit this round" / Under 18 ──▶ later-round page ──▶ "I'm interested" ──▶ POST /api/later
                                    ├─▶ Notion · Participants     State = Waitlisted, tag Later program
                                    └─▶ Apps Script ──▶ Sheet · "Later round" row + "Done, you're on the list" email
```

- **Notion is the database.** The survey creates the participant page directly, with the property names from `notion-build-spec-v1.md`. Jenny's pipeline starts from that page (State = Applied → she runs the gates).
- **The Sheet is the raw log and Email 1 goes out in the same call.** `/api/apply` POSTs to the Apps Script web app deployed from the sheet (runs as Jenny, guarded by a shared secret). The script appends the row, sends Email 1 from Jenny's inbox, and stamps `email1_sent_at` — instantly, no trigger. No Google Cloud service account is involved (the org policy blocks key creation anyway).
- **Duplicates**: same email or phone already in Notion (or the sheet, if Notion is off) → the survey shows "You've already applied" and writes nothing. Email 0 Apply link can use `https://alpha.marlo.me/?reset=1` for retests.
- **Either destination can be off.** With only `NOTION_*` set, the sheet is skipped; with only the `APPS_SCRIPT_*` vars set, Notion is skipped (Jenny then creates the page from the row). Both set is the intended setup.
- **Hard gates** sit after The deal and before contact. Pass: lives in the US (`country` `US`), uses an iPhone (`device` `iPhone`), and takes `6+` different supplements on a typical day (`supplement_count`, not frequency). Fail — No (`Outside US`), Android, Other, or under 6 (`0`, `1–2`, `3–5`) — opens the existing later-round page and does not POST `/api/apply`. **Under 18** is still a hard stop on the age question. "I don't fit this round" on the deal screen still opens that same later-round page. Passing answers are written as Notion Device = iPhone and Country = US.
- **Meta Pixel.** Set `NEXT_PUBLIC_META_PIXEL_ID` (digits only) on the Vercel project. The base code loads on Survey 1 and tracks PageView. `Lead` fires only after `POST /api/apply` returns HTTP 200. If the variable is missing or not digits, the pixel does not load and Lead is a no-op. Do not put an ID in source.
- **Attribution.** The first load stores `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `fbclid`, and `document.referrer` (external only) in `sessionStorage` so they survive the SPA steps and a refresh in the same tab. They are included on the apply JSON, as Sheet columns, and as Notion **Attribution**. A URL value replaces a stored one; the first external referrer is kept.

**Public host (24 Sep 2026):** `https://alpha.marlo.me` — the custom domain on the Vercel project. `marlo-alpha-1st-survey.vercel.app` still resolves to the same deployment; every link Jenny sends uses alpha.marlo.me.

## Survey 2 · the deep dive (`/deep-dive`)

Linked from Email 2 as `https://alpha.marlo.me/deep-dive?p=<Participants page id>` — the Participants database has a **Survey 2 link** formula that builds it per person. No `?p=` → the intro asks for the email they applied with.

```
participant ──▶ /deep-dive?p=… ──▶ GET /api/participant  (first name, already done?)
                 10 parts, ~38 questions ──▶ POST /api/deep-dive
                                    ├─▶ Apps Script ──▶ Sheet · "Survey 2"   full row + raw JSON (no email)
                                    └─▶ Notion · same Participants page      Survey 2 done · Survey 2 raw (row link) · 11 tags
```

Tags written: Baseline confidence / hours / feel · Spend tier · Tech comfort · Research style · Skeptic · Delegation · Proof standard · Lead pain · Data vs feel (derived: paid testing, yearly blood work, a wearable, blood/wearable proof → 3+ = Data, 0 = Feel, else Mixed). **Persona, Runner-up, Confidence are not set** — Jenny runs `persona-scoring-rules-v1.xlsx` over the row. A second submit is refused (409) once `Survey 2 done` is set. Part 6 (pains) is one tap per line — not an issue / annoying / a real problem — then one pick among the rated items; that pick is Lead pain.

## Waiver · the participant agreement (`/waiver`)

The e-sign version of `02_Acceptance/alpha-participant-agreement-v1.md`. Linked from Email 2 as `https://alpha.marlo.me/waiver?p=<Participants page id>` — the Participants database has a **Waiver link** formula that builds it per person. No `?p=` → the intro asks for the email they applied with; an email that isn't in the database is refused ("This email is not in our system…").

```
participant ──▶ /waiver?p=… ──▶ GET /api/participant  (name, email, already signed?)
                 reads the agreement (src/lib/waiver.ts), name pre-filled, draws or types a signature,
                 ticks "I agree… and agree to sign electronically" ──▶ POST /api/waiver
                                    ├─▶ PDF (pdf-lib): agreement + signature + audit block (UTC time, IP, device, version, text hash)
                                    ├─▶ Notion · same Participants page   Signed waiver (the PDF) · Waiver signed · Waiver version
                                    └─▶ Apps Script (action "waiver")     Drive 02_Acceptance/signed/ · email to the participant, cc Jenny · row in tab "Waiver"
```

The Notion write happens first and is the record; Drive/email/log are best effort. A second signature is refused (409) once `Waiver signed` is set. The agreement text lives in `src/lib/waiver.ts` — change the .md first, then this file, then bump `WAIVER_VERSION`; the version and a sha256 of the text are stamped on every PDF and on the card, so a text change never silently re-labels an old signature. Not "HIPAA compliant" and not a named e-sign provider: a click-to-sign with typed/drawn signature and audit trail (ESIGN/UETA) — counsel review of the text is still open.

## Program guide (`/guide`)

The participant-facing program guide, rendered from `02_Acceptance/program-guide-v1.md` (copy verbatim — change the .md first, then the page). Linked from Email 2 as `https://alpha.marlo.me/guide`.

## Setup

1. Copy `.env.example` → `.env.local`, fill it (instructions inside).
2. `npm install` · `npm run dev` → http://localhost:3000
3. Vercel: import this repo, add the same env vars, deploy. Point the chosen domain at it.
4. As jenny@saymarlo.com: install `scripts/apps-script-email1.gs` in the sheet `survey-1-answers`, set the `SECRET` script property, deploy as a web app (steps in the file header). Put the URL and secret in Vercel. After this file changes, redeploy that web app (Manage deployments → edit → new version) so new Sheet columns are appended. The URL stays the same.
5. Vercel env `NEXT_PUBLIC_META_PIXEL_ID`: the Meta Pixel ID for Survey 1. Leave it unset until the pixel exists; the survey still works.

## Notion properties written (must exist exactly as named)

Name · First name · Email · Phone · Age band · Sex · Device · Country · Supplement count · Attribution · State · State changed · Applied · ICP bucket · Secondary tags · Fit text · Frequency · Supplements · Supplements other · Rx · Rx text — and for the later-round list: Name · Email · State · State changed · Waitlist tag · Gate reason.

## Sheet columns

Survey 1: submitted_at · full_name · first_name · phone · email · age_band · sex · fit · fit_text · icp_bucket · frequency · supplements · supplements_other · rx · rx_text · notion_page_id · email1_sent_at · user_agent · device · country · supplement_count · utm_source · utm_medium · utm_campaign · utm_term · utm_content · fbclid · referrer
Later round: submitted_at · email · reason · notion_page_id · email_sent_at

## Bucketing (server-side)

Performance checked → Optimizer; else Longevity → Longevity; else Something specific → Specific condition; else Other. Remaining checks → Secondary tags.

## Current Survey 2 experience

The approved story quiz is live on the same `/deep-dive` route. See [Jenny's link guide](docs/jenny-survey-links.md) and the [machine-readable production links](https://alpha.marlo.me/survey-links.json). Personal `?p=` links remain compatible.

The client preserves the original answer schema and adds ranking/profile context inside `raw_json.context`, without changing Sheet columns or Notion tags. Drafts stay in session storage for the current browser tab and are restored only after participant lookup. No fictional profile data ships. Saved profile context is returned only for a personal link plus its matching email; the email-only entry can collect optional profile details without exposing the saved supplement list.

Validation: `npm test`, `npx tsc --noEmit`, `npm run build`. Safe interactive QA: build, then `npm run qa:serve` (fake Notion and Sheet only; do not use production for test submissions).

## Current guide and agreement design

The approved branded documents remain at `/guide` and `/waiver`; personal waiver links keep their `p` parameter. Coverage is up to $200 per month. New signatures record agreement v2 (23 September 2026) and its text hash, including in the branded PDF. See [document release QA](docs/guide-waiver-qa.md) and [Jenny’s stable links](docs/jenny-survey-links.md).
