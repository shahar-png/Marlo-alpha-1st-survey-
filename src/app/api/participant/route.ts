import { NextResponse } from "next/server";
import { notionEnabled, notionGetParticipant, notionFindByEmail } from "@/lib/notion";

export const runtime = "nodejs";

/** GET /api/participant?p=<page id> or ?email=… → who this Survey 2 run belongs to. Only the first name leaves the server. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const p = q.get("p") || "";
  const email = (q.get("email") || "").trim().toLowerCase().slice(0, 120);
  if (!notionEnabled()) return NextResponse.json({ error: "no_database" }, { status: 500 });
  try {
    const who = p ? await notionGetParticipant(p) : email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? await notionFindByEmail(email) : null;
    if (!who) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ first_name: who.first_name, email: who.email, done: Boolean(who.survey2_done) });
  } catch (e) {
    console.error("participant_lookup_failed", e);
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }
}
