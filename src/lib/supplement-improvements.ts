import { SUPPLEMENTS } from "./copy";

const normalize = (value: string) => value.normalize("NFKC").toLowerCase().replace(/[–—]/g, "-").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
const listed = new Set([
  ...SUPPLEMENTS.map(s => s.label),
  "multivitamins", "vitamin d3", "d3", "vitamin d2", "d2", "vit d", "vit d3", "vit c", "vitamin b12", "b12", "b complex", "vitamin b complex",
  "fish oil", "omega 3", "omega 3s", "probiotics", "protein", "whey protein", "curcumin", "turmeric", "coenzyme q10", "n acetyl cysteine", "greens",
].map(normalize));
const empty = new Set(["none", "no", "n a", "na", "nothing", "no other supplements"]);

/** Conservative triage, not medical classification. Keep ambiguous wording for Jenny to review. */
export function supplementSuggestions(value: string): string[] {
  const seen = new Set<string>();
  return value.slice(0, 500).split(/[,;\n]+|\s+and\s+/i).map(s => s.trim()).filter(s => {
    const key = normalize(s);
    if (!key || listed.has(key) || empty.has(key) || seen.has(key)) return false;
    seen.add(key); return true;
  });
}
