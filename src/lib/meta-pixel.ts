/** Digits-only Pixel ID from NEXT_PUBLIC_META_PIXEL_ID. Missing or invalid → no pixel. */
export function metaPixelId(env = process.env.NEXT_PUBLIC_META_PIXEL_ID): string | null {
  const id = (env || "").trim();
  return /^\d{5,20}$/.test(id) ? id : null;
}

/** Fire Meta's standard Lead event. No-ops when the pixel id is missing or fbq was not installed. */
export function trackMetaLead(fbq?: (...args: unknown[]) => void): boolean {
  if (!metaPixelId()) return false;
  const fn = fbq ?? (typeof window !== "undefined" ? (window as Window & { fbq?: (...args: unknown[]) => void }).fbq : undefined);
  if (typeof fn !== "function") return false;
  fn("track", "Lead");
  return true;
}
