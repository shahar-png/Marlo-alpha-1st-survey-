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

async function notionFetch(path: string, body: unknown, method: "POST" | "GET" | "PATCH" = "POST") {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("missing_notion_token");
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: method === "GET" ? undefined : JSON.stringify(body),
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

type NotionPage = { id: string; properties: Record<string, { type: string; [k: string]: unknown }> };

function plain(p: NotionPage["properties"][string] | undefined): string {
  if (!p) return "";
  const t = p.type;
  if (t === "rich_text" || t === "title") return ((p[t] as { plain_text: string }[]) || []).map((x) => x.plain_text).join("");
  if (t === "email") return String(p.email || "");
  if (t === "phone_number") return String(p.phone_number || "");
  if (t === "select") return String((p.select as { name: string } | null)?.name || "");
  if (t === "date") return String((p.date as { start: string } | null)?.start || "");
  return "";
}

/** Last 10 digits — Survey 1 is US-only, so this is the E.164 national number. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

function namesMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function phoneEqualsFilter(phoneE164: string) {
  const d = phoneDigits(phoneE164);
  const variants = [
    `+1${d}`,
    d,
    `1${d}`,
    `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`,
    `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`,
    `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`,
    `+1 ${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`,
    `+1 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`,
    `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`,
  ];
  return { or: variants.map((v) => ({ property: "Phone", phone_number: { equals: v } })) };
}

async function queryPages(filter: unknown, pageSize = 100): Promise<NotionPage[]> {
  const db = process.env.NOTION_PARTICIPANTS_DB!;
  const out: NotionPage[] = [];
  let cursor: string | undefined;
  do {
    const r = (await notionFetch(`databases/${db}/query`, {
      filter,
      page_size: pageSize,
      ...(cursor ? { start_cursor: cursor } : {}),
    })) as { results: NotionPage[]; has_more?: boolean; next_cursor?: string | null };
    out.push(...(r.results || []));
    cursor = r.has_more && r.next_cursor ? r.next_cursor : undefined;
  } while (cursor);
  return out;
}

export type ApplicantMatch = {
  id: string;
  name: string;
  email: string;
  inviteEmail: string;
  applyEmail: string;
  phone: string;
  state: string;
  applied: string;
};

function toApplicantMatch(page: NotionPage): ApplicantMatch {
  const P = page.properties;
  return {
    id: page.id,
    name: plain(P.Name),
    email: plain(P.Email).toLowerCase(),
    inviteEmail: plain(P["Invite email"]).toLowerCase(),
    applyEmail: plain(P["Apply email"]).toLowerCase(),
    phone: plain(P.Phone),
    state: plain(P.State),
    applied: plain(P.Applied),
  };
}

/**
 * Find an existing Participants page to merge into (first hit wins):
 * 1. Phone — digits / E.164 match an existing Phone
 * 2. Else Name (case-insensitive trim) on State = Invited (or Invited with empty Applied)
 * 3. Else Email or Invite email equals the apply email
 */
export async function notionFindApplicantMatch(email: string, phoneE164: string, name: string): Promise<ApplicantMatch | null> {
  const digits = phoneDigits(phoneE164);

  const byPhone = await queryPages(phoneEqualsFilter(phoneE164), 10);
  const phoneHit = byPhone.find((p) => phoneDigits(plain(p.properties.Phone)) === digits);
  if (phoneHit) return toApplicantMatch(phoneHit);

  // Invite cards may store Phone in a format the equals variants miss — scan Invited phones.
  const invited = await queryPages({
    or: [
      { property: "State", select: { equals: "Invited" } },
      { and: [{ property: "State", select: { equals: "Invited" } }, { property: "Applied", date: { is_empty: true } }] },
    ],
  });
  const invitedPhoneHit = invited.find((p) => {
    const stored = phoneDigits(plain(p.properties.Phone));
    return stored.length === 10 && stored === digits;
  });
  if (invitedPhoneHit) return toApplicantMatch(invitedPhoneHit);

  const nameHit = invited.find((p) => namesMatch(plain(p.properties.Name), name));
  if (nameHit) return toApplicantMatch(nameHit);

  const byEmail = await queryPages({
    or: [
      { property: "Email", email: { equals: email } },
      { property: "Invite email", email: { equals: email } },
    ],
  }, 5);
  return byEmail[0] ? toApplicantMatch(byEmail[0]) : null;
}

/** Invited (or not-yet-applied) cards merge; anyone who already Applied stays a duplicate. */
export function isMergeableInvite(m: ApplicantMatch): boolean {
  return m.state === "Invited" || !m.applied;
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

function survey1Properties(a: ApplicantRecord): Record<string, Prop> {
  const secondary = a.fit.filter((f) => !(a.icp_bucket === "Optimizer" && f === "Performance"));
  return compact({
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
    "Apply email": { email: a.email },
  });
}

/** Create the participant page: State = Applied, all Survey 1 fields. Returns the page id. */
export async function notionCreateApplicant(a: ApplicantRecord): Promise<string> {
  const db = process.env.NOTION_PARTICIPANTS_DB!;
  // New walk-ins: Email + Apply email = survey email; Invite email stays empty.
  const r = (await notionFetch("pages", { parent: { database_id: db }, properties: survey1Properties(a) })) as { id: string };
  return r.id;
}

/** Merge Survey 1 onto an existing Participants page (invite card). Does not create a second page. */
export async function notionUpdateApplicant(pageId: string, a: ApplicantRecord, prior: ApplicantMatch): Promise<void> {
  const priorEmail = prior.inviteEmail || prior.email;
  const props = compact({
    ...survey1Properties(a),
    // If they applied under a different address than the invite card, keep the old one on Invite email.
    ...(priorEmail && priorEmail !== a.email ? { "Invite email": { email: priorEmail } } : {}),
  });
  await notionFetch(`pages/${pageId}`, { properties: props }, "PATCH");
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

/* ---------- Survey 2 ---------- */

export type Participant = { id: string; first_name: string; email: string; state: string; survey2_done: string };

function toParticipant(page: NotionPage): Participant {
  const P = page.properties;
  return {
    id: page.id,
    first_name: plain(P["First name"]) || plain(P.Name).split(/\s+/)[0] || "",
    email: plain(P.Email),
    state: plain(P.State),
    survey2_done: plain(P["Survey 2 done"]),
  };
}

const UUID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

/** Participant by page id (the ?p= in the Survey 2 link) — null if not found. */
export async function notionGetParticipant(pageId: string): Promise<Participant | null> {
  if (!UUID.test(pageId)) return null;
  try {
    const page = (await notionFetch(`pages/${pageId}`, undefined, "GET")) as NotionPage;
    return toParticipant(page);
  } catch (e) {
    if (String(e).includes("notion_404")) return null;
    throw e;
  }
}

/** Participant by email — the fallback when the link carries no id. */
export async function notionFindByEmail(email: string): Promise<Participant | null> {
  const db = process.env.NOTION_PARTICIPANTS_DB!;
  const r = (await notionFetch(`databases/${db}/query`, { filter: { property: "Email", email: { equals: email } }, page_size: 1 })) as { results: NotionPage[] };
  return r.results?.[0] ? toParticipant(r.results[0]) : null;
}

export type Survey2Tags = {
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

/** Write the Survey 2 tags onto the participant page. Persona / Runner-up / Confidence are left to Jenny's scoring. */
export async function notionWriteSurvey2(pageId: string, tags: Survey2Tags, doneAt: string, rawUrl: string): Promise<void> {
  const props = compact({
    "Survey 2 done": date(doneAt),
    "Survey 2 raw": rawUrl ? { url: rawUrl } : undefined,
    "Baseline confidence (1–5)": tags["Baseline confidence (1–5)"] ? { number: tags["Baseline confidence (1–5)"] } : undefined,
    "Baseline hours": select(tags["Baseline hours"]),
    "Baseline feel": select(tags["Baseline feel"]),
    "Spend tier": select(tags["Spend tier"]),
    "Tech comfort": select(tags["Tech comfort"]),
    "Research style": select(tags["Research style"]),
    Skeptic: select(tags.Skeptic),
    Delegation: select(tags.Delegation),
    "Proof standard": multi(tags["Proof standard"]),
    "Lead pain": select(tags["Lead pain"]),
    "Data vs feel": select(tags["Data vs feel"]),
  });
  await notionFetch(`pages/${pageId}`, { properties: props }, "PATCH");
}
