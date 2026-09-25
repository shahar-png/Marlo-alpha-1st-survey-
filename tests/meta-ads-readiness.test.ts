import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EMPTY } from "../src/lib/copy";
import { ATTRIBUTION_STORAGE_KEY, captureAttribution, formatAttribution } from "../src/lib/attribution";
import { metaPixelId, trackMetaLead } from "../src/lib/meta-pixel";
import { applicationQualifies, gateExit, laterGateReason, SUPPLEMENT_COUNT_OPTIONS } from "../src/lib/qualify";
import { S7Stack, SChoice, SReview } from "../src/components/screens";
import { COUNTRY_OPTIONS, DEVICE_OPTIONS } from "../src/lib/qualify";
import { POST } from "../src/app/api/apply/route";

const pass = { country: "US", device: "iPhone", supplement_count: "1–2" };

test("qualification passes US + iPhone + a positive supplement count, and fails the rest", () => {
  assert.equal(applicationQualifies(pass), true);
  assert.equal(applicationQualifies({ ...pass, supplement_count: "3–5" }), true);
  assert.equal(applicationQualifies({ ...pass, supplement_count: "6+" }), true);
  assert.equal(applicationQualifies({ ...pass, country: "Outside US" }), false);
  assert.equal(applicationQualifies({ ...pass, device: "Android" }), false);
  assert.equal(applicationQualifies({ ...pass, device: "Other" }), false);
  assert.equal(applicationQualifies({ ...pass, supplement_count: "0" }), false);
  assert.equal(applicationQualifies({ ...pass, supplement_count: "" }), false);
  assert.equal(gateExit("country", "US"), null);
  assert.equal(gateExit("country", "Outside US"), "not_us");
  assert.equal(gateExit("device", "Android"), "not_iphone");
  assert.equal(gateExit("device", "Other"), "not_iphone");
  assert.equal(gateExit("supplement_count", "0"), "no_supplements");
  assert.equal(laterGateReason("not_us"), "Does not live in the US");
  assert.equal(laterGateReason("doesnt_fit"), "Self-selected: doesn't fit this round (iPhone / US / 18+)");
  assert.deepEqual(SUPPLEMENT_COUNT_OPTIONS.map((option) => option.id), ["0", "1–2", "3–5", "6+"]);
});

test("attribution is captured on first load and kept across a later load without params", () => {
  const first = captureAttribution({
    search: "?utm_source=facebook&utm_medium=paid&utm_campaign=alpha&utm_term=iphone&utm_content=video&fbclid=IwAR123",
    referrer: "https://l.facebook.com/l.php",
    stored: null,
    origin: "https://alpha.marlo.me",
  });
  assert.equal(first.utm_source, "facebook");
  assert.equal(first.utm_medium, "paid");
  assert.equal(first.utm_campaign, "alpha");
  assert.equal(first.utm_term, "iphone");
  assert.equal(first.utm_content, "video");
  assert.equal(first.fbclid, "IwAR123");
  assert.equal(first.referrer, "https://l.facebook.com/l.php");
  assert.match(formatAttribution(first), /utm_source=facebook/);
  assert.match(formatAttribution(first), /fbclid=IwAR123/);
  assert.match(formatAttribution(first), /referrer=https:\/\/l\.facebook\.com\/l\.php/);

  const kept = captureAttribution({
    search: "",
    referrer: "https://alpha.marlo.me/",
    stored: JSON.stringify(first),
    origin: "https://alpha.marlo.me",
  });
  assert.deepEqual(kept, first);

  const replaced = captureAttribution({
    search: "?utm_campaign=new-ad&fbclid=next",
    referrer: "https://instagram.com/",
    stored: JSON.stringify(first),
    origin: "https://alpha.marlo.me",
  });
  assert.equal(replaced.utm_source, "facebook");
  assert.equal(replaced.utm_campaign, "new-ad");
  assert.equal(replaced.fbclid, "next");
  assert.equal(replaced.referrer, first.referrer);
  assert.equal(ATTRIBUTION_STORAGE_KEY, "marlo_alpha_attribution");
});

