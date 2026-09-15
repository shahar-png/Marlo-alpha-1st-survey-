"use client";
import React, { useCallback, useEffect, useState } from "react";
import { EMPTY, type Answers } from "@/lib/copy";
import { S1Meet, S2Deal, S3Contact, S4About, S5Fit, S6Frequency, S7Stack, S8Close, SExit, SExitYes, SExitNo, SAlready, SError } from "@/components/screens";

type Step = "meet" | "deal" | "contact" | "about" | "fit" | "frequency" | "stack" | "close" | "exit" | "exit_yes" | "exit_no" | "already" | "error";
const ORDER: Step[] = ["meet", "deal", "contact", "about", "fit", "frequency", "stack"];
const NUMBERED: Step[] = ["contact", "about", "fit", "frequency", "stack"];

export default function Page() {
  const [step, setStep] = useState<Step>("meet");
  const [a, setA] = useState<Answers>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [exitFrom, setExitFrom] = useState<Step>("deal");
  const [exitReason, setExitReason] = useState<"doesnt_fit" | "under_18">("doesnt_fit");
  const [errorFrom, setErrorFrom] = useState<Step>("stack");

  useEffect(() => {
    try { if (localStorage.getItem("marlo_alpha_applied") === "1") setStep("already"); } catch {}
  }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);

  const set = useCallback(<K extends keyof Answers>(k: K, v: Answers[K]) => setA((p) => ({ ...p, [k]: v })), []);
  const go = (dir: 1 | -1) => { const n = ORDER[ORDER.indexOf(step) + dir]; if (n) setStep(n); };
  const toExit = (from: Step, reason: "doesnt_fit" | "under_18") => { setExitFrom(from); setExitReason(reason); setStep("exit"); };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a) });
      if (res.status === 409) { setStep("already"); return; }
      if (!res.ok) throw new Error(String(res.status));
      try { localStorage.setItem("marlo_alpha_applied", "1"); } catch {}
      setStep("close");
    } catch { setErrorFrom("stack"); setStep("error"); } finally { setBusy(false); }
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

  const common = { a, set, back: () => go(-1), step: NUMBERED.indexOf(step) + 1, total: NUMBERED.length };

  switch (step) {
    case "meet": return <S1Meet next={() => go(1)} />;
    case "deal": return <S2Deal next={() => go(1)} back={() => go(-1)} exit={() => toExit("deal", "doesnt_fit")} />;
    case "contact": return <S3Contact {...common} next={() => go(1)} />;
    case "about": return <S4About {...common} next={() => (a.age_band === "under_18" ? toExit("about", "under_18") : go(1))} />;
    case "fit": return <S5Fit {...common} next={() => go(1)} />;
    case "frequency": return <S6Frequency {...common} next={() => go(1)} />;
    case "stack": return <S7Stack {...common} next={submit} busy={busy} />;
    case "close": return <S8Close a={a} />;
    case "exit": return <SExit back={() => setStep(exitFrom)} onInterested={later} onNot={() => setStep("exit_no")} busy={busy} />;
    case "exit_yes": return <SExitYes />;
    case "exit_no": return <SExitNo />;
    case "already": return <SAlready />;
    case "error": return <SError retry={() => setStep(errorFrom)} />;
  }
}
