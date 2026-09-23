"use client";
import React, { Suspense, useEffect, useState } from "react";
import { WAIVER_VERSION } from "@/lib/waiver";
import { DocumentShell } from "@/components/documents";
import { useSearchParams } from "next/navigation";
import { WIntro, WRead, WSigned, WAlready, WError, type Signature } from "@/components/screens-waiver";

type Step = "intro" | "read" | "signed" | "already" | "error";

const NOT_IN_SYSTEM = "This email is not in our system. Please reach out to the program manager.";

function Waiver() {
  const params = useSearchParams();
  const p = params.get("p") || "";
  const [step, setStep] = useState<Step>("intro");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(Boolean(p));
  const [busy, setBusy] = useState(false);
  const [sig, setSig] = useState<Signature | null>(null);

  // The per-person link pre-fills the email; the email is what identifies the participant.
  useEffect(() => {
    if (!p) return;
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/participant?p=${encodeURIComponent(p)}`);
        if (!alive || !r.ok) return;
        const d = (await r.json()) as { email?: string; name?: string };
        if (d.email) setEmail(d.email);
        if (d.name) setName(d.name);
      } catch {} finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [p]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);

  const start = async () => {
    setLoading(true); setEmailError("");
    try {
      const r = await fetch(`/api/participant?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      if (r.status === 404) { setEmailError(NOT_IN_SYSTEM); return; }
      if (!r.ok) { setEmailError("Something on our side — try once more."); return; }
      const d = (await r.json()) as { first_name: string; name: string; signed: boolean };
      setFirstName(d.first_name || "");
      setName(d.name || "");
      if (d.signed) { setStep("already"); return; }
      setStep("read");
    } catch { setEmailError("Something on our side — try once more."); } finally { setLoading(false); }
  };

  const sign = async (s: Signature) => {
    if (busy) return;
    setSig(s); setBusy(true);
    try {
      const local_time = new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
      const res = await fetch("/api/waiver", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ waiver_version: WAIVER_VERSION, p, email: email.trim().toLowerCase(), name: name.trim(), signature: s.png, typed: s.typed, local_time }) });
      if (res.status === 412) { window.location.reload(); return; }
      if (res.status === 409) { setStep("already"); return; }
      if (res.status === 404) { setStep("intro"); setEmailError(NOT_IN_SYSTEM); return; }
      if (!res.ok) throw new Error(String(res.status));
      const d = (await res.json()) as { first_name?: string };
      if (d.first_name) setFirstName(d.first_name);
      setStep("signed");
    } catch { setStep("error"); } finally { setBusy(false); }
  };

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  switch (step) {
    case "intro": return <WIntro email={email} setEmail={(v) => { setEmail(v); setEmailError(""); }} emailError={emailError} loading={loading} next={() => void start()} />;
    case "read": return <WRead name={name} setName={setName} email={email.trim().toLowerCase()} date={today} sign={(s) => void sign(s)} busy={busy} back={() => setStep("intro")} />;
    case "signed": return <WSigned firstName={firstName} email={email.trim().toLowerCase()} />;
    case "already": return <WAlready />;
    case "error": return <WError retry={() => { if (sig) void sign(sig); else setStep("read"); }} />;
  }
}

export default function Page() {
  return (
    <DocumentShell><Suspense fallback={<p className="intro-copy" role="status">Loading your agreement…</p>}>
      <Waiver />
    </Suspense></DocumentShell>
  );
}
