"use client";
import React, { useEffect, useRef, useState } from "react";
import { Screen, Title, Lead, Button, Field, Ticket } from "./ui";
import { WAIVER, WAIVER_VERSION, COMPANY, SIGNER } from "@/lib/waiver";

/* ---------- Intro: the email identifies the participant ---------- */

export function WIntro({ email, setEmail, emailError, next, loading }: { email: string; setEmail: (v: string) => void; emailError?: string; next: () => void; loading: boolean }) {
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  return (
    <Screen cta={<Button onClick={next} disabled={loading || !emailOk}>{loading ? "One moment…" : "Open the agreement"}</Button>}>
      <Title className="text-[42px] leading-[1.02] mb-4">Your agreement<span className="text-salmon">.</span></Title>
      <Lead className="mb-[18px]">
        Before Marlo starts, one document: what the program is, what we cover, and what you agree to. Read it, then sign at the bottom.
      </Lead>
      <Ticket eyebrow="Time"><p className="m-0 text-[17px]">About five minutes. Ten sections, plain English. A signed copy lands in your inbox.</p></Ticket>
      <div className="mt-6">
        <Field id="w_email" label="The email you applied with" value={email} onChange={setEmail} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" error={emailError || undefined} />
      </div>
    </Screen>
  );
}

/* ---------- The agreement + signature ---------- */

export type Signature = { png: string; typed: boolean };

