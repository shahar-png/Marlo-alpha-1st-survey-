import { NextResponse } from "next/server";
import { EMPTY2, SHEET2_COLUMNS, flatten, tagsFrom, type Answers2 } from "@/lib/survey2";
import { notionEnabled, notionGetParticipant, notionFindByEmail, notionWriteSurvey2 } from "@/lib/notion";
import { sheetEnabled, sheetAppend } from "@/lib/sheet";

export const runtime = "nodejs";

function clean(s: unknown, max = 500) {
  return String(s ?? "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
}

/** Survey 2 submit: identify the participant (?p= page id, or email fallback), log the row, write the tags to the same Notion page. */
export async function POST(req: Request) {
  let body: { p?: string; email?: string; answers?: Partial<Answers2> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  if (!notionEnabled()) return NextResponse.json({ error: "no_database" }, { status: 500 });

  // Sanitize: only known keys, only strings / string arrays / the one number.
  const a: Answers2 = { ...EMPTY2 };
  for (const k of Object.keys(EMPTY2) as (keyof Answers2)[]) {
    const v = body.answers?.[k];
    if (v === undefined) continue;
    if (k === "confidence") (a as Record<string, unknown>)[k] = Math.min(5, Math.max(0, Number(v) || 0));
    else if (k === "pains") (a as Record<string, unknown>)[k] = Object.fromEntries(Object.entries((v as Record<string, string>) || {}).map(([i, l]) => [clean(i, 30), clean(l, 2)]));
    else if (Array.isArray(EMPTY2[k])) (a as Record<string, unknown>)[k] = (Array.isArray(v) ? v : []).map((x) => clean(x, 40)).slice(0, 20);
    else (a as Record<string, unknown>)[k] = clean(v, k === "stop_why_other" ? 500 : 40);
  }

  // 1. Who is this?
  let who = null;
  try {
    who = body.p ? await notionGetParticipant(clean(body.p, 40)) : null;
    if (!who && body.email) who = await notionFindByEmail(clean(body.email, 120).toLowerCase());
  } catch (e) {
    console.error("participant_lookup_failed", e);
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }
  if (!who) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (who.survey2_done) return NextResponse.json({ error: "already_done" }, { status: 409 });

  const submitted_at = new Date().toISOString();
  const tags = tagsFrom(a);

  // 2. Raw log (sheet, tab "Survey 2" — no email is sent for this tab).
  let rowUrl = "";
  if (sheetEnabled()) {
    try {
      const flat = flatten(a);
      const row: Record<string, string> = {
        submitted_at,
        notion_page_id: who.id,
        email: who.email,
        first_name: who.first_name,
        ...flat,
        tag_lead_pain: tags["Lead pain"],
        tag_research_style: tags["Research style"],
        tag_skeptic: tags.Skeptic,
        tag_delegation: tags.Delegation,
        tag_proof_standard: tags["Proof standard"].join(", "),
        tag_data_vs_feel: tags["Data vs feel"],
        tag_tech_comfort: tags["Tech comfort"],
        tag_spend_tier: tags["Spend tier"],
        tag_baseline_confidence: String(tags["Baseline confidence (1–5)"] || ""),
        tag_baseline_hours: tags["Baseline hours"],
        tag_baseline_feel: tags["Baseline feel"],
        raw_json: JSON.stringify(a),
        user_agent: clean(req.headers.get("user-agent"), 200),
      };
      rowUrl = (await sheetAppend("Survey 2", SHEET2_COLUMNS, row)).rowUrl;
    } catch (e) {
      console.error("sheet_failed", e); // the Notion write below is what matters; the row is the backup
    }
  }

  // 3. Tags onto the participant page.
  try {
    await notionWriteSurvey2(who.id, tags, submitted_at, rowUrl);
  } catch (e) {
    console.error("notion_failed", e);
    return NextResponse.json({ error: "db_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, first_name: who.first_name });
}
