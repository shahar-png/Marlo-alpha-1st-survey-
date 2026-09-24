// Survey 2 · "Let's get to know you better" — content v1 (03_Deep dive/survey-2-screens-v1.md), 15 Sep 2026.
// Company voice. Linked from Email 2 with ?p=<Participants page id>. Writes tags to the same Notion page.

export type Opt = { id: string; label: string };
export type Q =
  | { id: string; kind: "single"; text: string; note?: string; options: Opt[]; rows?: boolean; showIf?: (a: Answers2) => boolean; optional?: boolean }
  | { id: string; kind: "multi"; text: string; note?: string; options: Opt[]; rows?: boolean; showIf?: (a: Answers2) => boolean; optional?: boolean; other?: string }
  | { id: string; kind: "scale"; text: string; note?: string; min: number; max: number; low: string; high: string };

const o = (pairs: [string, string][]): Opt[] => pairs.map(([id, label]) => ({ id, label }));

/* ---------- Part 2 · Your history ---------- */
const P2: Q[] = [
    { id: "years", kind: "single", text: "How long have you taken supplements regularly?", options: o([["lt6m", "Less than 6 months"], ["6m_2y", "6 months to 2 years"], ["2_5y", "2–5 years"], ["gt5y", "More than 5 years"]]) },
    { id: "count_now", kind: "single", text: "How many supplements do you take each day?", options: o([["0", "None"], ["1_3", "1–3"], ["4_6", "4–6"], ["7_10", "7–10"], ["10p", "More than 10"]]) },
    { id: "count_peak", kind: "single", text: "What’s the most you’ve taken in a day?", options: o([["same", "Same as now"], ["1_3", "1–3"], ["4_6", "4–6"], ["7_10", "7–10"], ["10p", "More than 10"]]) },
];

/* ---------- Part 3 · How it started ---------- */
const P3: Q[] = [
    { id: "origin", kind: "single", rows: true, text: "What first put supplements on your radar?", options: o([["self", "I got into it myself — training, research, curiosity"], ["doctor", "A doctor or practitioner told me to take specific things"], ["coach", "A trainer or coach gave me a protocol"], ["event", "Something changed — a diagnosis, a new prescription, pregnancy, a scare, a milestone birthday"], ["friend", "A friend or family member"], ["media", "A podcast, creator, or book"]]) },
    { id: "list_given", kind: "single", rows: true, text: "Has anyone recommended a supplement list in the past year?", options: o([["doctor", "A doctor"], ["practitioner", "A trainer, dietitian, or naturopath"], ["creator", "A podcast or creator"], ["no", "No"]]) },
    { id: "list_done", kind: "single", text: "What happened with that list?", showIf: (a) => !!a.list_given && a.list_given !== "no", options: o([["right_away", "Filled it right away"], ["part", "Filled part of it"], ["not_started", "Still haven’t started"], ["eventually", "Took a while, but done"]]) },
    { id: "list_stuck", kind: "multi", rows: true, text: "What slowed you down?", showIf: (a) => !!a.list_given && a.list_given !== "no" && !!a.list_done && a.list_done !== "right_away", options: o([["brands", "Too many brands to choose from"], ["dose", "Not sure about the dose or form"], ["price", "Price"], ["meds", "Worried about mixing it with medication"], ["didnt", "Just didn’t get to it"]]) },
];

/* ---------- Part 4 · Your data ---------- */
const P4: Q[] = [
    { id: "testing", kind: "single", note: "For example, Function or a longevity clinic.", text: "Do you pay for a testing or longevity service?", options: o([["yes", "Yes, currently"], ["past", "I have in the past"], ["no", "No"]]) },
    { id: "testing_protocol", kind: "single", rows: true, text: "Did they give you a supplement protocol, and how closely do you follow it?", showIf: (a) => a.testing === "yes" || a.testing === "past", options: o([["most", "Yes, I follow most of it"], ["some", "Yes, I follow some of it"], ["mostly_not", "Yes, but I mostly don’t"], ["none", "No protocol"]]) },
    { id: "bloodwork", kind: "single", rows: true, text: "How often do you get blood work done?", options: o([["2y", "Twice a year or more"], ["1y", "About once a year"], ["doctor", "Only when a doctor orders it"], ["rarely", "Rarely or never"]]) },
    { id: "wearable", kind: "multi", text: "Do you wear a health tracker?", options: o([["apple_watch", "Apple Watch"], ["oura", "Oura"], ["whoop", "Whoop"], ["garmin", "Garmin"], ["other", "Something else"], ["no", "No"]]) },
    { id: "doctor_involved", kind: "single", text: "Is a doctor or practitioner involved in your supplement decisions?", options: o([["closely", "Yes, closely"], ["occasionally", "Occasionally"], ["no", "Not at all"]]) },
];

