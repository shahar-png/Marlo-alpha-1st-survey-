import test from "node:test";
import assert from "node:assert/strict";

test("staging identifies only fiction and never calls external services, even with credentials present", async t => {
  process.env.NEXT_PUBLIC_MARLO_STAGING = "1";
  process.env.NOTION_TOKEN = "must-not-be-used";
  process.env.NOTION_PARTICIPANTS_DB = "must-not-be-used";
  const external = t.mock.method(globalThis, "fetch", async () => { throw new Error("Staging attempted external access"); });
  const { GET } = await import("../src/app/api/participant/route");
  const { POST } = await import("../src/app/api/deep-dive/route");
  const { EMPTY2, ALL_Q, PAINS } = await import("../src/lib/survey2");
  const { cleanAnswers } = await import("../src/lib/survey2-flow");
  const lookup = () => GET(new Request("http://localhost/api/participant?email=qa@example.com&p=real-id&include=profile"));
  const who = await lookup();
  assert.equal(who.headers.get("cache-control"), "no-store");
  assert.equal((await who.json()).profile.age, "38");
  const submit = (answers: unknown) => POST(new Request("http://localhost/api/deep-dive", {method:"POST",body:JSON.stringify({email:"qa@example.com",answers})}));
  assert.equal((await submit({})).status, 400);
  const a = structuredClone(EMPTY2);
  ALL_Q.forEach(q => Object.assign(a, {[q.id]: q.kind === "scale" ? 3 : q.kind === "multi" ? [q.options[0].id] : q.options[0].id}));
  a.pains = Object.fromEntries(PAINS.map(p => [p.id,"1"]));
  for (let i=0; i<2; i++) assert.equal((await submit(cleanAnswers(a))).status, 200);
  assert.equal((await (await lookup()).json()).done, false);
  for (const name of ["apply", "later", "waiver"]) {
    const route = await import(`../src/app/api/${name}/route`);
    assert.equal((await route.POST(new Request(`http://localhost/api/${name}`, {method:"POST",body:"{}"}))).status, 403);
  }
  assert.equal(external.mock.callCount(), 0);
});
