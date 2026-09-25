"use client";
import React, { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { EMPTY, type Answers } from "@/lib/copy";
import { ATTRIBUTION_STORAGE_KEY, EMPTY_ATTRIBUTION, captureAttribution, type Attribution } from "@/lib/attribution";
import { trackMetaLead } from "@/lib/meta-pixel";
import { COUNTRY_OPTIONS, DEVICE_OPTIONS, SUPPLEMENT_COUNT_OPTIONS, gateExit, type GateFail } from "@/lib/qualify";
import { MetaPixel } from "@/components/meta-pixel";
import { S1Meet, S2Deal, S3Contact, S4About, S5Fit, S6Frequency, S7Stack, S8Close, SReview, SChoice, SExit, SExitYes, SExitNo, SAlready, SError } from "@/components/screens";
import "@/components/survey-one.css";

type Step = "meet" | "deal" | "country" | "device" | "count" | "contact" | "about" | "fit" | "frequency" | "stack" | "review" | "close" | "exit" | "exit_yes" | "exit_no" | "already" | "error";
const ORDER: Step[] = ["meet", "deal", "country", "device", "count", "contact", "about", "fit", "frequency", "stack", "review"];
const NUMBERED: Step[] = ["country", "device", "count", "contact", "about", "fit", "frequency", "stack", "review"];
type ExitReason = "doesnt_fit" | "under_18" | GateFail;

const EMPTY_ATTRIBUTION_JSON = JSON.stringify(EMPTY_ATTRIBUTION);
let clientAttribution = "";
function subscribeAttribution() { return () => {}; }
function readServerAttribution() { return EMPTY_ATTRIBUTION_JSON; }
function readClientAttribution() {
  if (clientAttribution) return clientAttribution;
  try {
    const value = captureAttribution({
      search: window.location.search,
      referrer: document.referrer,
      stored: sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY),
      origin: window.location.origin,
    });
    sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(value));
    clientAttribution = JSON.stringify(value);
  } catch {
    clientAttribution = EMPTY_ATTRIBUTION_JSON;
  }
  return clientAttribution;
}

export default function Page() {
  const attribution = JSON.parse(useSyncExternalStore(subscribeAttribution, readClientAttribution, readServerAttribution)) as Attribution;
  const [step, setStep] = useState<Step>("meet");
  const [a, setA] = useState<Answers>(EMPTY);
  const answers = { ...a, ...attribution };
  const [busy, setBusy] = useState(false);
  const [exitFrom, setExitFrom] = useState<Step>("deal");
  const [exitReason, setExitReason] = useState<ExitReason>("doesnt_fit");
  const [errorFrom, setErrorFrom] = useState<Step>("review");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("reset") === "1" || params.get("fresh") === "1") {
        localStorage.removeItem("marlo_alpha_applied");
        params.delete("reset");
        params.delete("fresh");
        const qs = params.toString();
        window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash);
        return;
      }
      // Client-only. Reading localStorage during render would not match the server HTML.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem("marlo_alpha_applied") === "1") setStep("already");
    } catch {}
  }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);

  const set = useCallback(<K extends keyof Answers>(k: K, v: Answers[K]) => setA((p) => ({ ...p, [k]: v })), []);
  const go = (dir: 1 | -1) => { const n = ORDER[ORDER.indexOf(step) + dir]; if (n) setStep(n); };
  const toExit = (from: Step, reason: ExitReason) => { setExitFrom(from); setExitReason(reason); setStep("exit"); };
  const afterGate = (from: "country" | "device" | "count", field: "country" | "device" | "supplement_count", value: string) => {
    const exit = gateExit(field, value);
    if (exit) toExit(from, exit);
    else go(1);
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const stored = JSON.parse(readClientAttribution()) as Attribution;
      const res = await fetch("/api/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...answers, ...stored }) });
      if (res.status === 409) { setStep("already"); return; }
      if (res.status !== 200) throw new Error(String(res.status));
      trackMetaLead();
      try { localStorage.setItem("marlo_alpha_applied", "1"); } catch {}
      setStep("close");
    } catch { setErrorFrom("review"); setStep("error"); } finally { setBusy(false); }
  };

  const later = async (email: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/later", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, reason: exitReason }) });
      if (!res.ok && res.status !== 409) throw new Error(String(res.status));
      setStep("exit_yes");
    } catch { setErrorFrom("exit"); setStep("error"); } finally { setBusy(false); }
  };

  const common = { a: answers, set, back: () => go(-1), step: NUMBERED.indexOf(step) + 1, total: NUMBERED.length };
  const choice = { back: common.back, step: common.step, total: common.total };

  let screen: React.ReactNode;
  switch (step) {
    case "meet": screen = <S1Meet next={() => go(1)} />; break;
    case "deal": screen = <S2Deal next={() => go(1)} back={() => go(-1)} exit={() => toExit("deal", "doesnt_fit")} />; break;
    case "country": screen = <SChoice {...choice} title={<>Do you live<br /> in the US?</>} options={COUNTRY_OPTIONS} value={answers.country} onSelect={(id) => set("country", id)} next={() => afterGate("country", "country", answers.country)} />; break;
    case "device": screen = <SChoice {...choice} title={<>What phone<br /> do you use?</>} options={DEVICE_OPTIONS} value={answers.device} onSelect={(id) => set("device", id)} next={() => afterGate("device", "device", answers.device)} />; break;
    case "count": screen = <SChoice {...choice} long title={<>How many different<br /> supplements do you<br /> take on a typical day?</>} options={SUPPLEMENT_COUNT_OPTIONS} value={answers.supplement_count} onSelect={(id) => set("supplement_count", id)} next={() => afterGate("count", "supplement_count", answers.supplement_count)} />; break;
    case "contact": screen = <S3Contact {...common} next={() => go(1)} />; break;
    case "about": screen = <S4About {...common} next={() => (answers.age_band === "under_18" ? toExit("about", "under_18") : go(1))} />; break;
    case "fit": screen = <S5Fit {...common} next={() => go(1)} />; break;
    case "frequency": screen = <S6Frequency {...common} next={() => go(1)} />; break;
    case "stack": screen = <S7Stack {...common} next={() => go(1)} />; break;
    case "review": screen = <SReview {...common} next={submit} busy={busy} />; break;
    case "close": screen = <S8Close a={answers} />; break;
    case "exit": screen = <SExit back={() => setStep(exitFrom)} onInterested={later} onNot={() => setStep("exit_no")} busy={busy} />; break;
    case "exit_yes": screen = <SExitYes />; break;
    case "exit_no": screen = <SExitNo />; break;
    case "already": screen = <SAlready />; break;
    case "error": screen = <SError retry={() => setStep(errorFrom)} />; break;
  }
  return <><MetaPixel />{screen}</>;
}
