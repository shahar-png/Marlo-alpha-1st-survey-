import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { notionEnabled, notionGetParticipant, notionFindByEmail, notionUploadFile, notionWriteWaiver } from "@/lib/notion";
import { sheetEnabled, waiverDeliver } from "@/lib/sheet";
import { WAIVER_VERSION, waiverPlainText } from "@/lib/waiver";
import { buildWaiverPdf } from "@/lib/waiver-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

function clean(s: unknown, max = 300) {
  return String(s ?? "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
}

/**
 * Sign the participant agreement. Body: { waiver_version, p, email, name, signature (data:image/png;base64,…), typed, local_time }.
 * Identifies the participant (email first, then ?p= id), refuses a second signature (409), builds the PDF,
 * attaches it to the Notion card (Signed waiver + Waiver signed + Waiver version), then files/emails it via Apps Script.
 */
export async function POST(req: Request) {
  let body: { waiver_version?: string; p?: string; email?: string; name?: string; signature?: string; typed?: boolean; local_time?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }
  if (!notionEnabled()) return NextResponse.json({ error: "no_database" }, { status: 500 });

  // An open tab must sign the same wording it displayed, including after a deployment.
  if (body.waiver_version !== WAIVER_VERSION) return NextResponse.json({ error: "agreement_changed" }, { status: 412 });

  const name = clean(body.name, 120);
  const sig = String(body.signature || "");
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(sig);
  if (!name || name.length < 3 || !m) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const signaturePng = Buffer.from(m[1], "base64");
  const PNG_MAGIC = "89504e470d0a1a0a";
  if (signaturePng.length < 200 || signaturePng.length > 400_000 || signaturePng.subarray(0, 8).toString("hex") !== PNG_MAGIC || signaturePng.subarray(12, 16).toString() !== "IHDR") {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  // 1. Who is this?
  let who = null;
  try {
    if (body.email) who = await notionFindByEmail(clean(body.email, 120).toLowerCase());
    if (!body.email && body.p) who = await notionGetParticipant(clean(body.p, 40));
  } catch (e) {
    console.error("participant_lookup_failed", e);
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }
  if (!who) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (who.waiver_signed) return NextResponse.json({ error: "already_signed" }, { status: 409 });

  // 2. The record.
  const signedAt = new Date().toISOString();
  const hash = createHash("sha256").update(waiverPlainText()).digest("hex").slice(0, 12);
  const ip = clean(req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip"), 60);
  const userAgent = clean(req.headers.get("user-agent"), 220);
  const signedAtLocal = clean(body.local_time, 80) || signedAt.replace("T", " ").slice(0, 16) + " UTC";
  const filename = `Marlo-alpha-agreement-${name.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${signedAt.slice(0, 10)}.pdf`;

  let pdf: Uint8Array;
  try {
    pdf = await buildWaiverPdf({ name, email: who.email, signedAt, signedAtLocal, ip, userAgent, pageId: who.id, hash, signaturePng: new Uint8Array(signaturePng), typedSignature: Boolean(body.typed) });
  } catch (e) {
    console.error("pdf_failed", e);
    return NextResponse.json({ error: "pdf_failed" }, { status: 500 });
  }

  // 3. Onto the card first — this is the record, and what stops a second signature.
  try {
    const uploadId = await notionUploadFile(filename, "application/pdf", pdf);
    await notionWriteWaiver(who.id, signedAt, `${WAIVER_VERSION} · ${hash}`, uploadId, filename);
  } catch (e) {
    console.error("notion_failed", e);
    return NextResponse.json({ error: "db_failed" }, { status: 500 });
  }

  // 4. Drive copy + email to the participant (cc Jenny) + log row. Best effort: the card already holds the PDF.
  if (sheetEnabled()) {
    try {
      await waiverDeliver({
        to: who.email, name, first_name: who.first_name, filename, pdfBase64: Buffer.from(pdf).toString("base64"),
        row: { signed_at: signedAt, notion_page_id: who.id, email: who.email, name, waiver_version: WAIVER_VERSION, text_hash: hash, signature_kind: body.typed ? "typed" : "drawn", ip, user_agent: userAgent },
      });
    } catch (e) {
      console.error("waiver_deliver_failed", e);
    }
  }
  return NextResponse.json({ ok: true, first_name: who.first_name });
}
