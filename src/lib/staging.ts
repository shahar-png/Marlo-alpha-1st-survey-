import { NextResponse } from "next/server";
import { STAGING } from "./staging-mode";
import { isComplete, restoreAnswers } from "./survey2-flow";

export function stagingBlocked() {
  return STAGING ? NextResponse.json({ error: "staging_disabled", message: "Only Quiz 2 is available for this staging test. No records are created." }, { status: 403 }) : null;
}
export function stagingParticipant(req: Request) {
  if (!STAGING) return null;
  const email = (new URL(req.url).searchParams.get("email") || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120)
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  return NextResponse.json({ first_name: "Alex", name: "Alex (QA example)", email, done: false, signed: false, staging: true,
    profile: { age: "38", ageBand: "35–44", goal: "Performance", stack: "Magnesium, vitamin D, omega-3", routine: "Most days" }
  }, { headers: { "Cache-Control": "no-store" } });
}
export function stagingSubmission(body: { email?: string; answers?: unknown }) {
  if (!STAGING) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(body.email || "") || !isComplete(restoreAnswers(body.answers)))
    return NextResponse.json({ error: "incomplete" }, { status: 400 });
  // Stateless by design: no external lookup, persistence, email, or completion flag.
  return NextResponse.json({ ok: true, staging: true, first_name: "Alex" }, { headers: { "Cache-Control": "no-store" } });
}
