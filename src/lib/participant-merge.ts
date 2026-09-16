// Survey 1 → Participants merge (before creating a new page).
// Match order:
//   1. Phone (digits / E.164 — same number, any stored format)
//   2. State = Invited (or Invited with empty Applied) + Name (case-insensitive trim)
//   3. Email or Invite email equals the apply email

export type MergeCandidate = {
  id: string;
  name: string;
  phone: string;
  email: string;
  inviteEmail: string;
  state: string;
  applied: string;
};

export function phoneDigits(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

/** US E.164 from 10 national digits or 11-digit 1XXXXXXXXXX. */
export function toE164(raw: string): string {
  const d = phoneDigits(raw);
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  if (d.length === 10) return `+1${d}`;
  return d ? `+${d}` : "";
}

/** Exact strings to try against Notion's phone_number equals filter. */
export function phoneVariants(raw: string): string[] {
  const d = phoneDigits(raw);
  const national = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  if (national.length !== 10) return unique([raw.trim(), d, toE164(raw)].filter(Boolean));
  const e164 = `+1${national}`;
  const a = national.slice(0, 3);
  const b = national.slice(3, 6);
  const c = national.slice(6);
  return unique([
    e164,
    national,
    `1${national}`,
    `(${a}) ${b}-${c}`,
    `${a}-${b}-${c}`,
    `+1 ${a}-${b}-${c}`,
    `+1 (${a}) ${b}-${c}`,
    `${a} ${b} ${c}`,
  ]);
}

function unique(xs: string[]): string[] {
  return [...new Set(xs)];
}

export function phonesMatch(a: string, b: string): boolean {
  const na = nationalDigits(a);
  const nb = nationalDigits(b);
  return Boolean(na && nb && na === nb);
}

function nationalDigits(raw: string): string {
  const d = phoneDigits(raw);
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
  return d;
}

export function namesMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase() && a.trim() !== "";
}

export function emailsMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase() && a.trim() !== "";
}

/** Invited card: State is Invited, or still Invited with no Applied timestamp. */
export function isInvited(c: Pick<MergeCandidate, "state" | "applied">): boolean {
  return c.state.trim().toLowerCase() === "invited";
}

export function pickMergeMatch(
  candidates: MergeCandidate[],
  apply: { phone: string; name: string; email: string },
): MergeCandidate | null {
  const byPhone = candidates.find((c) => phonesMatch(c.phone, apply.phone));
  if (byPhone) return byPhone;

  const byName = candidates.filter((c) => isInvited(c) && namesMatch(c.name, apply.name));
  if (byName.length) return byName.find((c) => !c.applied.trim()) ?? byName[0];

  const byEmail = candidates.find(
    (c) => emailsMatch(c.email, apply.email) || emailsMatch(c.inviteEmail, apply.email),
  );
  if (byEmail) return byEmail;

  return null;
}

/** Email / Invite email / Apply email writes after a match (or a new page). */
export function mergeEmailFields(applyEmail: string, priorEmail: string): {
  email: string;
  applyEmail: string;
  inviteEmail: string;
  setInviteEmail: boolean;
} {
  const apply = applyEmail.trim().toLowerCase();
  const prior = priorEmail.trim().toLowerCase();
  if (prior && prior !== apply) {
    return { email: apply, applyEmail: apply, inviteEmail: prior, setInviteEmail: true };
  }
  return { email: apply, applyEmail: apply, inviteEmail: "", setInviteEmail: false };
}
