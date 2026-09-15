// Writes directly to the participant database (Notion — see notion-build-spec-v1.md).
// Property names below must match the Participants database exactly.

const NOTION_VERSION = "2022-06-28";

type Prop = Record<string, unknown>;

function title(v: string): Prop { return { title: [{ text: { content: v } }] }; }
function text(v: string): Prop { return { rich_text: v ? [{ text: { content: v.slice(0, 1900) } }] : [] }; }
function select(v: string): Prop | undefined { return v ? { select: { name: v } } : undefined; }
function multi(v: string[]): Prop { return { multi_select: v.filter(Boolean).map((name) => ({ name })) }; }
function date(iso: string): Prop { return { date: { start: iso } }; }
function checkbox(v: boolean): Prop { return { checkbox: v }; }

function compact(o: Record<string, Prop | undefined>): Record<string, Prop> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Record<string, Prop>;
}

async function notionFetch(path: string, body: unknown) {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("missing_notion_token");
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`notion_${res.status}: ${t.slice(0, 300)}`);
  }
  return res.json();
}

export function notionEnabled() {
  return Boolean(process.env.NOTION_TOKEN && process.env.NOTION_PARTICIPANTS_DB);
}

/** Find an existing Participants page by email or phone (duplicate guard). */
export async function notionFindParticipant(email: string, phone: string): Promise<string | null> {
  const db = process.env.NOTION_PARTICIPANTS_DB!;
  const r = (await notionFetch(`databases/${db}/query`, {
    filter: { or: [{ property: "Email", email: { equals: email } }, { property: "Phone", phone_number: { equals: phone } }] },
    page_size: 1,
  })) as { results: { id: string }[] };
  return r.results?.[0]?.id ?? null;
}

export type ApplicantRecord = {
  full_name: string;
  first_name: string;
  email: string;
  phone_e164: string;
  age_band: string;
  sex: string;
  fit: string[];
  fit_text: string;
  icp_bucket: string;
  frequency: string;
  supplements: string[];
  supplements_other: string;
  rx: boolean;
  rx_text: string;
  submitted_at: string;
};

/** Create the participant page: State = Applied, all Survey 1 fields. Returns the page id. */
export async function notionCreateApplicant(a: ApplicantRecord): Promise<string> {
  const db = process.env.NOTION_PARTICIPANTS_DB!;
  const secondary = a.fit.filter((f) => !(a.icp_bucket === "Optimizer" && f === "Performance"));
  const props = compact({
    Name: title(a.full_name),
    "First name": text(a.first_name),
    Email: { email: a.email },
    Phone: { phone_number: a.phone_e164 },
    "Age band": select(a.age_band),
    Sex: select(a.sex),
    Device: select("iPhone"), // self-declared by "I'm in" on the deal screen
    Country: select("US"),   // self-declared by "I'm in" on the deal screen
    State: select("Applied"),
    "State changed": date(a.submitted_at),
    Applied: date(a.submitted_at),
    "ICP bucket": select(a.icp_bucket),
    "Secondary tags": multi(secondary),
    "Fit text": text(a.fit_text),
    Frequency: select(a.frequency),
    Supplements: multi(a.supplements),
    "Supplements other": text(a.supplements_other),
    Rx: checkbox(a.rx),
    "Rx text": text(a.rx_text),
  });
  const r = (await notionFetch("pages", { parent: { database_id: db }, properties: props })) as { id: string };
  return r.id;
}

/** Later-round list: someone who didn't fit this round but wants to hear about the next. */
export async function notionCreateLaterRound(email: string, submitted_at: string): Promise<string> {
  const db = process.env.NOTION_PARTICIPANTS_DB!;
  const props = compact({
    Name: title(email),
    Email: { email },
    State: select("Waitlisted"),
    "State changed": date(submitted_at),
    "Waitlist tag": select("Later program"),
    "Gate reason": text("Self-selected: doesn't fit this round (iPhone / US / 18+)"),
  });
  const r = (await notionFetch("pages", { parent: { database_id: db }, properties: props })) as { id: string };
  return r.id;
}