/* ---------- Part 5 · How you decide ---------- */
const P5: Q[] = [
    { id: "decide", kind: "single", rows: true, text: "How do you decide to try a new supplement?", options: o([["research", "I research it myself — studies, Reddit, long reviews — until I’m sure"], ["authority", "I go with what a doctor, trainer, or practitioner says"], ["media", "I follow a podcast, creator, or book I trust"], ["friends", "I ask friends or people I train with"], ["feel", "I try it and see how I feel"], ["unsure", "Honestly, I’m not sure how I decide"]]) },
    { id: "ai", kind: "single", text: "Have you asked ChatGPT or another AI about your supplements?", options: o([["regularly", "Yes, regularly"], ["once", "Once or twice"], ["never", "Never"]]) },
    { id: "sources", kind: "multi", text: "Where do you get your supplement information?", options: o([["podcasts", "Health or fitness podcasts"], ["youtube", "YouTube"], ["reddit", "Reddit or forums"], ["social", "Instagram or TikTok"], ["doctor", "A doctor or practitioner"], ["friends", "Friends"], ["amazon", "Amazon reviews"], ["studies", "Studies and research papers"]]) },
    { id: "whose_interest", kind: "single", text: "When a brand or store recommends a supplement, whose interest do you assume they’re serving?", options: o([["mine", "Mine"], ["theirs", "Theirs"], ["depends", "Depends on the brand"]]) },
];

/* ---------- Part 6 · What bothers you most ---------- */
export const PAINS: Opt[] = o([
  ["buying", "Buying and reordering — running out, or ordering from too many places"],
  ["remembering", "Remembering to take them every day"],
  ["sorting", "Sorting and organizing — the bottles, the tray, the weekly refill"],
  ["tracking", "Keeping track of what I have — what’s running low, what I’ve doubled up on"],
  ["working", "Not knowing whether any of it is actually working"],
  ["choosing", "Choosing — too many brands, doses, and forms"],
  ["trust", "Trusting the advice — everyone recommending something is selling something"],
  ["cost", "What it costs every month"],
  ["interactions", "Interactions — not knowing what’s safe with my medication"],
  ["gap", "The gap between tests — I get results and a protocol, then I’m on my own"],
  ["pills", "The pills themselves — size, count, taste"],
  ["travel", "Travel — packing it, keeping the routine going"],
]);
export const TOP_PAINS = o([
 ["buying", "Buying and reordering"], ["remembering", "Remembering to take them"],
 ["sorting", "Sorting and organizing"], ["tracking", "Managing my inventory"],
 ["working", "Knowing what works"], ["choosing", "Choosing brands and doses"],
 ["trust", "Trusting advice"], ["cost", "Monthly cost"],
 ["interactions", "Mixing with medication"], ["gap", "Support between tests"],
 ["pills", "Pill size, count and taste"], ["travel", "Keeping up while traveling"]
]);
export const PAIN_LEVELS: Opt[] = o([["0", "Not an issue"], ["1", "Annoying"], ["2", "A real problem"]]);

const P6B: Q[] = [
    { id: "sure", kind: "single", rows: true, text: "How sure are you that your supplements help?", options: o([["all", "Sure about all of them"], ["most", "Sure about most"], ["half", "Sure about half"], ["few", "Not sure about most"], ["faith", "I take them on faith"]]) },
    { id: "proof", kind: "single", rows: true, text: "Have you ever tried to figure out whether something you take is working?", options: o([["blood", "Yes — with blood work"], ["wearable", "Yes — with a wearable or tracking"], ["feel", "Yes — by paying attention to how I feel"], ["no", "No"]]) },
];

/* ---------- Part 7 · Handing it over ---------- */
const P7: Q[] = [
    { id: "never", kind: "single", text: "Which decision would you never hand off?", options: o([["brand", "Which brand"], ["what", "What I take"], ["dose", "The dose"], ["spend", "How much I spend"], ["nothing", "Nothing — I’d hand it all off"]]) },
    { id: "handover", kind: "single", rows: true, text: "How do you feel about handing this over?", options: o([["cant_wait", "Can’t wait — take the whole job"], ["keep_calls", "Happy to, as long as I keep the calls that matter"], ["cautious", "Cautious — I’d need to see it work first"], ["myself", "I like running it myself"]]) },
    { id: "quit", kind: "single", rows: true, text: "What would make you stop using a service like Marlo?", options: o([["wrong_order", "A wrong order"], ["generic", "Generic reminders that don’t know me"], ["selling", "Feeling like it’s trying to sell me something"], ["questions", "It asks too many questions"], ["another_app", "It feels like another app to manage"], ["no_answer", "Three months in and still no answer to “is it working?”"]]) },
];

