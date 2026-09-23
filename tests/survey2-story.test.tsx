import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EMPTY2, ALL_Q, PAINS } from "../src/lib/survey2";
import {
  ageBenchmark,
  buildFlow,
  cleanAnswers,
  EMPTY_PROFILE,
  isComplete,
  restoreAnswers,
  selectedWearables,
  validItem,
  WEARABLES,
  type Wearable,
} from "../src/lib/survey2-flow";
import { cleanContext } from "../src/lib/survey2-context";
import Insight from "../src/components/survey-two-insights";
test("complete expanded quiz covers every original question and finishes only with valid answers", () => {
  const a = structuredClone(EMPTY2);
  a.list_given = "doctor";
  a.list_done = "part";
  a.stopped = "restarted";
  a.testing = "yes";
  a.tools = ["organizer"];
  a.tools_still = ["none"];
  a.wearable = ["garmin"];
  a.pains = Object.fromEntries(PAINS.map((p) => [p.id, "1"]));
  a.top_pain = "working";
  const flow = buildFlow(a);
  assert(ALL_Q.every((q) => flow.some((x) => x.id === q.id)));
  assert.equal(flow.length, 54);
  assert.equal(isComplete(a), false);
  for (let pass = 0; pass < 3; pass++)
    for (const item of buildFlow(a)) {
      const q = item.q;
      if (q && !validItem(item, a)) {
        Object.assign(a, {
          [q.id]:
            q.kind === "scale"
              ? q.max
              : q.kind === "multi"
                ? [q.options[0].id]
                : q.options[0].id,
        });
      }
    }
  assert(isComplete(a));
  a.confidence = 99;
  assert(!isComplete(a));
});
test("dependent answers are cleaned; malformed stored answers cannot unlock completion", () => {
  const a = structuredClone(EMPTY2);
  a.list_given = "no";
  a.list_done = "part";
  a.list_stuck = ["cost"];
  a.testing = "no";
  a.testing_protocol = "yes";
  a.tools = ["none"];
  a.tools_still = ["ai"];
  a.top_pain = "working";
  a.pains.working = "0";
  const b = cleanAnswers(a);
  assert.equal(b.list_done, "");
  assert.deepEqual(b.list_stuck, []);
  assert.equal(b.testing_protocol, "");
  assert.deepEqual(b.tools_still, []);
  assert.equal(b.top_pain, "");
  assert.deepEqual(
    restoreAnswers({
      wearable: ["nonsense"],
      confidence: 99,
      pains: { cost: "broken" },
    }),
    EMPTY2,
  );
});
test("each device gets its own actual image; only smartwatches get smartwatch statistics", () => {
  const a = structuredClone(EMPTY2);
  for (const key of Object.keys(WEARABLES) as Wearable[]) {
    a.wearable = [key];
    const html = renderToStaticMarkup(
      <Insight
        id="insight-data"
        a={a}
        profile={{ ...EMPTY_PROFILE, age: "38" }}
        priority="clarity"
        wearableView={key}
        setWearableView={() => {}}
        next={() => {}}
        adjust={() => {}}
      />,
    );
    assert(html.includes(key + ".jpg"));
    assert.equal(html.includes("own a smartwatch"), WEARABLES[key].smartwatch);
    assert(buildFlow(a).some((x) => x.id === "insight-data"));
  }
  for (const value of [[], ["no"], ["no", "apple_watch"]]) {
    a.wearable = value;
    assert.deepEqual(selectedWearables(a), []);
    assert(!buildFlow(a).some((x) => x.id === "insight-data"));
  }
  a.wearable = ["oura", "whoop"];
  assert.deepEqual(selectedWearables(a), ["oura", "whoop"]);
});
test("unknown and cross-boundary ages use national data, never fictional age 38", () => {
  assert.equal(ageBenchmark(EMPTY_PROFILE).watch, 37);
  assert.equal(
    ageBenchmark({ ...EMPTY_PROFILE, ageBand: "25–34" }).supplements,
    78,
  );
  assert.equal(
    ageBenchmark({ ...EMPTY_PROFILE, ageBand: "35–44" }).supplements,
    76,
  );
  assert.equal(ageBenchmark({ ...EMPTY_PROFILE, age: "70" }).watch, 24);
});
test("context retains complete unique ranking and bounded profile values", () => {
  const context = cleanContext({
    priorityOrder: ["routine", "routine", "unknown"],
    profile: { age: "120", stack: "x".repeat(700) },
  })!;
  assert.deepEqual(context.priorityOrder, [
    "routine",
    "clarity",
    "effort",
    "spending",
  ]);
  assert.equal(context.profile.age, "");
  assert.equal(context.profile.stack.length, 500);
});
