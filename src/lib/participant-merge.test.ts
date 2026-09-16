import assert from "node:assert/strict";
import { test } from "node:test";
import {
  emailsMatch,
  mergeEmailFields,
  namesMatch,
  phoneVariants,
  phonesMatch,
  pickMergeMatch,
  toE164,
  type MergeCandidate,
} from "./participant-merge.ts";

function card(partial: Partial<MergeCandidate> & Pick<MergeCandidate, "id">): MergeCandidate {
  return {
    name: "",
    phone: "",
    email: "",
    inviteEmail: "",
    state: "Invited",
    applied: "",
    ...partial,
  };
}

test("toE164 normalizes 10-digit and +1 numbers", () => {
  assert.equal(toE164("2125551212"), "+12125551212");
  assert.equal(toE164("+1 (212) 555-1212"), "+12125551212");
  assert.equal(toE164("1-212-555-1212"), "+12125551212");
});

test("phonesMatch ignores formatting", () => {
  assert.equal(phonesMatch("+12125551212", "(212) 555-1212"), true);
  assert.equal(phonesMatch("212-555-1212", "646-555-0000"), false);
  assert.equal(phonesMatch("", "+12125551212"), false);
});

test("phoneVariants include E.164 and common US forms", () => {
  const v = phoneVariants("2125551212");
  assert.ok(v.includes("+12125551212"));
  assert.ok(v.includes("2125551212"));
  assert.ok(v.includes("(212) 555-1212"));
});

test("namesMatch is case-insensitive trim", () => {
  assert.equal(namesMatch("  Ada Lovelace  ", "ada lovelace"), true);
  assert.equal(namesMatch("Ada", "Ada Lovelace"), false);
  assert.equal(namesMatch("  ", "  "), false);
});

test("pickMergeMatch: phone wins over name and email", () => {
  const phone = card({ id: "phone", phone: "+1 646-555-0100", name: "Other Person", email: "x@y.com", state: "Applied", applied: "2026-01-01" });
  const name = card({ id: "name", name: "Ada Lovelace", email: "invite@x.com" });
  const email = card({ id: "email", email: "apply@x.com", name: "Someone Else" });
  const hit = pickMergeMatch([name, email, phone], {
    phone: "6465550100",
    name: "Ada Lovelace",
    email: "apply@x.com",
  });
  assert.equal(hit?.id, "phone");
});

test("pickMergeMatch: Invited + name when phone does not match", () => {
  const invited = card({ id: "invited", name: "Ada Lovelace", email: "ada.invite@x.com", phone: "" });
  const appliedSameName = card({
    id: "applied",
    name: "Ada Lovelace",
    email: "other@x.com",
    state: "Applied",
    applied: "2026-01-01",
  });
  const hit = pickMergeMatch([appliedSameName, invited], {
    phone: "2125551212",
    name: "ada lovelace",
    email: "ada.apply@x.com",
  });
  assert.equal(hit?.id, "invited");
});

test("pickMergeMatch: prefers Invited with empty Applied among same-name invites", () => {
  const used = card({ id: "used", name: "Ada Lovelace", applied: "2026-02-01" });
  const fresh = card({ id: "fresh", name: "Ada Lovelace", applied: "" });
  const hit = pickMergeMatch([used, fresh], {
    phone: "",
    name: "Ada Lovelace",
    email: "z@x.com",
  });
  assert.equal(hit?.id, "fresh");
});

test("pickMergeMatch: Email or Invite email when phone and invited-name miss", () => {
  const byInvite = card({
    id: "invite-email",
    name: "Different Name",
    email: "old@x.com",
    inviteEmail: "Ada.Invite@X.com",
    state: "Waitlisted",
  });
  const hit = pickMergeMatch([byInvite], {
    phone: "2125559999",
    name: "Ada Lovelace",
    email: "ada.invite@x.com",
  });
  assert.equal(hit?.id, "invite-email");
});

test("pickMergeMatch: no match creates a new page (null)", () => {
  const hit = pickMergeMatch(
    [card({ id: "other", name: "Bob", email: "bob@x.com", phone: "6465550000" })],
    { phone: "2125551212", name: "Ada Lovelace", email: "ada@x.com" },
  );
  assert.equal(hit, null);
});

test("mergeEmailFields: different prior email sets Invite email + Apply email", () => {
  const f = mergeEmailFields("ada.apply@x.com", "ada.invite@x.com");
  assert.deepEqual(f, {
    email: "ada.apply@x.com",
    applyEmail: "ada.apply@x.com",
    inviteEmail: "ada.invite@x.com",
    setInviteEmail: true,
  });
});

test("mergeEmailFields: same email leaves Invite email unset", () => {
  const f = mergeEmailFields("ada@x.com", "Ada@x.com");
  assert.equal(f.setInviteEmail, false);
  assert.equal(f.email, "ada@x.com");
  assert.equal(f.applyEmail, "ada@x.com");
  assert.equal(f.inviteEmail, "");
});

test("emailsMatch trims and lowercases", () => {
  assert.equal(emailsMatch(" Ada@X.com ", "ada@x.com"), true);
  assert.equal(emailsMatch("", ""), false);
});