/* ---------- Part 8 · What you've tried ---------- */
const TOOLS = o([["organizer", "A pill organizer or weekly tray"], ["reminder_app", "A reminder or habit app"], ["tracking_app", "A supplement tracking app"], ["subscriptions", "Subscriptions or auto-ship"], ["notes", "A notes app or spreadsheet"], ["ai", "ChatGPT or another AI"], ["packs", "A pre-packed daily pack service"], ["none", "None of these"]]);
const TOOLS_SHORT = o([["organizer", "Organizer"], ["reminder_app", "Reminder app"], ["tracking_app", "Tracking app"], ["subscriptions", "Subscriptions"], ["notes", "Notes or spreadsheet"], ["ai", "AI"], ["packs", "Daily packs"], ["none", "None"]]);
const P8: Q[] = [
    { id: "tools", kind: "multi", rows: true, text: "Have you used any of these to make your routine easier?", options: TOOLS },
    { id: "tools_still", kind: "multi", text: "Which of them are you still using?", showIf: (a) => a.tools.length > 0 && !a.tools.includes("none"), options: TOOLS_SHORT },
    { id: "tools_dropped_why", kind: "multi", rows: true, text: "For the ones you dropped — why?", optional: true, showIf: (a) => a.tools.length > 0 && !a.tools.includes("none") && a.tools.some((t) => !a.tools_still.includes(t)), options: o([["steps", "Added steps instead of removing them"], ["forgot", "Forgot about it"], ["routine", "Didn’t fit my routine"], ["useless", "Didn’t tell me anything useful"], ["cost", "Cost"]]) },
    { id: "tech", kind: "single", rows: true, text: "How comfortable are you with new tech?", options: o([["first", "I’m usually first — I try everything"], ["comfortable", "Comfortable — I’ll use it if it’s good"], ["simple", "I’d rather keep things simple"]]) },
];

/* ---------- Part 9 · Money ---------- */
const P9: Q[] = [
    { id: "spend", kind: "single", text: "Roughly what do you spend on supplements a month?", options: o([["lt50", "Under $50"], ["50_100", "$50–100"], ["100_200", "$100–200"], ["200_350", "$200–350"], ["gt350", "Over $350"]]) },
    { id: "spend_feel", kind: "single", text: "How do you feel about that number?", options: o([["worth", "Worth it"], ["more", "More than I’d like"], ["no_idea", "Honestly, no idea if it’s worth it"]]) },
    { id: "where", kind: "multi", text: "Where do you usually buy?", options: o([["amazon", "Amazon"], ["brand", "Brand websites"], ["store", "A store (pharmacy, Whole Foods, GNC…)"], ["clinic", "Through a doctor, clinic, or testing service"], ["else", "Somewhere else"]]) },
    { id: "sellers", kind: "single", text: "How many different places did you buy from in the last three months?", options: o([["1", "One"], ["2_3", "Two or three"], ["4p", "Four or more"]]) },
    { id: "subs", kind: "single", text: "Any subscriptions or auto-ship?", options: o([["most", "Most of it"], ["some", "Some"], ["none", "None"]]) },
    { id: "loyalty", kind: "single", rows: true, text: "Brands — loyal or switcher?", options: o([["loyal", "I stick with my brands"], ["switch", "I’ll switch for better quality or price"], ["ignore", "I don’t pay attention to brand"]]) },
    { id: "waste", kind: "single", text: "Is there anything in your cabinet you bought and stopped taking?", options: o([["few", "Yes, a few things"], ["one_two", "One or two"], ["no", "No"]]) },
];

/* ---------- Part 10 · Baseline ---------- */
const P10: Q[] = [
    { id: "confidence", kind: "scale", text: "How confident are you that your current stack is the right one for you?", min: 1, max: 5, low: "Not at all", high: "Completely" },
    { id: "hours", kind: "single", note: "Include researching, buying, sorting, and remembering.", text: "How much time do you spend managing supplements each month?", options: o([["lt1", "Under an hour"], ["1_2", "1–2 hours"], ["3_5", "3–5 hours"], ["5p", "More than 5 hours"]]) },
    { id: "feel", kind: "single", text: "How would you describe running your supplements right now?", options: o([["easy", "Easy, it just happens"], ["fine", "Fine, a bit of work"], ["chore", "A chore"], ["second_job", "A second job"]]) },
];

