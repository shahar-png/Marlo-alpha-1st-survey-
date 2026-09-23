import test from "node:test";
import assert from "node:assert/strict";
import { supplementSuggestions } from "../src/lib/supplement-improvements";
import { notionCreateApplicant, type ApplicantRecord } from "../src/lib/notion";
import { POST } from "../src/app/api/apply/route";

test("supplement queue filters listed items, keeps novel wording and deduplicates each response", () => {
  assert.deepEqual(supplementSuggestions("Vitamin D, D3; fish oil\nB12; turmeric; vitamin C"), []);
  assert.deepEqual(supplementSuggestions("L-theanine, taurine and Vitamin K2; l-THEANINE"), ["L-theanine", "taurine", "Vitamin K2"]);
  assert.deepEqual(supplementSuggestions("none; N/A; no"), []);
  assert.deepEqual(supplementSuggestions("My doctor suggested a blend with taurine"), ["My doctor suggested a blend with taurine"]);
});
test("unlisted supplements and review status are saved atomically with the application", async t => {
  const old = { token: process.env.NOTION_TOKEN, db: process.env.NOTION_PARTICIPANTS_DB };
  process.env.NOTION_TOKEN = "qa-only"; process.env.NOTION_PARTICIPANTS_DB = "qa-db";
  t.after(() => { if (old.token === undefined) delete process.env.NOTION_TOKEN; else process.env.NOTION_TOKEN = old.token; if (old.db === undefined) delete process.env.NOTION_PARTICIPANTS_DB; else process.env.NOTION_PARTICIPANTS_DB = old.db; });
  const payloads: { properties: Record<string, unknown> }[] = [];
  t.mock.method(globalThis, "fetch", async (_input: unknown, init?: RequestInit) => { payloads.push(JSON.parse(String(init?.body))); return Response.json({ id: "qa-participant" }); });
  const a: ApplicantRecord = { full_name: "Alex Example", first_name: "Alex", email: "alex@example.com", phone_e164: "+15555550123", age_band: "35–44", sex: "Female", fit: ["Longevity"], fit_text: "", icp_bucket: "Longevity", frequency: "Every day", supplements: ["Other"], supplements_other: "Taurine; vitamin D", rx: false, rx_text: "", submitted_at: "2026-09-23T12:00:00Z" };
  await notionCreateApplicant(a);
  assert.equal(payloads.length, 1);
  assert.deepEqual(payloads[0].properties["Supplement suggestions"], { rich_text: [{ text: { content: "Taurine" } }] });
  assert.deepEqual(payloads[0].properties["Supplement review"], { select: { name: "Needs review" } });
  assert.deepEqual(payloads[0].properties["Supplements other"], { rich_text: [{ text: { content: a.supplements_other } }] });
  await notionCreateApplicant({ ...a, supplements_other: "Vitamin D" });
  assert(!("Supplement review" in payloads[1].properties));
});

test("application queues active Other answers but never stale hidden text; logging stays intact", async t => {
  const keys = ["NOTION_TOKEN", "NOTION_PARTICIPANTS_DB", "APPS_SCRIPT_URL", "APPS_SCRIPT_SECRET"];
  const saved = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  Object.assign(process.env, { NOTION_TOKEN: "qa", NOTION_PARTICIPANTS_DB: "qa", APPS_SCRIPT_URL: "https://qa.invalid", APPS_SCRIPT_SECRET: "qa" });
  t.after(() => { for (const k of keys) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } });
  const writes: { properties: Record<string, unknown> }[] = [], rows: { row: Record<string, string> }[] = [];
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url.endsWith("/query")) return Response.json({ results: [] });
    if (url.endsWith("/pages")) { writes.push(JSON.parse(String(init.body))); return Response.json({ id: "qa-created" }); }
    assert.equal(url, "https://qa.invalid"); rows.push(JSON.parse(String(init.body))); return Response.json({ ok: true });
  });
  for (const active of [true, false]) {
    const res = await POST(new Request("http://localhost/api/apply", { method: "POST", body: JSON.stringify({ full_name: "Alex Example", phone: "2025550199", email: "alex@example.com", fit: [], supplements: active ? ["other"] : [], supplements_other: "Taurine\nVitamin D" }) }));
    assert.equal(res.status, 200);
  }
  assert.deepEqual(writes[0].properties["Supplement suggestions"], { rich_text: [{ text: { content: "Taurine" } }] });
  assert(!("Supplement suggestions" in writes[1].properties));
  assert.equal(rows[0].row.supplements_other, "Taurine\nVitamin D");
  assert.equal(rows[1].row.supplements_other, "");
  assert.equal(rows[0].row.notion_page_id, "qa-created");
});