test("pixel id is digits-only and Lead is not fired without it", () => {
  assert.equal(metaPixelId(undefined), null);
  assert.equal(metaPixelId(""), null);
  assert.equal(metaPixelId("  "), null);
  assert.equal(metaPixelId("not-an-id"), null);
  assert.equal(metaPixelId("1234"), null);
  assert.equal(metaPixelId("123456789012345"), "123456789012345");
  const calls: unknown[][] = [];
  assert.equal(trackMetaLead((...args) => { calls.push(args); }), false);
  assert.equal(calls.length, 0);
  const previous = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  process.env.NEXT_PUBLIC_META_PIXEL_ID = "1234567890";
  try {
    assert.equal(trackMetaLead((...args) => { calls.push(args); }), true);
    assert.deepEqual(calls, [["track", "Lead"]]);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    else process.env.NEXT_PUBLIC_META_PIXEL_ID = previous;
  }
});

test("failed gates do not write Notion or the sheet", async (t) => {
  const keys = ["NOTION_TOKEN", "NOTION_PARTICIPANTS_DB", "APPS_SCRIPT_URL", "APPS_SCRIPT_SECRET"];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  Object.assign(process.env, { NOTION_TOKEN: "qa", NOTION_PARTICIPANTS_DB: "qa", APPS_SCRIPT_URL: "https://qa.invalid", APPS_SCRIPT_SECRET: "qa" });
  t.after(() => { for (const k of keys) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } });
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => { calls += 1; return Response.json({ ok: true }); });
  const base = { full_name: "Alex Example", phone: "2025550199", email: "alex@example.com", ...pass };
  for (const patch of [{ country: "Outside US" }, { device: "Android" }, { device: "Other" }, { supplement_count: "0" }]) {
    const res = await POST(new Request("http://localhost/api/apply", { method: "POST", body: JSON.stringify({ ...base, ...patch }) }));
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, "not_qualified");
  }
  assert.equal(calls, 0);
});

test("gate screens ask the three questions and review submits with its own button", () => {
  const noop = () => {};
  const country = renderToStaticMarkup(React.createElement(SChoice, { title: "Do you live in the US?", options: COUNTRY_OPTIONS, value: "", onSelect: noop, next: noop, back: noop, step: 1, total: 9 }));
  assert.match(country, /Do you live in the US\?/);
  assert.match(country, />Yes</);
  assert.match(country, />No</);
  assert.match(country, />Continue</);
  const device = renderToStaticMarkup(React.createElement(SChoice, { title: "What phone do you use?", options: DEVICE_OPTIONS, value: "iPhone", onSelect: noop, next: noop, back: noop, step: 2, total: 9 }));
  assert.match(device, /What phone do you use\?/);
  assert.match(device, />iPhone</);
  assert.match(device, />Android</);
  assert.match(device, />Other</);
  const count = renderToStaticMarkup(React.createElement(SChoice, { title: "How many different supplements do you take on a typical day?", options: SUPPLEMENT_COUNT_OPTIONS, value: "", onSelect: noop, next: noop, back: noop, step: 3, total: 9 }));
  assert.match(count, /How many different supplements do you take on a typical day\?/);
  for (const label of ["0", "1–2", "3–5", "6+"]) assert.ok(count.includes(`>${label}<`), label);
  const stack = renderToStaticMarkup(React.createElement(S7Stack, { a: EMPTY, set: noop, next: noop, back: noop, step: 8, total: 9 }));
  assert.match(stack, />Continue</);
  assert.doesNotMatch(stack, /Submit application/);
  const review = renderToStaticMarkup(React.createElement(SReview, {
    a: { ...EMPTY, full_name: "Alex Example", phone: "2025550199", email: "alex@example.com", country: "US", device: "iPhone", supplement_count: "6+", age_band: "35_44", sex: "female", frequency: "every_day", supplements: ["magnesium"], fit: ["longevity"] },
    set: noop, next: noop, back: noop, step: 9, total: 9, busy: false,
  }));
  assert.match(review, /Submit application/);
  assert.doesNotMatch(review, />Continue</);
  assert.match(review, /Alex Example/);
  assert.match(review, /6\+/);
  assert.match(review, /iPhone/);
  assert.match(review, />Yes</);
});