export type Part = { key: string; title: string; lead?: string; questions: Q[] };
export const PARTS: Part[] = [
  { key: "history", title: "Your history with supplements.", questions: P2 },
  { key: "started", title: "How it started.", questions: P3 },
  { key: "data", title: "Your data.", questions: P4 },
  { key: "decide", title: "How you decide.", questions: P5 },
  { key: "pains", title: "What bothers you most.", lead: "One tap per line.", questions: [] }, // custom screen
  { key: "pains2", title: "Zooming in.", questions: P6B }, // custom: top pick + P6B
  { key: "handover", title: "Handing it over.", questions: P7 },
  { key: "tried", title: "What you’ve tried.", questions: P8 },
  { key: "money", title: "Money.", questions: P9 },
  { key: "baseline", title: "Where you are today.", lead: "Three quick reads. We’ll ask the same three at the end of the program.", questions: P10 },
];

export type Answers2 = {
  years: string; count_now: string; count_peak: string; stopped: string; stop_why: string[]; stop_why_other: string;
  origin: string; list_given: string; list_done: string; list_stuck: string[];
  testing: string; testing_protocol: string; bloodwork: string; wearable: string[]; doctor_involved: string;
  decide: string; ai: string; sources: string[]; whose_interest: string;
  pains: Record<string, string>; top_pain: string; pain_priority: string[]; sure: string; proof: string;
  allow: string[]; never: string; handover: string; quit: string;
  tools: string[]; tools_still: string[]; tools_dropped_why: string[]; tech: string;
  spend: string; spend_feel: string; where: string[]; sellers: string; subs: string; loyalty: string; waste: string;
  confidence: number; hours: string; feel: string;
};

export const EMPTY2: Answers2 = {
  years: "", count_now: "", count_peak: "", stopped: "", stop_why: [], stop_why_other: "",
  origin: "", list_given: "", list_done: "", list_stuck: [],
  testing: "", testing_protocol: "", bloodwork: "", wearable: [], doctor_involved: "",
  decide: "", ai: "", sources: [], whose_interest: "",
  pains: {}, top_pain: "", pain_priority: [], sure: "", proof: "",
  allow: [], never: "", handover: "", quit: "",
  tools: [], tools_still: [], tools_dropped_why: [], tech: "",
  spend: "", spend_feel: "", where: [], sellers: "", subs: "", loyalty: "", waste: "",
  confidence: 0, hours: "", feel: "",
};

/** All questions, for labels/export. */
export const ALL_Q: Q[] = PARTS.flatMap((p) => p.questions);
export const LABEL: Record<string, Record<string, string>> = Object.fromEntries(
  ALL_Q.filter((q) => q.kind !== "scale").map((q) => [q.id, Object.fromEntries((q as { options: Opt[] }).options.map((x) => [x.id, x.label]))])
);
LABEL.pains = Object.fromEntries(PAINS.map((p) => [p.id, p.label]));

/** A part is complete when every visible, non-optional question has an answer. */
export function partComplete(part: Part, a: Answers2): boolean {
  if (part.key === "pains") return PAINS.every((p) => a.pains[p.id] !== undefined);
  if (part.key === "pains2") {
    const candidates = TOP_PAINS.filter((p) => a.pains[p.id] && a.pains[p.id] !== "0");
    if (candidates.length > 0 && !candidates.some((p) => p.id === a.top_pain)) return false;
  }
  return part.questions.every((q) => {
    if ("showIf" in q && q.showIf && !q.showIf(a)) return true;
    if ("optional" in q && q.optional) return true;
    const v = a[q.id as keyof Answers2];
    if (q.kind === "scale") return typeof v === "number" && v > 0;
    if (q.kind === "multi") return Array.isArray(v) && v.length > 0;
    return typeof v === "string" && v !== "";
  });
}

/* ---------- Tags → Notion (Participants properties). Persona scoring itself stays with Jenny (persona-scoring-rules-v1.xlsx). ---------- */
export type Tags = {
  "Baseline confidence (1–5)": number;
  "Baseline hours": string;
  "Baseline feel": string;
  "Spend tier": string;
  "Tech comfort": string;
  "Research style": string;
  Skeptic: string;
  Delegation: string;
  "Proof standard": string[];
  "Lead pain": string;
  "Data vs feel": string;
};

