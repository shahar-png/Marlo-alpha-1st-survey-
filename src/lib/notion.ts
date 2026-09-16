// Writes directly to the participant database (Notion — see notion-build-spec-v1.md).
// Property names below must match the Participants database exactly.
// Invite email and Apply email are Email properties on Participants.

import {
  emailsMatch,
  mergeEmailFields,
  namesMatch,
  phoneVariants,
  phonesMatch,
  type MergeCandidate,
} from "./participant-merge";

const NOTION_VERSION = "2022-06-28";

type Prop = Record<string, unknown>;
type NotionPage = { id: string; properties: Record<string, { type: string; [k: string]: unknown }> };

function title(v: string): Prop { return { title: [{ text: { content: v } }] }; }
function text(v: string): Prop { return { rich_text: v ? [{ text: { content: v.slice(0, 1900) } }] : [] }; }
function select(v: string): Prop | undefined { return v ? { select: { name: v } } : undefined; }
function multi(v: string[]): Prop { return { multi_select: v.filter(Boolean).map((name) => ({ name })) }; }
function date(iso: string): Prop { return { date: { start: iso } }; }
function checkbox(v: boolean): Prop { return { checkbox: v }; }

function compact(o: Record<string, Prop | undefined>): Record<string, Prop> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Record<string, Prop>;
}

function emailProp(v: string): Prop {
  return { email: v || null };
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

async function queryParticipants(filter: unknown, pageSize = 100): Promise<NotionPage[]> {
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

function toMergeCandidate(page: NotionPage): MergeCandidate {
  const P = page.properties;
  return {
    id: page.id,
    name: plain(P.Name),
    phone: plain(P.Phone),
    email: plain(P.Email),
    inviteEmail: plain(P["Invite email"]),
    state: plain(P.State),
    applied: plain(P.Applied),
  };
}

/** Merge match order: Phone → Invited+Name → Email / Invite email. See participant-merge.ts. */
export async function notionFindMergeTarget(email: string, phone: string, name: string): Promise<MergeCandidate | null> {
  if (phone) {
    const variants = phoneVariants(phone);
    const byFormat = await queryParticipants({
      or: variants.map((v) => ({ property: "Phone", phone_number: { equals: v } })),
    }, 10);
    const phoneHit = byFormat.map(toMergeCandidate).find((c) => phonesMatch(c.phone, phone));
    if (phoneHit) return phoneHit;

    const withPhone = (await queryParticipants({ property: "Phone", phone_number: { is_not_empty: true } }))
      .map(toMergeCandidate)
      .find((c) => phonesMatch(c.phone, phone));
    if (withPhone) return withPhone;
  }

  const invited = (await queryParticipants({ property: "State", select: { equals: "Invited" } }))
    .map(toMergeCandidate)
    .filter((c) => namesMatch(c.name, name));
  if (invited.length) return invited.find((c) => !c.applied.trim()) ?? invited[0];

  const emailFilter = {
    or: [
      { property: "Email", email: { equals: email } },
      { property: "Invite email", email: { equals: email } },
    ],
  };
  const emailPages = await queryParticipants(emailFilter, 5).catch(() =>
    queryParticipants({ property: "Email", email: { equals: email } }, 5),
  );
  const byEmail = emailPages
    .map(toMergeCandidate)
    .find((c) => emailsMatch(c.email, email) || emailsMatch(c.inviteEmail, email));
  return byEmail ?? null;
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
}

function applicantEmailProperties(applyEmail: string, priorEmail: string): Record<string, Prop> {
  const fields = mergeEmailFields(applyEmail, priorEmail);
  return compact({
    Email: emailProp(fields.email),
    "Apply email": emailProp(fields.applyEmail),
    "Invite email": fields.setInviteEmail ? emailProp(fields.inviteEmail) : undefined,
  });
}

/** Create the participant page: State = Applied, all Survey 1 fields. Returns the page id. */
export async function notionCreateApplicant(a: ApplicantRecord): Promise<string> {
  const db = process.env.NOTION_PARTICIPANTS_DB!;
  const props = { ...survey1Properties(a), ...applicantEmailProperties(a.email, "") };
  const r = (await notionFetch("pages", { parent: { database_id: db }, properties: props })) as { id: string };
  return r.id;
}

/** Update an existing Participants page with Survey 1 fields, or create one if no merge match. */
export async function notionUpsertApplicant(a: ApplicantRecord): Promise<string> {
  const match = await notionFindMergeTarget(a.email, a.phone_e164, a.full_name);
  if (!match) return notionCreateApplicant(a);
  const priorEmail = match.email || match.inviteEmail;
  const props = { ...survey1Properties(a), ...applicantEmailProperties(a.email, priorEmail) };
  await notionFetch(`pages/${match.id}`, { properties: props }, "PATCH");
  return match.id;
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
