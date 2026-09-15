import { NextResponse } from "next/server";
import { notionEnabled, notionGetParticipant } from "@/lib/notion";

export const runtime = "nodejs";

/** GET /api/participant?p=<page id> → who this Survey 2 link belongs to. Only the first name leaves the server. */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams.get("p") || "";
  if (!notionEnabled()) return NextResponse.json({ error: "no_database" }, { status: 500 });
  try {
    const who = await notionGetParticipant(p);
    if (!who) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ first_name: who.first_name, done: Boolean(who.survey2_done) });
  } catch (e) {
    console.error("participant_lookup_failed", e);
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }
}
