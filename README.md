# Marlo alpha — Survey 1

The application survey for the Marlo alpha. Eight screens, mobile-first, one column on every width.
Copy is `survey-1-screens-v1.md` v1.2 (Drive: Alpha program/01_Recruiting). Do not edit copy here without updating that file.

## How it works

- Next.js (App Router) on Vercel. No database, no email code.
- `POST /api/apply` validates the answers, checks the Google Sheet for a duplicate (same email or phone → 409), and appends one row.
- Jenny (program manager) watches the sheet: new row → creates the participant in Notion, sends email 1 within the hour, runs the gates.
- The only hard stop inside the survey is **Under 18** (no submission). Every other criterion (iPhone, US, bucket) is collected and applied by Jenny after submit.

## Setup

1. Copy `.env.example` → `.env.local` and fill it (see the comments there).
2. `npm install` · `npm run dev` → http://localhost:3000
3. Deploy: connect this repo to Vercel, add the same env vars, deploy. Point `apply.saymarlo.com` (or the chosen domain) at it.

## Sheet columns

submitted_at · full_name · first_name · phone_e164 · email · age_band · sex · device · country · fit · fit_specific_text · fit_other_text · icp_bucket · frequency · supplements · supplements_other · rx · rx_text · user_agent

The header row is written automatically on the first submission.

## Bucketing (server-side, `icp_bucket`)

Performance checked → Optimizer; else Longevity → Longevity; else Something specific → Specific condition; else Other.
