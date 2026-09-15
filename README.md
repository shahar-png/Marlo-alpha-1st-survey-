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
- **Duplicates**: same email or phone already in Notion (or the sheet, if Notion is off) → the survey shows "You've already applied" and writes nothing.
- **Either destination can be off.** With only `NOTION_*` set, the sheet is skipped; with only the `APPS_SCRIPT_*` vars set, Notion is skipped (Jenny then creates the page from the row). Both set is the intended setup.
- **iPhone / US** are self-declared by tapping "I'm in" on the deal screen and written as Device = iPhone, Country = US. **Under 18** is the one hard stop (no submission; routed to the later-round page).

## Setup

1. Copy `.env.example` → `.env.local`, fill it (instructions inside).
2. `npm install` · `npm run dev` → http://localhost:3000
3. Vercel: import this repo, add the same env vars, deploy. Point the chosen domain at it.
4. As jenny@saymarlo.com: install `scripts/apps-script-email1.gs` in the sheet `survey-1-answers`, set the `SECRET` script property, deploy as a web app (steps in the file header). Put the URL and secret in Vercel.

## Notion properties written (must exist exactly as named)

Name · First name · Email · Phone · Age band · Sex · Device · Country · State · State changed · Applied · ICP bucket · Secondary tags · Fit text · Frequency · Supplements · Supplements other · Rx · Rx text — and for the later-round list: Name · Email · State · State changed · Waitlist tag · Gate reason.

## Sheet columns

Survey 1: submitted_at · full_name · first_name · phone_e164 · email · age_band · sex · fit · fit_text · icp_bucket · frequency · supplements · supplements_other · rx · rx_text · notion_page_id · email1_sent_at · user_agent
Later round: submitted_at · email · reason · notion_page_id · email_sent_at

## Bucketing (server-side)

Performance checked → Optimizer; else Longevity → Longevity; else Something specific → Specific condition; else Other. Remaining checks → Secondary tags.