export function WRead({ name, setName, email, date, sign, busy, back }: { name: string; setName: (v: string) => void; email: string; date: string; sign: (s: Signature) => void; busy: boolean; back: () => void }) {
  const [agree, setAgree] = useState(false);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typed, setTyped] = useState("");
  const [drawn, setDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const nameOk = name.trim().split(/\s+/).length >= 2;
  const sigOk = mode === "draw" ? drawn : typed.trim().length >= 2;
  const ok = nameOk && sigOk && agree && !busy;

  const submit = () => {
    if (!ok) return;
    if (mode === "draw") {
      const c = canvasRef.current; if (!c) return;
      sign({ png: exportTrimmed(c), typed: false });
    } else {
      sign({ png: renderTyped(typed.trim()), typed: true });
    }
  };

  return (
    <Screen onBack={back} cta={<Button onClick={submit} disabled={!ok}>{busy ? "Signing…" : "Agree and sign"}</Button>}>
      <Title className="mb-1.5">Participant agreement<span className="text-salmon">.</span></Title>
      <p className="m-0 mb-5 font-mono text-[12.5px] text-slate">{WAIVER_VERSION} · {COMPANY}</p>

      <div className="rounded-[18px] bg-paper border border-line px-[18px] py-4 mb-7 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[15px]">
        <span className="text-slate">Participant</span><span className="font-semibold text-midnight">{name || "—"}</span>
        <span className="text-slate">Email</span><span className="font-semibold text-midnight break-all">{email}</span>
        <span className="text-slate">Date</span><span className="font-semibold text-midnight">{date}</span>
      </div>

      <article className="flex flex-col gap-7">
        {WAIVER.map((s) => (
          <section key={s.n}>
            <h2 className="m-0 mb-2.5 text-[19px] leading-[1.25] font-semibold text-midnight"><span className="font-mono text-[14px] text-slate mr-2">{s.n}</span>{s.title}</h2>
            <div className="flex flex-col gap-3 text-[16px] leading-[1.5] text-midnight">
              {s.blocks.map((b, i) =>
                b.kind === "p" ? <p key={i} className="m-0">{b.text}</p> : (
                  <ul key={i} className="m-0 pl-5 flex flex-col gap-2 list-disc marker:text-salmon">{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
                )
              )}
            </div>
          </section>
        ))}
      </article>

      <div className="mt-9 pt-7 border-t border-line flex flex-col gap-6">
        <h2 className="m-0 text-[24px] leading-[1.1] font-semibold text-midnight">Sign<span className="text-salmon">.</span></h2>

        <Field id="w_name" label="Your full legal name" value={name} onChange={setName} autoComplete="name" placeholder="First and last name" error={name && !nameOk ? "First and last name, please." : undefined} />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold tracking-[0.03em] text-slate">Signature</span>
            <button type="button" onClick={() => { setMode(mode === "draw" ? "type" : "draw"); setDrawn(false); }} className="text-[14px] font-semibold text-midnight underline underline-offset-4 decoration-line hover:decoration-midnight">
              {mode === "draw" ? "Type it instead" : "Draw it instead"}
            </button>
          </div>
          {mode === "draw" ? (
            <SignaturePad ref={canvasRef} onChange={setDrawn} />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center h-[56px] rounded-[14px] bg-paper border border-line focus-within:border-midnight">
                <input id="w_typed" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type your name" className="w-full h-full bg-transparent px-[18px] text-[24px] italic text-midnight placeholder:text-taupe placeholder:not-italic placeholder:text-[17px] focus:outline-none" style={{ fontFamily: "'Hanken Grotesk', 'Helvetica Neue', sans-serif" }} />
              </div>
              <p className="m-0 text-[13px] text-slate">Your typed name counts as your signature.</p>
            </div>
          )}
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <span className={"mt-0.5 h-6 w-6 shrink-0 rounded-[7px] border-[1.5px] flex items-center justify-center transition-colors " + (agree ? "bg-midnight border-midnight" : "bg-paper border-line")}>
            {agree ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#FCFAF5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7.5l3 3 6-6.5" /></svg> : null}
          </span>
          <input type="checkbox" className="sr-only" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span className="text-[15.5px] leading-[1.45] text-midnight">I&rsquo;ve read the agreement and I agree to it, and I agree to sign it electronically.</span>
        </label>

        <p className="m-0 text-[13px] leading-[1.45] text-slate">
          Countersigned by {COMPANY} — {SIGNER.name}, {SIGNER.title}. Your signed copy goes to {email} and to your record.
        </p>
      </div>
    </Screen>
  );
}

/* ---------- Signature pad ---------- */

const SignaturePad = React.forwardRef<HTMLCanvasElement, { onChange: (has: boolean) => void }>(function SignaturePad({ onChange }, ref) {
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
    ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#1A1A17";
  }, []);

  const pos = (e: React.PointerEvent) => { const r = inner.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const down = (e: React.PointerEvent) => { drawing.current = true; last.current = pos(e); inner.current!.setPointerCapture(e.pointerId); };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return;
    const ctx = inner.current!.getContext("2d")!, p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last.current = p;
    if (!has) { setHas(true); onChange(true); }
  };
  const up = () => { drawing.current = false; last.current = null; };
  const clear = () => { const c = inner.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); setHas(false); onChange(false); };

  return (
    <div className="relative">
      <canvas ref={setRefs} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}
        className="w-full h-[180px] rounded-[14px] bg-white border border-line touch-none" style={{ touchAction: "none" }} aria-label="Signature pad" />
      <div className="absolute left-[18px] right-[18px] bottom-[44px] border-b border-line pointer-events-none" />
      {!has ? <span className="absolute left-0 right-0 bottom-[16px] text-center text-[13px] text-taupe pointer-events-none">Sign here with your finger or mouse</span> : null}
      {has ? <button type="button" onClick={clear} className="absolute top-2.5 right-3 h-8 px-3 rounded-full bg-paper border border-line text-[13px] font-semibold text-slate hover:border-midnight">Clear</button> : null}
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
  ctx.font = `italic 500 ${size}px 'Hanken Grotesk', 'Helvetica Neue', sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width) + 24 * scale;
  c.width = w; c.height = Math.ceil(size * 1.5);
  const ctx2 = c.getContext("2d")!;
  ctx2.font = `italic 500 ${size}px 'Hanken Grotesk', 'Helvetica Neue', sans-serif`;
  ctx2.fillStyle = "#1A1A17"; ctx2.textBaseline = "middle";
  ctx2.fillText(text, 12 * scale, c.height / 2);
  return c.toDataURL("image/png");
}

/* ---------- End states ---------- */

export function WSigned({ firstName, email }: { firstName: string; email: string }) {
  return (
    <Screen>
      <div className="mt-6">
        <Ticket eyebrow="Agreement signed">
          <div className="text-[32px] leading-[1.05] font-semibold tracking-[-0.01em]">Done<span className="text-salmon">.</span></div>
        </Ticket>
      </div>
      <div className="flex flex-col gap-3.5 mt-6 text-[18px] leading-[1.5]">
        <p className="m-0 text-midnight">Thanks, {firstName || "there"}. A signed copy is on its way to {email}, and one is on your record with us.</p>
        <p className="m-0 text-slate">Next: the short questionnaire and your first call — both linked in your &ldquo;You&rsquo;re in&rdquo; email.</p>
        <p className="m-0 mt-1.5 font-semibold text-midnight">&mdash; The Marlo team</p>
      </div>
    </Screen>
  );
}

export function WAlready() {
  return (
    <Screen>
      <div className="mt-[100px]">
        <Title className="mb-3.5">Already signed.</Title>
        <Lead>We have your agreement — a copy went to your inbox when you signed. Need it again? Reply to any of our emails.</Lead>
      </div>
    </Screen>
  );
}

export function WError({ retry }: { retry: () => void }) {
  return (
    <Screen cta={<Button onClick={retry}>Try again</Button>}>
      <div className="mt-[100px]">
        <Title className="mb-3.5">That didn&rsquo;t go through.</Title>
        <Lead>Something on our side. Nothing was signed &mdash; try once more.</Lead>
      </div>
    </Screen>
  );
}
