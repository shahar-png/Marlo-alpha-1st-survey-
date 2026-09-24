import { stagingParticipant } from "@/lib/staging";
import { NextResponse } from "next/server";
import {
  notionEnabled,
  notionGetParticipant,
  notionFindByEmail,
} from "@/lib/notion";

export const runtime = "nodejs";

/** GET /api/participant?p=<page id> or ?email=… → who this Survey 2 / waiver run belongs to. Name and email only (they came from the person). */
export async function GET(req: Request) {
  const staging = stagingParticipant(req); if (staging) return staging;
  const q = new URL(req.url).searchParams;
  const p = q.get("p") || "";
  const email = (q.get("email") || "").trim().toLowerCase().slice(0, 120);
  if (!notionEnabled())
    return NextResponse.json({ error: "no_database" }, { status: 500 });
  try {
    let who = p
      ? await notionGetParticipant(p)
      : email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
        ? await notionFindByEmail(email)
        : null;
    // Additional profile context requires both the participant's private link and matching email.
    const profileAllowed =
      q.get("include") === "profile" &&
      Boolean(p && email && who?.email.toLowerCase() === email);
    if (email && (!who || who.email.toLowerCase() !== email))
      who = await notionFindByEmail(email);
    if (!who) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(
      {
        first_name: who.first_name,
        name: who.name,
        email: who.email,
        done: Boolean(who.survey2_done),
        signed: Boolean(who.waiver_signed),
        ...(profileAllowed ? { profile: who.profile } : {}),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    console.error("participant_lookup_failed", e);
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }
}
