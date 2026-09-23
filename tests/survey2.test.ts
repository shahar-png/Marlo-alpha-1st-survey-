import test from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY2,
  PARTS,
  PAINS,
  partComplete,
  flatten,
  tagsFrom,
} from "../src/lib/survey2";
const fresh = () => structuredClone(EMPTY2);
const part = (key: string) => PARTS.find((p) => p.key === key)!;

test("all ten sections require their visible answers", () => {
  for (const p of PARTS) assert.equal(partComplete(p, fresh()), false, p.key);
  const a = fresh();
  a.years = "2_5y";
  a.count_now = "4_6";
  a.count_peak = "same";
  a.stopped = "never";
  assert.equal(partComplete(part("history"), a), true);
  a.stopped = "restarted";
  assert.equal(partComplete(part("history"), a), false);
  a.stop_why = ["life"];
  assert.equal(partComplete(part("history"), a), true);
});
test("changing list authority to No hides downstream follow-ups", () => {
  const a = fresh();
  a.list_given = "no";
  a.list_done = "part";
  const q = part("started").questions.find((q) => q.id === "list_stuck")!;
  assert.equal("showIf" in q && q.showIf?.(a), false);
});
test("pain ratings require all lines and a currently eligible top pain", () => {
  const a = fresh();
  a.sure = "most";
  a.proof = "blood";
  for (const p of PAINS) a.pains[p.id] = "0";
  assert.equal(partComplete(part("pains"), a), true);
  assert.equal(partComplete(part("pains2"), a), true);
  a.pains.buying = "2";
  assert.equal(partComplete(part("pains2"), a), false);
  a.top_pain = "buying";
  assert.equal(partComplete(part("pains2"), a), true);
  a.pains.buying = "0";
  a.pains.cost = "1";
  assert.equal(partComplete(part("pains2"), a), false);
});
test("optional dropped-tools question does not block completion", () => {
  const a = fresh();
  a.tools = ["organizer"];
  a.tools_still = ["none"];
  a.tech = "comfortable";
  assert.equal(partComplete(part("tried"), a), true);
});
test("baseline scale and original tag/export contract stay intact", () => {
  const a = fresh();
  a.confidence = 4;
  a.hours = "1_2";
  a.feel = "fine";
  a.top_pain = "buying";
  a.spend = "100_200";
  assert.equal(partComplete(part("baseline"), a), true);
  assert.equal(tagsFrom(a)["Baseline confidence (1–5)"], 4);
  assert.equal(tagsFrom(a)["Lead pain"], "The job");
  assert.equal(flatten(a).spend, "$100–200");
});
