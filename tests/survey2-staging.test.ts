import test from "node:test";
import assert from "node:assert/strict";
import { ALL_Q, EMPTY2, PAINS, TOP_PAINS, SHEET2_COLUMNS } from "../src/lib/survey2";
import { buildFlow, cleanAnswers, restoreAnswers, isComplete } from "../src/lib/survey2-flow";

test("frustration order survives restore, deduplicates and prunes changed pain ratings", () => {
  const a = structuredClone(EMPTY2);
  a.pains = Object.fromEntries(PAINS.map(p => [p.id, "1"]));
  a.pain_priority = ["trust", "trust", "choosing", "bad", "buying"];
  const b = restoreAnswers(a);
  assert.deepEqual(b.pain_priority, ["trust", "choosing", "buying", ...TOP_PAINS.map(p => p.id).filter(id => !["trust", "choosing", "buying"].includes(id))]);
  assert.equal(b.top_pain, "trust");
  b.pains.trust = "0";
  const c = cleanAnswers(b);
  assert.equal(c.top_pain, "choosing");
  assert(!c.pain_priority.includes("trust"));
  c.pains = {cost: "2"};
  assert(buildFlow(cleanAnswers(c)).some(x => x.id === "top_pain"));
  assert.deepEqual(cleanAnswers(c).pain_priority, ["cost"]);
});
test("removed questions no longer block completion; legacy sheet columns stay fixed", () => {
  assert.equal(ALL_Q.length, 35);
  assert.equal(SHEET2_COLUMNS.length, 58);
  for (const legacy of ["stopped", "stop_why", "stop_why_other", "allow"]) assert(SHEET2_COLUMNS.includes(legacy));
  const a = structuredClone(EMPTY2);
  ALL_Q.forEach(q => Object.assign(a, {[q.id]: q.kind === "scale" ? 3 : q.kind === "multi" ? [q.options[0].id] : q.options[0].id}));
  a.pains = Object.fromEntries(PAINS.map(p => [p.id, "1"]));
  assert(isComplete(cleanAnswers(a)));
});

test("every original frustration can be ranked independently", () => {
  assert.equal(TOP_PAINS.length, 12);
  assert.deepEqual(TOP_PAINS.map(p=>p.id).sort(), PAINS.map(p=>p.id).sort());
  for (const pain of PAINS) {
    const a = cleanAnswers({...structuredClone(EMPTY2), pains: {[pain.id]: "2"}});
    assert.deepEqual(a.pain_priority, [pain.id]);
    assert(buildFlow(a).some(p=>p.id === "top_pain"));
  }
});
