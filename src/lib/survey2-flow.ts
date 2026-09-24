import { ALL_Q, EMPTY2, PAINS, TOP_PAINS, PARTS, type Answers2, type Q } from "./survey2";
export const PRIORITIES = {
  clarity: "Know what’s actually working",
  effort: "Make my routine easier",
  spending: "Feel better about what I spend",
  routine: "Build a routine that fits my life",
};
export type Priority = keyof typeof PRIORITIES;
export type Profile = {
  age: string;
  ageBand: string;
  goal: string;
  stack: string;
  routine: string;
};
export const EMPTY_PROFILE: Profile = {
  age: "",
  ageBand: "",
  goal: "",
  stack: "",
  routine: "",
};
export const CHAPTER_NAMES = [
  "Your history",
  "How it started",
  "Your data",
  "How you decide",
  "The friction",
  "Zooming in",
  "Handing it over",
  "What you’ve tried",
  "Your money",
  "Your baseline",
];
export type FlowItem = {
  id: string;
  chapter?: number;
  type?: "question" | "pain" | "top" | "insight";
  q?: Q;
  group?: number;
};
export function cleanAnswers(input: Answers2): Answers2 {
  const a = structuredClone(input);
  if (a.wearable.includes("no")) a.wearable = ["no"];
  if (a.stopped === "never") {
    a.stop_why = [];
    a.stop_why_other = "";
  }
  if (a.list_given === "no") {
    a.list_done = "";
    a.list_stuck = [];
  } else if (a.list_done === "right_away") a.list_stuck = [];
  if (a.testing === "no") a.testing_protocol = "";
  if (!a.tools.length || a.tools.includes("none")) {
    a.tools_still = [];
    a.tools_dropped_why = [];
  } else {
    a.tools_still = a.tools_still.filter(
      (x) => x === "none" || a.tools.includes(x),
    );
    if (a.tools.every((x) => a.tools_still.includes(x)))
      a.tools_dropped_why = [];
  }
  const eligible = TOP_PAINS.filter(p => ["1", "2"].includes(a.pains[p.id])).map(p => p.id);
  const previous = Array.isArray(a.pain_priority) ? a.pain_priority : [];
  a.pain_priority = [...new Set(previous.filter(id => eligible.includes(id))),
    ...eligible.filter(id => !previous.includes(id)).sort((x,y) => Number(a.pains[y])-Number(a.pains[x]))];
  a.top_pain = a.pain_priority[0] || "";
  return a;
}
export function buildFlow(a: Answers2): FlowItem[] {
  const f: FlowItem[] = [
    { id: "intro" },
    { id: "profile" },
    { id: "priority" },
    { id: "insight", type: "insight" },
  ];
  PARTS.forEach((part, chapter) => {
    if (part.key === "pains")
      for (let group = 0; group < 4; group++)
        f.push({ id: "pain-" + group, type: "pain", group, chapter });
    if (
      part.key === "pains2" &&
      TOP_PAINS.some((p) => a.pains[p.id] && a.pains[p.id] !== "0")
    )
      f.push({ id: "top_pain", type: "top", chapter });
    part.questions
      .filter((q) => !("showIf" in q) || !q.showIf || q.showIf(a))
      .forEach((q) => f.push({ id: q.id, type: "question", q, chapter }));
    if (
      ["history", "data", "decide", "pains2", "handover", "money"].includes(
        part.key,
      ) &&
      (part.key !== "data" || (a.wearable.length && !a.wearable.includes("no")))
    )
      f.push({ id: "insight-" + part.key, type: "insight", chapter });
  });
  return [...f, { id: "review" }];
}
export function optionsFor(q: Exclude<Q, { kind: "scale" }>, a: Answers2) {
  return q.id === "tools_still"
    ? q.options.filter((o) => o.id === "none" || a.tools.includes(o.id))
    : q.options;
}
export function validQuestion(q: Q, a: Answers2) {
  const v = a[q.id as keyof Answers2];
  if ("optional" in q && q.optional) return true;
  if (q.kind === "scale")
    return (
      typeof v === "number" && Number.isInteger(v) && v >= q.min && v <= q.max
    );
  const options = optionsFor(q, a);
  return q.kind === "multi"
    ? Array.isArray(v) &&
        v.length > 0 &&
        v.every((x) => options.some((o) => o.id === x))
    : options.some((o) => o.id === v);
}
export function validItem(item: FlowItem, a: Answers2) {
  if (item.q) return validQuestion(item.q, a);
  if (item.type === "pain")
    return PAINS.slice(item.group! * 3, item.group! * 3 + 3).every((p) =>
      ["0", "1", "2"].includes(a.pains[p.id]),
    );
  if (item.type === "top")
    return TOP_PAINS.some(
      (p) => p.id === a.top_pain && ["1", "2"].includes(a.pains[p.id]),
    );
  return true;
}
export function isComplete(a: Answers2) {
  return buildFlow(a).every((x) => validItem(x, a));
}
export function restoreAnswers(input: unknown): Answers2 {
  const a = structuredClone(EMPTY2);
  if (!input || typeof input !== "object") return a;
  const v = input as Record<string, unknown>;
  for (const q of ALL_Q) {
    const x = v[q.id];
    if (q.kind === "multi" && Array.isArray(x))
      Object.assign(a, {
        [q.id]: x.filter(
          (k) => typeof k === "string" && q.options.some((o) => o.id === k),
        ),
      });
    else if (q.kind === "single" && q.options.some((o) => o.id === x))
      Object.assign(a, { [q.id]: x });
    else if (
      q.kind === "scale" &&
      Number.isInteger(x) &&
      Number(x) >= q.min &&
      Number(x) <= q.max
    )
      Object.assign(a, { [q.id]: x });
  }
  if (v.pains && typeof v.pains === "object")
    for (const p of PAINS) {
      const x = (v.pains as Record<string, unknown>)[p.id];
      if (typeof x === "string" && ["0", "1", "2"].includes(x))
        a.pains[p.id] = x;
    }
  if (Array.isArray(v.pain_priority)) a.pain_priority = v.pain_priority.filter((id): id is string => typeof id === "string" && TOP_PAINS.some(p => p.id === id));
  if (typeof v.top_pain === "string") a.top_pain = v.top_pain;
  if (typeof v.stop_why_other === "string")
    a.stop_why_other = v.stop_why_other.slice(0, 500);
  return cleanAnswers(a);
}
// Never invent an exact age from a survey band crossing a benchmark boundary.
export function ageBenchmark(profile: Profile) {
  const exact = Number(profile.age);
  const band = profile.ageBand.replace(/–/g, "_").replace(/-/g, "_");
  const group =
    exact >= 18 && exact <= 99
      ? exact < 30
        ? 0
        : exact < 50
          ? 1
          : exact < 65
            ? 2
            : 3
      : ["18_24"].includes(band)
        ? 0
        : ["35_44"].includes(band)
          ? 1
          : ["55_64"].includes(band)
            ? 2
            : ["65+", "65_plus"].includes(band)
              ? 3
              : -1;
  return group < 0
    ? {
        label: "U.S. adults",
        population: "U.S. adults",
        supplements: 78,
        watch: 37,
        ai: 34,
      }
    : {
        label: "Ages " + ["18–29", "30–49", "50–64", "65+"][group],
        population:
          "U.S. adults ages " + ["18–29", "30–49", "50–64", "65+"][group],
        supplements: [67, 76, 81, 85][group],
        watch: [44, 44, 35, 24][group],
        ai: [44, 40, 32, 17][group],
      };
}
export const WEARABLES = {
  apple_watch: {
    name: "Apple Watch",
    headline: "YOUR WATCH.\nYOUR ROUTINE.",
    alt: "Runner adjusting an Apple Watch with a black sport band",
    body: "You wear an Apple Watch. Let’s look at how you use what it tells you.",
    smartwatch: true,
  },
  oura: {
    name: "Oura",
    headline: "SMALL RING.\nYOUR ROUTINE.",
    alt: "Person in cream activewear wearing a silver Oura ring",
    body: "You wear Oura. What do you check—and what do you do with it?",
    smartwatch: false,
  },
  whoop: {
    name: "WHOOP",
    headline: "YOUR BAND.\nYOUR ROUTINE.",
    alt: "Athlete wearing a screenless WHOOP band",
    body: "You wear WHOOP. Let’s explore how it fits into your day.",
    smartwatch: false,
  },
  garmin: {
    name: "Garmin",
    headline: "YOUR WATCH.\nYOUR ROUTINE.",
    alt: "Seated hiker resting their forearm on their thigh, wearing a round Garmin watch",
    body: "You wear Garmin. Which numbers do you find useful?",
    smartwatch: true,
  },
  other: {
    name: "Your tracker",
    headline: "YOUR TRACKER.\nYOUR ROUTINE.",
    alt: "Illustrative slim fitness band worn with a cream overshirt",
    body: "You use another tracker. Let’s find out how it helps you.",
    smartwatch: false,
  },
};
export type Wearable = keyof typeof WEARABLES;
export function selectedWearables(a: Answers2): Wearable[] {
  return a.wearable.includes("no")
    ? []
    : a.wearable.filter((k): k is Wearable => k in WEARABLES);
}
