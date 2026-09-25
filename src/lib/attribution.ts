// First landing on Survey 1. URL values win when present; otherwise the stored
// values persist across refreshes in the same tab. Referrer is the first external one.

export const ATTRIBUTION_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid"] as const;
export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];
export type Attribution = Record<AttributionKey | "referrer", string>;

export const ATTRIBUTION_STORAGE_KEY = "marlo_alpha_attribution";

export const EMPTY_ATTRIBUTION: Attribution = {
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_term: "",
  utm_content: "",
  fbclid: "",
  referrer: "",
};

function clip(value: string, max: number) {
  return value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
}

function externalReferrer(referrer: string, origin: string) {
  const value = clip(referrer, 500);
  if (!value) return "";
  try {
    return new URL(value).origin === origin ? "" : value;
  } catch {
    return value.startsWith(origin) ? "" : value;
  }
}

export function captureAttribution(input: { search: string; referrer: string; stored: string | null; origin: string }): Attribution {
  let stored: Partial<Attribution> = {};
  try {
    const parsed = JSON.parse(input.stored || "null") as Partial<Attribution> | null;
    if (parsed && typeof parsed === "object") stored = parsed;
  } catch { /* ignore malformed storage */ }

  const params = new URLSearchParams(input.search.startsWith("?") ? input.search.slice(1) : input.search);
  const next: Attribution = { ...EMPTY_ATTRIBUTION };
  for (const key of ATTRIBUTION_KEYS) {
    const fromUrl = clip(params.get(key) || "", 300);
    const fromStored = clip(String(stored[key] ?? ""), 300);
    next[key] = fromUrl || fromStored;
  }
  next.referrer = clip(String(stored.referrer ?? ""), 500) || externalReferrer(input.referrer, input.origin);
  return next;
}

export function formatAttribution(a: Attribution): string {
  const parts: string[] = [];
  for (const key of ATTRIBUTION_KEYS) if (a[key]) parts.push(`${key}=${a[key]}`);
  if (a.referrer) parts.push(`referrer=${a.referrer}`);
  return parts.join("; ").slice(0, 1800);
}
