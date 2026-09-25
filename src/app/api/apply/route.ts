import { stagingBlocked } from "@/lib/staging";
import { NextResponse } from "next/server";
import { formatAttribution, type Attribution } from "@/lib/attribution";
import { bucket, LABELS, type Answers } from "@/lib/copy";
import { applicationQualifies } from "@/lib/qualify";
import { notionEnabled, notionFindParticipant, notionCreateApplicant } from "@/lib/notion";
import { sheetEnabled, sheetAppend } from "@/lib/sheet";

export const runtime = "nodejs";

// Sheet columns — the raw log. Keep in sync with survey-1-screens-v1.md "Data captured".
const COLUMNS = [
  "submitted_at", "full_name", "first_name", "phone", "email", "age_band", "sex",
  "fit", "fit_text", "icp_bucket", "frequency", "supplements", "supplements_other", "rx", "rx_text",
  "notion_page_id", "email1_sent_at", "user_agent",
  "device", "country", "supplement_count",
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "referrer",
] as const;

function clean(s: unknown, max = 500) {
  return String(s ?? "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
}

export async function POST(req: Request) {
  const staging = stagingBlocked(); if (staging) return staging;
  let a: Answers;
  try {
    a = (await req.json()) as Answers;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const digits = clean(a.phone).replace(/\D/g, "");
  const email = clean(a.email).toLowerCase();
  const fullName = clean(a.full_name, 120);
  if (digits.length !== 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || fullName.split(/\s+/).length < 2) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (a.age_band === "under_18") return NextResponse.json({ error: "under_18" }, { status: 400 });
  const device = clean(a.device, 40);
  const country = clean(a.country, 40);
  const supplement_count = clean(a.supplement_count, 20);
  // Failing gates must not create a participant, append a Survey 1 row, or send Email 1.
  if (!applicationQualifies({ device, country, supplement_count })) {
    return NextResponse.json({ error: "not_qualified" }, { status: 400 });
  }
  if (!notionEnabled() && !sheetEnabled()) return NextResponse.json({ error: "no_destination_configured" }, { status: 500 });
  const attribution: Attribution = {
    utm_source: clean(a.utm_source, 300),
    utm_medium: clean(a.utm_medium, 300),
    utm_campaign: clean(a.utm_campaign, 300),
    utm_term: clean(a.utm_term, 300),
    utm_content: clean(a.utm_content, 300),
    fbclid: clean(a.fbclid, 300),
    referrer: clean(a.referrer, 500),
  };

  const phoneE164 = `+1${digits}`;
  const submitted_at = new Date().toISOString();
  const fitIds = (a.fit || []).map((x) => clean(x, 20));
  const record = {
    full_name: fullName,
    first_name: fullName.split(/\s+/)[0],
    email,
    phone_e164: phoneE164,
    age_band: LABELS.age[clean(a.age_band, 20)] || "",
    sex: LABELS.sex[clean(a.sex, 20)] || "",
    fit: fitIds.map((f) => LABELS.fit[f]).filter(Boolean),
    fit_text: [clean(a.fit_specific_text), clean(a.fit_other_text)].filter(Boolean).join(" · "),
    icp_bucket: bucket(fitIds),
    frequency: LABELS.frequency[clean(a.frequency, 20)] || "",
    supplements: (a.supplements || []).map((s) => (s === "other" ? "Other" : LABELS.supplements[clean(s, 30)])).filter(Boolean),
    supplements_other: (a.supplements || []).includes("other") ? String(a.supplements_other ?? "").trim().slice(0, 500) : "",
    rx: Boolean(a.rx),
    rx_text: clean(a.rx_text),
    device,
    country,
    supplement_count,
    attribution: formatAttribution(attribution),
    submitted_at,
  };

  // 1. Database (Notion): duplicate guard, then create the participant page, State = Applied.
  let pageId = "";
  if (notionEnabled()) {
    try {
      const existing = await notionFindParticipant(email, phoneE164);
      if (existing) return NextResponse.json({ error: "duplicate" }, { status: 409 });
      pageId = await notionCreateApplicant(record);
    } catch (e) {
      console.error("notion_failed", e);
      if (!sheetEnabled()) return NextResponse.json({ error: "db_failed" }, { status: 500 });
    }
  }

  // 2. Raw log (Google Sheet) + Email 1, in one call to the Apps Script web app running as Jenny.
  if (sheetEnabled()) {
    try {
      const row: Record<string, string> = {
        submitted_at,
        full_name: record.full_name,
        first_name: record.first_name,
        phone: `+1 ${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`, // human form: Sheets would parse "+1212…" as a formula
        email,
        age_band: record.age_band,
        sex: record.sex,
        fit: record.fit.join(", "),
        fit_text: record.fit_text,
        icp_bucket: record.icp_bucket,
        frequency: record.frequency,
        supplements: record.supplements.join(", "),
        supplements_other: record.supplements_other,
        rx: record.rx ? "yes" : "no",
        rx_text: record.rx_text,
        notion_page_id: pageId,
        email1_sent_at: "",
        user_agent: clean(req.headers.get("user-agent"), 200),
        device,
        country,
        supplement_count,
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        utm_term: attribution.utm_term,
        utm_content: attribution.utm_content,
        fbclid: attribution.fbclid,
        referrer: attribution.referrer,
      };
      const { duplicate } = await sheetAppend("Survey 1", COLUMNS, row, pageId ? [] : ["email", "phone"]);
      if (duplicate) return NextResponse.json({ error: "duplicate" }, { status: 409 });
    } catch (e) {
      console.error("sheet_failed", e);
      if (!pageId) return NextResponse.json({ error: "log_failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
