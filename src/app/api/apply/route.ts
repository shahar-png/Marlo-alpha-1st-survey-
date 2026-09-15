import { NextResponse } from "next/server";
import { google } from "googleapis";
import { bucket, type Answers } from "@/lib/copy";

export const runtime = "nodejs";

// Sheet columns — keep in sync with survey-1-screens-v1.md "Data captured" and the Notion spec.
const COLUMNS = [
  "submitted_at",
  "full_name",
  "first_name",
  "phone_e164",
  "email",
  "age_band",
  "sex",
  "device",
  "country",
  "fit",
  "fit_specific_text",
  "fit_other_text",
  "icp_bucket",
  "frequency",
  "supplements",
  "supplements_other",
  "rx",
  "rx_text",
  "user_agent",
] as const;

function sheets() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("missing_google_credentials");
  const auth = new google.auth.JWT({ email, key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  return google.sheets({ version: "v4", auth });
}

function clean(s: unknown, max = 500) {
  return String(s ?? "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
}

export async function POST(req: Request) {
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
  if (a.age_band === "under_18") {
    return NextResponse.json({ error: "under_18" }, { status: 400 });
  }

  const sheetId = process.env.SHEET_ID;
  const tab = process.env.SHEET_TAB || "Survey 1";
  if (!sheetId) return NextResponse.json({ error: "missing_sheet_id" }, { status: 500 });

  const phoneE164 = `+1${digits}`;
  const api = sheets();

  // Duplicate check: same email or phone already on the sheet → 409, nothing written.
  try {
    const existing = await api.spreadsheets.values.get({ spreadsheetId: sheetId, range: `'${tab}'!A:E` });
    const rows = existing.data.values || [];
    const iPhone = COLUMNS.indexOf("phone_e164");
    const iEmail = COLUMNS.indexOf("email");
    const dup = rows.slice(1).some((r) => (r[iPhone] || "") === phoneE164 || String(r[iEmail] || "").toLowerCase() === email);
    if (dup) return NextResponse.json({ error: "duplicate" }, { status: 409 });
    if (rows.length === 0) {
      await api.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `'${tab}'!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [[...COLUMNS]] },
      });
    }
  } catch (e) {
    console.error("sheet_read_failed", e);
    return NextResponse.json({ error: "sheet_read_failed" }, { status: 500 });
  }

  const row: Record<(typeof COLUMNS)[number], string> = {
    submitted_at: new Date().toISOString(),
    full_name: fullName,
    first_name: fullName.split(/\s+/)[0],
    phone_e164: phoneE164,
    email,
    age_band: clean(a.age_band, 20),
    sex: clean(a.sex, 20),
    device: clean(a.device, 20),
    country: clean(a.country, 20),
    fit: (a.fit || []).map((x) => clean(x, 20)).join(", "),
    fit_specific_text: clean(a.fit_specific_text),
    fit_other_text: clean(a.fit_other_text),
    icp_bucket: bucket(a.fit || []),
    frequency: clean(a.frequency, 20),
    supplements: (a.supplements || []).map((x) => clean(x, 30)).join(", "),
    supplements_other: clean(a.supplements_other),
    rx: a.rx ? "yes" : "no",
    rx_text: clean(a.rx_text),
    user_agent: clean(req.headers.get("user-agent"), 200),
  };

  try {
    await api.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `'${tab}'!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [COLUMNS.map((c) => row[c])] },
    });
  } catch (e) {
    console.error("sheet_append_failed", e);
    return NextResponse.json({ error: "sheet_append_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
