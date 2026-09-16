"use client";
import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EMPTY2, PARTS, type Answers2 } from "@/lib/survey2";
import { PartScreen, S2Intro, S2Close, S2Done, S2NotFound, S2Error } from "@/components/screens2";

type Step = "intro" | "part" | "close" | "done" | "not_found" | "error";

function DeepDive() {
  const params = useSearchParams();
  const p = params.get("p") || "";
  const [step, setStep] = useState<Step>("intro");
  const [i, setI] = useState(0); // index into PARTS
  const [a, setA] = useState<Answers2>(EMPTY2);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(Boolean(p));
  const [busy, setBusy] = useState(false);
  const [emailError, setEmailError] = useState("");

  // A per-person link (?p=) only pre-fills the email; the email is what identifies the participant.
  useEffect(() => {
    if (!p) return;
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/participant?p=${encodeURIComponent(p)}`);
        if (!alive || !r.ok) return;
        const d = (await r.json()) as { email?: string };
        if (d.email) setEmail(d.email);
      } catch {} finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [p]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [step, i]);

  const set = useCallback(<K extends keyof Answers2>(k: K, v: Answers2[K]) => setA((prev) => ({ ...prev, [k]: v })), []);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/deep-dive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ p, email: email.trim().toLowerCase(), answers: a }) });
      if (res.status === 404) { setStep("not_found"); return; }
      if (res.status === 409) { setStep("done"); return; }
      if (!res.ok) throw new Error(String(res.status));
      const d = (await res.json()) as { first_name?: string };
      if (d.first_name) setFirstName(d.first_name);
      setStep("close");
    } catch { setStep("error"); } finally { setBusy(false); }
  };

  // Intro → first part. The email must match a participant in the pipeline before the survey opens.
  const start = async () => {
    setLoading(true); setEmailError("");
    try {
      const r = await fetch(`/api/participant?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      if (r.status === 404) { setEmailError("This email is not in our system. Please reach out to the program manager."); return; }
      if (!r.ok) { setEmailError("Something on our side — try once more."); return; }
      const d = (await r.json()) as { first_name: string; done: boolean };
      setFirstName(d.first_name || "");
      if (d.done) { setStep("done"); return; }
      setStep("part");
    } catch { setEmailError("Something on our side — try once more."); } finally { setLoading(false); }
  };

  const next = () => { if (i < PARTS.length - 1) setI(i + 1); else void submit(); };
  const back = () => { if (i > 0) setI(i - 1); else setStep("intro"); };

  switch (step) {
    case "intro": return <S2Intro email={email} setEmail={(v) => { setEmail(v); setEmailError(""); }} emailError={emailError} loading={loading} next={() => void start()} />;
    case "part": return <PartScreen part={PARTS[i]} a={a} set={set} next={next} back={back} step={i + 1} total={PARTS.length} busy={busy} />;
    case "close": return <S2Close firstName={firstName} bookingUrl={process.env.NEXT_PUBLIC_BOOKING_URL} />;
    case "done": return <S2Done />;
    case "not_found": return <S2NotFound />;
    case "error": return <S2Error retry={() => setStep("part")} />;
  }
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DeepDive />
    </Suspense>
  );
}
