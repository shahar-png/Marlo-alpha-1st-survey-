import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { POST } from "../src/app/api/waiver/route";
import { WAIVER_VERSION, waiverPlainText } from "../src/lib/waiver";
import { createHash } from "node:crypto";

test("agreement records monthly coverage and preserves signing, PDF, delivery and duplicate contracts", async t => {
  const keys = ["NOTION_TOKEN", "NOTION_PARTICIPANTS_DB", "APPS_SCRIPT_URL", "APPS_SCRIPT_SECRET"];
  const saved = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  Object.assign(process.env, { NOTION_TOKEN: "qa-only", NOTION_PARTICIPANTS_DB: "qa-db", APPS_SCRIPT_URL: "https://qa.invalid/sheet", APPS_SCRIPT_SECRET: "qa-only" });
  t.after(() => keys.forEach(k => { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }));
  let signed = false, missing = false, failWrite = false;
  let savedProperties: Record<string, unknown> = {}, delivered: Record<string, unknown> = {};
  let writes = 0;
  const id = "00000000-0000-0000-0000-000000000001";
  const page = () => ({ id, properties: { Name: { type: "title", title: [{ plain_text: "Alex Example" }] }, Email: { type: "email", email: "alex@example.com" }, "First name": { type: "rich_text", rich_text: [{ plain_text: "Alex" }] }, "Waiver signed": { type: "date", date: signed ? { start: "2026-09-23" } : null } } });
  t.mock.method(console, "error", () => {});
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input), method = init?.method || "GET";
    if (url === "https://qa.invalid/sheet") { delivered = JSON.parse(String(init?.body)); return Response.json({ ok: true }); }
    if (!url.startsWith("https://api.notion.com/")) throw new Error("Unexpected network access: " + url);
    if (url.endsWith("/query")) return Response.json({ results: missing ? [] : [page()] });
    if (url.endsWith("/file_uploads")) return Response.json({ id: "qa-upload" });
    if (url.endsWith("/send")) {
      const file = (init?.body as FormData).get("file") as File;
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      assert(pdf.getPageCount() >= 3); assert.equal(pdf.getAuthor(), "OliHealth Inc.");
      return Response.json({});
    }
    if (method === "PATCH") { writes++; if (failWrite) return Response.json({}, { status: 500 }); savedProperties = JSON.parse(String(init?.body)).properties; signed = true; return Response.json({}); }
    return Response.json(page());
  });
  const signature = "data:image/png;base64," + (await readFile("public/brand/marlo-wordmark.png")).toString("base64");
  const body = { waiver_version: WAIVER_VERSION, email: "alex@example.com", name: "Alex Example", signature, typed: true, local_time: "Sep 23, 2026, 3:00 PM EDT" };
  const send = (b: unknown) => POST(new Request("http://localhost/api/waiver", { method: "POST", body: JSON.stringify(b) }));
  assert.match(waiverPlainText(), /up to \$200 per month/);
  assert.match(waiverPlainText(), /further orders that month/);
  assert.doesNotMatch(waiverPlainText(), /up to a total of \$200/);
  assert.match(WAIVER_VERSION, /^v2/);
  assert.equal((await send({ ...body, waiver_version: "v1" })).status, 412);
  assert.equal((await send({ ...body, signature: "bad" })).status, 400);
  missing = true; assert.equal((await send(body)).status, 404); assert.equal((await send({ ...body, p: id })).status, 404); missing = false;
  failWrite = true; assert.equal((await send(body)).status, 500); assert.equal(signed, false); failWrite = false;
  assert.equal((await send(body)).status, 200);
  const props = JSON.stringify(savedProperties);
  assert(props.includes(WAIVER_VERSION));
  assert(props.includes(createHash("sha256").update(waiverPlainText()).digest("hex").slice(0, 12)));
  assert.equal(delivered.to, "alex@example.com"); assert.equal(delivered.action, "waiver");
  assert.equal((delivered.row as Record<string, string>).signature_kind, "typed");
  await writeFile("/tmp/marlo-agreement-qa.pdf", Buffer.from(delivered.pdfBase64 as string, "base64"));
  const count = writes; assert.equal((await send(body)).status, 409); assert.equal(writes, count);
});
