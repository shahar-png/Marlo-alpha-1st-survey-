import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "../src/app/api/deep-dive/route";
import { GET } from "../src/app/api/participant/route";
import { EMPTY2, SHEET2_COLUMNS } from "../src/lib/survey2";

const id = "00000000-0000-0000-0000-000000000001";
const page = (done = false) => ({
  id,
  properties: {
    Name: { type: "title", title: [{ plain_text: "Alex Example" }] },
    "First name": { type: "rich_text", rich_text: [{ plain_text: "Alex" }] },
    Email: { type: "email", email: "alex@example.com" },
    "Survey 2 done": {
      type: "date",
      date: done ? { start: "2026-09-01" } : null,
    },
  },
});
const req = (body: unknown) =>
  new Request("http://localhost/api/deep-dive", {
    method: "POST",
    body: JSON.stringify(body),
  });

test("Survey 2 API contracts (all external requests mocked)", async (t) => {
  const keys = [
    "NOTION_TOKEN",
    "NOTION_PARTICIPANTS_DB",
    "APPS_SCRIPT_URL",
    "APPS_SCRIPT_SECRET",
  ];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  Object.assign(process.env, {
    NOTION_TOKEN: "qa-only",
    NOTION_PARTICIPANTS_DB: "qa-db",
    APPS_SCRIPT_URL: "https://qa.invalid/sheet",
    APPS_SCRIPT_SECRET: "qa-only",
  });
  t.after(() => {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });
  let done = false,
    missing = false,
    lookupError = false,
    writeError = false,
    sheetError = false;
  const calls: {
    url: string;
    method: string;
    body: ReturnType<typeof JSON.parse>;
  }[] = [];
  t.mock.method(console, "error", () => {});
  t.mock.method(
    globalThis,
    "fetch",
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input),
        method = init?.method || "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      calls.push({ url, method, body });
      if (url === "https://qa.invalid/sheet")
        return Response.json(
          sheetError
            ? { error: "qa-failure" }
            : { ok: true, sheetId: "qa-sheet", gid: 1, rowIndex: 2 },
          { status: sheetError ? 500 : 200 },
        );
      if (url === "https://api.notion.com/v1/databases/qa-db/query")
        return Response.json(
          lookupError ? {} : { results: missing ? [] : [page(done)] },
          { status: lookupError ? 500 : 200 },
        );
      if (url === `https://api.notion.com/v1/pages/${id}`) {
        if (method === "PATCH")
          return Response.json({}, { status: writeError ? 500 : 200 });
        return Response.json(page(done), {
          status: lookupError ? 500 : missing ? 404 : 200,
        });
      }
      throw new Error(`Unexpected request: ${method} ${url}`);
    },
  );
  const reset = () => {
    done = missing = lookupError = writeError = sheetError = false;
    calls.length = 0;
  };

  await t.test(
    "email normalization and existing personalized link lookup",
    async () => {
      reset();
      const r = await GET(
        new Request(
          "http://localhost/api/participant?email=%20ALEX%40EXAMPLE.COM%20",
        ),
      );
      assert.equal(r.status, 200);
      assert.equal((await r.json()).email, "alex@example.com");
      assert.equal(calls[0].body.filter.email.equals, "alex@example.com");
      const byId = await GET(
        new Request(`http://localhost/api/participant?p=${id}`),
      );
      assert.deepEqual(await byId.json(), {
        first_name: "Alex",
        name: "Alex Example",
        email: "alex@example.com",
        done: false,
        signed: false,
      });
    },
  );
  await t.test(
    "success retains sheet columns, sanitizes data, writes tags to the same participant",
    async () => {
      reset();
      const r = await POST(
        req({
          p: id,
          email: " ALEX@EXAMPLE.COM ",
          answers: {
            ...EMPTY2,
            confidence: 99,
            top_pain: "buying",
            spend: "100_200",
            stop_why_other: " hi\nthere ",
            unexpected: "drop-me",
          },
        }),
      );
      assert.equal(r.status, 200);
      assert.deepEqual(await r.json(), { ok: true, first_name: "Alex" });
      const sheet = calls.find(
        (c) => c.url === "https://qa.invalid/sheet",
      )!.body;
      assert.equal(sheet.tab, "Survey 2");
      assert.deepEqual(sheet.columns, SHEET2_COLUMNS);
      const raw = JSON.parse(sheet.row.raw_json);
      assert.equal(raw.confidence, 5);
      assert.equal(raw.stop_why_other, "hi there");
      assert.equal(raw.unexpected, undefined);
      assert.equal(sheet.row.notion_page_id, id);
      const patch = calls.find((c) => c.method === "PATCH")!;
      assert.equal(patch.url, `https://api.notion.com/v1/pages/${id}`);
      assert.equal(
        patch.body.properties["Baseline confidence (1–5)"].number,
        5,
      );
      assert.equal(patch.body.properties["Lead pain"].select.name, "The job");
      assert.ok(patch.body.properties["Survey 2 done"].date.start);
      assert.match(
        patch.body.properties["Survey 2 raw"].url,
        /qa-sheet.*range=A2/,
      );
    },
  );
  await t.test(
    "personalized link supports participant-ID-only submission",
    async () => {
      reset();
      const r = await POST(req({ p: id, answers: EMPTY2 }));
      assert.equal(r.status, 200);
      assert.equal(calls[0].method, "GET");
    },
  );
  await t.test("not found and already completed never write", async () => {
    for (const completed of [false, true]) {
      reset();
      done = completed;
      missing = !completed;
      assert.equal(
        (await POST(req({ email: "alex@example.com", p: id }))).status,
        completed ? 409 : 404,
      );
      assert.ok(
        calls.every(
          (c) => c.method !== "PATCH" && c.url !== "https://qa.invalid/sheet",
        ),
      );
    }
  });
  await t.test(
    "malformed JSON and missing database return useful errors",
    async () => {
      reset();
      assert.equal(
        (
          await POST(
            new Request("http://localhost", { method: "POST", body: "{" }),
          )
        ).status,
        400,
      );
      delete process.env.NOTION_TOKEN;
      assert.equal((await POST(req({}))).status, 500);
      assert.equal(
        (await GET(new Request("http://localhost/api/participant"))).status,
        500,
      );
      process.env.NOTION_TOKEN = "qa-only";
      assert.equal(calls.length, 0);
    },
  );
  await t.test("lookup and database failures cannot show success", async () => {
    reset();
    lookupError = true;
    assert.deepEqual(
      await (await POST(req({ email: "alex@example.com" }))).json(),
      { error: "lookup_failed" },
    );
    assert.equal(
      (await GET(new Request(`http://localhost/api/participant?p=${id}`)))
        .status,
      500,
    );
    reset();
    writeError = true;
    const r = await POST(req({ p: id }));
    assert.equal(r.status, 500);
    assert.deepEqual(await r.json(), { error: "db_failed" });
  });
  await t.test(
    "backup sheet failure preserves existing primary Notion write behavior",
    async () => {
      reset();
      sheetError = true;
      assert.equal((await POST(req({ p: id }))).status, 200);
      assert.ok(calls.some((c) => c.method === "PATCH"));
    },
  );
});
