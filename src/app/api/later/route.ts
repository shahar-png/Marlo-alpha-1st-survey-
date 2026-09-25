import { stagingBlocked } from "@/lib/staging";
import { NextResponse } from "next/server";
import { notionEnabled, notionCreateLaterRound } from "@/lib/notion";
import { sheetEnabled, sheetAppend } from "@/lib/sheet";

export const runtime = "nodejs";

const COLUMNS = ["submitted_at", "email", "reason", "notion_page_id", "email_sent_at"] as const;

/** "I'm interested" on the later-round page: email only. */
export async function POST(req: Request) {
  const staging = stagingBlocked(); if (staging) return staging;
  let body: { email?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const email = String(body.email || "").trim().toLowerCase();
  const reason = String(body.reason || "doesnt_fit").slice(0, 40);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const submitted_at = new Date().toISOString();
  let pageId = "";
  if (notionEnabled()) {
    try {
      pageId = await notionCreateLaterRound(email, submitted_at, reason);
    } catch (e) {
      console.error("notion_failed", e);
    }
  }
  if (sheetEnabled()) {
    try {
      await sheetAppend("Later round", COLUMNS, { submitted_at, email, reason, notion_page_id: pageId, email_sent_at: "" }, ["email"]);
    } catch (e) {
      console.error("sheet_failed", e);
      if (!pageId) return NextResponse.json({ error: "log_failed" }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
