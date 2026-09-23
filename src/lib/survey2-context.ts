import { PRIORITIES, type Priority, type Profile } from "./survey2-flow";
export type SurveyContext = { priorityOrder: Priority[]; profile: Profile };
export function cleanContext(input: unknown): SurveyContext | undefined {
  if (!input || typeof input !== "object") return;
  const v = input as Record<string, unknown>,
    p =
      v.profile && typeof v.profile === "object"
        ? (v.profile as Record<string, unknown>)
        : {};
  const order = Array.isArray(v.priorityOrder)
    ? v.priorityOrder.filter(
        (k): k is Priority =>
          typeof k === "string" && Object.hasOwn(PRIORITIES, k),
      )
    : [];
  const text = (key: string, max: number) =>
    typeof p[key] === "string"
      ? (p[key] as string)
          .replace(/[\r\n\t]+/g, " ")
          .trim()
          .slice(0, max)
      : "";
  return {
    priorityOrder: [
      ...new Set([...order, ...(Object.keys(PRIORITIES) as Priority[])]),
    ],
    profile: {
      age:
        Number(p.age) >= 18 &&
        Number(p.age) <= 99 &&
        Number.isInteger(Number(p.age))
          ? String(Number(p.age))
          : "",
      ageBand: text("ageBand", 20),
      goal: text("goal", 200),
      stack: text("stack", 500),
      routine: text("routine", 200),
    },
  };
}
