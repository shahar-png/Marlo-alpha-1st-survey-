"use client";
import React, { useEffect, useRef, useState } from "react";
import { DocumentButton, DocumentLink, DocumentIcon, Chapters } from "./documents";
import { WAIVER, WAIVER_VERSION, COMPANY, SIGNER, CAP } from "@/lib/waiver";

export function WIntro({ email, setEmail, emailError, next, loading }: { email: string; setEmail: (v: string) => void; emailError?: string; next: () => void; loading: boolean }) {
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  return <div className="agreement-hero">
    <p className="label">Your participant agreement</p><h1>Before we<br /><span className="marked">begin.</span></h1>
    <p className="intro-copy">What the program is, what we cover, and what you agree to. All in one place.</p>
    <div className="fact-strip"><p><strong>3 <small>months</small></strong>Up to three months<br />with Marlo</p><p><strong>{CAP}</strong>Per month for<br />supplements</p><p><strong>5 <small>minutes</small></strong>To read the<br />agreement</p></div>
    <form className="entry-form" onSubmit={e => { e.preventDefault(); if (emailOk && !loading) next(); }}>
      <label className="field" htmlFor="w_email">The email you applied with<input id="w_email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} placeholder="you@example.com" aria-invalid={!!emailError} aria-describedby={emailError ? "w_email_error" : undefined} /></label>
      {emailError && <p id="w_email_error" className="field-error" role="alert">{emailError}</p>}
      <p className="hint">A signed copy lands in your inbox.</p>
      <DocumentButton type="submit" disabled={loading || !emailOk}>{loading ? "One moment…" : "Read the agreement"}</DocumentButton>
    </form>
  </div>;
}

export type Signature = { png: string; typed: boolean };

