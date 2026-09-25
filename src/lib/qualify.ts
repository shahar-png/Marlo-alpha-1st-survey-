// Hard gates for this alpha round. Failures use the later-round page and never POST /api/apply.
// Notion select names: Device = iPhone | Android | Other, Country = US | Outside US.
// Supplement count is separate from Frequency (how often), which is not a gate.

export const COUNTRY_OPTIONS = [
  { id: "US", label: "Yes", pass: true },
  { id: "Outside US", label: "No", pass: false },
] as const;

export const DEVICE_OPTIONS = [
  { id: "iPhone", label: "iPhone", pass: true },
  { id: "Android", label: "Android", pass: false },
  { id: "Other", label: "Other", pass: false },
] as const;

export const SUPPLEMENT_COUNT_OPTIONS = [
  { id: "0", label: "0", pass: false },
  { id: "1–2", label: "1–2", pass: true },
  { id: "3–5", label: "3–5", pass: true },
  { id: "6+", label: "6+", pass: true },
] as const;

export type GateField = "country" | "device" | "supplement_count";
export type GateFail = "not_us" | "not_iphone" | "no_supplements";

const GATES = {
  country: COUNTRY_OPTIONS,
  device: DEVICE_OPTIONS,
  supplement_count: SUPPLEMENT_COUNT_OPTIONS,
} as const;

export function optionPasses(field: GateField, value: string): boolean {
  return GATES[field].some((option) => option.id === value && option.pass);
}

/** Pass continues. A chosen failing answer returns the later-round reason. */
export function gateExit(field: GateField, value: string): GateFail | null {
  if (optionPasses(field, value)) return null;
  if (field === "country") return "not_us";
  if (field === "device") return "not_iphone";
  return "no_supplements";
}

export function applicationQualifies(a: { country: string; device: string; supplement_count: string }): boolean {
  return optionPasses("country", a.country) && optionPasses("device", a.device) && optionPasses("supplement_count", a.supplement_count);
}

/** Notion "Gate reason" for the later-round page. Sheet still stores the short reason code. */
export function laterGateReason(reason: string): string {
  switch (reason) {
    case "under_18":
      return "Under 18";
    case "not_us":
      return "Does not live in the US";
    case "not_iphone":
      return "Phone is not an iPhone";
    case "no_supplements":
      return "Takes 0 different supplements on a typical day";
    default:
      return "Self-selected: doesn't fit this round (iPhone / US / 18+)";
  }
}