export function tagsFrom(a: Answers2): Tags {
  const hours = { lt1: "Under 1", "1_2": "1–2", "3_5": "3–5", "5p": "5+" }[a.hours] || "";
  const feel = { easy: "Easy", fine: "Fine", chore: "Chore", second_job: "Second job" }[a.feel] || "";
  const spend = { lt50: "Under $50", "50_100": "$50–100", "100_200": "$100–200", "200_350": "$200–350", gt350: "Over $350" }[a.spend] || "";
  const tech = { first: "Power user", comfortable: "Comfortable", simple: "Reluctant" }[a.tech] || "";
  const research = { research: "Self-researcher", authority: "Follower", media: "Follower", friends: "Follower", feel: "Feel-led", unsure: "Guesser" }[a.decide] || "";
  const skeptic = { theirs: "Skeptic", depends: "Neutral", mine: "Optimist" }[a.whose_interest] || "";
  const delegation = { cant_wait: "Hands-off", keep_calls: "Ask me", cautious: "Ask me", myself: "Hands-on" }[a.handover] || "";
  const proof = [{ blood: "Blood work", wearable: "Wearable", feel: "Feel", no: "None" }[a.proof] || ""].filter(Boolean);
  const leadPain = ({ buying: "The job", remembering: "The job", sorting: "The job", tracking: "The job", working: "The doubt", choosing: "Choosing", trust: "Trust", cost: "Cost", interactions: "Interactions", gap: "Gap between tests", pills: "Pills", travel: "Travel" } as Record<string, string>)[a.top_pain] || "";
  // Data vs feel: count data assets — paid testing (now or past), blood work at least yearly, a wearable, blood/wearable proof.
  let data = 0;
  if (a.testing === "yes" || a.testing === "past") data++;
  if (a.bloodwork === "2y" || a.bloodwork === "1y") data++;
  if (a.wearable.length > 0 && !a.wearable.includes("no")) data++;
  if (a.proof === "blood" || a.proof === "wearable") data++;
  const dataVsFeel = data >= 3 ? "Data" : data === 0 || (data === 1 && a.proof === "feel") ? "Feel" : "Mixed";
  return {
    "Baseline confidence (1–5)": a.confidence,
    "Baseline hours": hours,
    "Baseline feel": feel,
    "Spend tier": spend,
    "Tech comfort": tech,
    "Research style": research,
    Skeptic: skeptic,
    Delegation: delegation,
    "Proof standard": proof,
    "Lead pain": leadPain,
    "Data vs feel": dataVsFeel,
  };
}

/** Flat, human-readable row for the sheet. */
export function flatten(a: Answers2): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of ALL_Q) {
    const v = a[q.id as keyof Answers2];
    if (q.kind === "scale") out[q.id] = v ? String(v) : "";
    else if (Array.isArray(v)) out[q.id] = v.map((x) => LABEL[q.id]?.[x] || x).join(", ");
    else out[q.id] = LABEL[q.id]?.[String(v)] || String(v ?? "");
  }
  out.stop_why_other = a.stop_why_other;
  out.pains = PAINS.map((p) => `${p.label.split(" — ")[0]}: ${PAIN_LEVELS.find((l) => l.id === a.pains[p.id])?.label || "—"}`).join(" · ");
  out.top_pain = LABEL.pains[a.top_pain] || "";
  return out;
}

export const SHEET2_COLUMNS = [
  "submitted_at", "notion_page_id", "email", "first_name",
  ...["years", "count_now", "count_peak", "stopped", "stop_why", "origin", "list_given", "list_done", "list_stuck", "testing", "testing_protocol", "bloodwork", "wearable", "doctor_involved", "decide", "ai", "sources", "whose_interest", "sure", "proof", "allow", "never", "handover", "quit", "tools", "tools_still", "tools_dropped_why", "tech", "spend", "spend_feel", "where", "sellers", "subs", "loyalty", "waste", "confidence", "hours", "feel"].flatMap((id) => (id === "stop_why" ? ["stop_why", "stop_why_other"] : [id])),
  "pains", "top_pain",
  "tag_lead_pain", "tag_research_style", "tag_skeptic", "tag_delegation", "tag_proof_standard", "tag_data_vs_feel", "tag_tech_comfort", "tag_spend_tier",
  "tag_baseline_confidence", "tag_baseline_hours", "tag_baseline_feel", "raw_json", "user_agent",
] as const;