export function WRead({ name, setName, email, date, sign, busy, back }: { name: string; setName: (v: string) => void; email: string; date: string; sign: (s: Signature) => void; busy: boolean; back: () => void }) {
  const [step, setStep] = useState<"read" | "sign">("read");
  const [agree, setAgree] = useState(false);
  const [mode, setMode] = useState<"draw" | "type">("type");
  const [typed, setTyped] = useState("");
  const [drawn, setDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nameOk = name.trim().split(/\s+/).length >= 2;
  const ok = nameOk && (mode === "draw" ? drawn : typed.trim().length >= 2) && agree && !busy;
  const changeStep = (next: "read" | "sign") => { setStep(next); setDrawn(false); window.scrollTo({ top: 0 }); };
  const submit = () => {
    if (!ok) return;
    if (mode === "draw") { if (canvasRef.current) sign({ png: exportTrimmed(canvasRef.current), typed: false }); }
    else sign({ png: renderTyped(typed.trim()), typed: true });
  };
  const chapters = WAIVER.map(s => ({ id: `agreement-${s.n}`, title: s.title, body: <>{s.blocks.map((b, i) => b.kind === "p" ? <p key={i}>{b.text}</p> : <ul key={i}>{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>)}</> }));
  return <>
    <div hidden={step !== "read"}>
      <button className="back" type="button" onClick={back}><DocumentIcon kind="back" />Back</button>
      <p className="step-label">01 / 02 · Read</p><h1 className="read-title">The agreement.<br /><span className="marked">In full.</span></h1><p className="label">{WAIVER_VERSION} · {COMPANY}</p>
      <div className="identity-strip"><div><small>Participant</small>{name || "—"}</div><div><small>Email</small>{email}</div><div><small>Date</small>{date}</div></div>
      <Chapters items={chapters} legal />
      <div className="legal-action"><DocumentButton onClick={() => changeStep("sign")}>Continue to signature</DocumentButton><p className="hint">Read the agreement above before signing.</p></div>
    </div>
    {step === "sign" && <div>
      <button className="back" type="button" disabled={busy} onClick={() => changeStep("read")}><DocumentIcon kind="back" />Back to the agreement</button>
      <p className="step-label">02 / 02 · Sign</p><h1 className="read-title">Make it<br /><span className="marked">official.</span></h1><p className="intro-copy">Your name. Your signature. A copy for you.</p>
      <form className="signature-sheet" onSubmit={e => { e.preventDefault(); submit(); }}>
        <label className="field" htmlFor="w_name">Your full legal name<input id="w_name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" placeholder="First and last name" required maxLength={120} disabled={busy} aria-invalid={!!name && !nameOk} /></label>
        {name && !nameOk && <p className="field-error">First and last name, please.</p>}
        <div className="signature-tabs" aria-label="Signature method">
          {(["type", "draw"] as const).map(m => <button key={m} type="button" aria-pressed={mode === m} disabled={busy} onClick={() => { if (mode !== m) { setMode(m); setDrawn(false); } }}>{m === "type" ? "Type your signature" : "Draw it"}</button>)}
        </div>
        {mode === "type" ? <><label className="field" htmlFor="w_typed">Signature<input id="w_typed" value={typed} onChange={e => setTyped(e.target.value)} placeholder="Type your full name" maxLength={120} disabled={busy} /></label><div className="signature-preview" aria-label="Your signature preview">{typed}</div></> : <SignaturePad ref={canvasRef} onChange={setDrawn} disabled={busy} />}
        <label className="consent"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} disabled={busy} /><span>I’ve read the agreement and I agree to it, and I agree to sign it electronically.</span></label>
        <p className="hint">Countersigned by {COMPANY} — {SIGNER.name}, {SIGNER.title}. Your signed copy goes to {email} and to your record.</p>
        <DocumentButton type="submit" disabled={!ok}>{busy ? "Signing…" : "Agree and sign"}</DocumentButton>
      </form>
    </div>}
  </>;
}

/* ---------- Signature pad ---------- */

const SignaturePad = React.forwardRef<HTMLCanvasElement, { onChange: (has: boolean) => void; disabled: boolean }>(function SignaturePad({ onChange, disabled }, ref) {
  const inner = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [has, setHas] = useState(false);

  const setRefs = (el: HTMLCanvasElement | null) => {
    inner.current = el;
    if (typeof ref === "function") ref(el); else if (ref) (ref as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
  };

  useEffect(() => {
    const c = inner.current; if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = c.clientWidth, h = 180;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#191918";
  }, []);

  const pos = (e: React.PointerEvent) => { const r = inner.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const down = (e: React.PointerEvent) => { if (disabled) return; drawing.current = true; last.current = pos(e); inner.current!.setPointerCapture(e.pointerId); };
  const move = (e: React.PointerEvent) => {
    if (disabled || !drawing.current || !last.current) return;
    const ctx = inner.current!.getContext("2d")!, p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last.current = p;
    if (!has) { setHas(true); onChange(true); }
  };
  const up = () => { drawing.current = false; last.current = null; };
  const clear = () => { const c = inner.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); setHas(false); onChange(false); };

  return (
    <div className="drawing">
      <canvas ref={setRefs} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}
        className="signature-canvas" style={{ touchAction: "none" }} aria-label="Draw your signature here" />
      <div className="absolute left-[18px] right-[18px] bottom-[44px] border-b border-line pointer-events-none" />
      {!has ? <span className="absolute left-0 right-0 bottom-[16px] text-center text-[13px] text-taupe pointer-events-none">Sign here with your finger or mouse</span> : null}
      {has ? <button type="button" disabled={disabled} onClick={clear} className="absolute top-2.5 right-3 h-8 px-3 rounded-full bg-paper border border-line text-[13px] font-semibold text-slate hover:border-midnight">Clear</button> : null}
    </div>
  );
});

/** Export the drawn strokes on a transparent background, trimmed to their bounds with a small margin. */
function exportTrimmed(c: HTMLCanvasElement): string {
  const ctx = c.getContext("2d")!;
  const { width, height } = c;
  const d = ctx.getImageData(0, 0, width, height).data;
  let x0 = width, y0 = height, x1 = 0, y1 = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (d[(y * width + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < x0) return c.toDataURL("image/png");
  const pad = 16, w = x1 - x0 + 1 + pad * 2, h = y1 - y0 + 1 + pad * 2;
  const out = document.createElement("canvas"); out.width = w; out.height = h;
  out.getContext("2d")!.drawImage(c, x0 - pad, y0 - pad, w, h, 0, 0, w, h);
  return out.toDataURL("image/png");
}

/** Render a typed signature as an image (italic, midnight, transparent). */
function renderTyped(text: string): string {
  const scale = 3, size = 34 * scale;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  ctx.font = `italic 500 ${size}px Georgia, serif`;
  const w = Math.ceil(ctx.measureText(text).width) + 24 * scale;
  c.width = w; c.height = Math.ceil(size * 1.5);
  const ctx2 = c.getContext("2d")!;
  ctx2.font = `italic 500 ${size}px Georgia, serif`;
  ctx2.fillStyle = "#191918"; ctx2.textBaseline = "middle";
  ctx2.fillText(text, 12 * scale, c.height / 2);
  return c.toDataURL("image/png");
}


export function WSigned({ firstName, email }: { firstName: string; email: string }) {
  return <><div className="done-symbol"><DocumentIcon kind="check" /></div><p className="label">Agreement signed</p><h1>You’re<br /><span className="marked">all set.</span></h1>
    <p className="intro-copy">Thanks, {firstName || "there"}. Your agreement is signed and saved to your record.</p>
    <div className="receipt"><p><span>Copy to</span><span>{email}</span></p><p><span>Document</span><span>Participant agreement</span></p></div>
    <p className="hint">A copy is sent to your email. If it doesn’t arrive, contact the team. Next: the short questionnaire and your first call — both linked in your “You’re in” email.</p>
    <DocumentLink href="/guide">Explore your program guide</DocumentLink>
  </>;
}
export function WAlready() {
  return <><p className="label">Your participant agreement</p><h1>Already<br /><span className="marked">signed.</span></h1><p className="intro-copy">We have your agreement — a copy went to your inbox when you signed. Need it again? Reply to any of our emails.</p><div className="legal-action"><DocumentLink href="/guide">Explore your program guide</DocumentLink></div></>;
}
export function WError({ retry }: { retry: () => void }) {
  return <><p className="label">Your participant agreement</p><h1>That didn’t<br /><span className="marked">go through.</span></h1><p className="intro-copy" role="alert">We couldn’t confirm your agreement was saved. Try again — we’ll check your record before saving anything twice.</p><div className="legal-action"><DocumentButton onClick={retry}>Try again</DocumentButton></div></>;
}
