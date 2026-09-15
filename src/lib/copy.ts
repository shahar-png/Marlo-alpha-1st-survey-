// Survey 1 · approved design v3 (canvas "Marlo Alpha Survey", 15 Sep 2026)
// Screen 1 is Marlo's voice. Screens 2–8 are the company's voice.

export const AGE_BANDS = [
  { id: "under_18", label: "Under 18" },
  { id: "18_24", label: "18–24" },
  { id: "25_34", label: "25–34" },
  { id: "35_44", label: "35–44" },
  { id: "45_54", label: "45–54" },
  { id: "55_64", label: "55–64" },
  { id: "65_plus", label: "65+" },
] as const;

export const SEX = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "prefer_not", label: "Prefer not to say" },
] as const;

export const FIT = [
  { id: "performance", title: "Performance.", body: "I train regularly and use supplements to improve my performance." },
  { id: "longevity", title: "Longevity.", body: "I want to live healthier, better, and longer." },
  { id: "specific", title: "Something specific.", body: "A condition, a phase, or a goal I'm managing right now.", text: true },
  { id: "other", title: "Other.", body: "", text: true },
] as const;

export const FREQUENCY = [
  { id: "every_day", label: "Every day" },
  { id: "few_week", label: "A few times a week" },
  { id: "now_then", label: "Now and then" },
] as const;

export const SUPPLEMENTS = [
  { id: "multivitamin", label: "Multivitamin" },
  { id: "vitamin_d", label: "Vitamin D" },
  { id: "vitamin_c", label: "Vitamin C" },
  { id: "b12_bcomplex", label: "B12 / B-complex" },
  { id: "magnesium", label: "Magnesium" },
  { id: "omega_3", label: "Omega-3" },
  { id: "zinc", label: "Zinc" },
  { id: "iron", label: "Iron" },
  { id: "calcium", label: "Calcium" },
  { id: "probiotic", label: "Probiotic" },
  { id: "creatine", label: "Creatine" },
  { id: "protein", label: "Protein powder" },
  { id: "collagen", label: "Collagen" },
  { id: "electrolytes", label: "Electrolytes" },
  { id: "ashwagandha", label: "Ashwagandha" },
  { id: "turmeric", label: "Turmeric" },
  { id: "coq10", label: "CoQ10" },
  { id: "melatonin", label: "Melatonin" },
  { id: "nac", label: "NAC" },
  { id: "greens", label: "Greens powder" },
] as const;

export type Answers = {
  full_name: string;
  phone: string; // national digits, US
  email: string;
  age_band: string;
  sex: string;
  fit: string[];
  fit_specific_text: string;
  fit_other_text: string;
  frequency: string;
  supplements: string[];
  supplements_other: string;
  rx: boolean;
  rx_text: string;
};

export const EMPTY: Answers = {
  full_name: "",
  phone: "",
  email: "",
  age_band: "",
  sex: "",
  fit: [],
  fit_specific_text: "",
  fit_other_text: "",
  frequency: "",
  supplements: [],
  supplements_other: "",
  rx: false,
  rx_text: "",
};

/** Bucketing rule (Survey 1 spec): Performance → Optimizer; else first checked. */
export function bucket(fit: string[]): string {
  if (fit.includes("performance")) return "Optimizer";
  if (fit.includes("longevity")) return "Longevity";
  if (fit.includes("specific")) return "Specific condition";
  if (fit.includes("other")) return "Other";
  return "";
}

export function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || "";
}

export const LABELS = {
  age: Object.fromEntries(AGE_BANDS.map((a) => [a.id, a.label])) as Record<string, string>,
  sex: Object.fromEntries(SEX.map((a) => [a.id, a.label])) as Record<string, string>,
  frequency: Object.fromEntries(FREQUENCY.map((a) => [a.id, a.label])) as Record<string, string>,
  supplements: Object.fromEntries(SUPPLEMENTS.map((a) => [a.id, a.label])) as Record<string, string>,
  fit: { performance: "Performance", longevity: "Longevity", specific: "Something specific", other: "Other" } as Record<string, string>,
};
