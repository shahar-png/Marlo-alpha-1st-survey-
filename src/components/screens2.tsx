"use client";
import React, { useState } from "react";
import { Screen, Title, Lead, Button, Chip, Row, Field, TextArea, Ticket } from "./ui";
import { PARTS, PAINS, PAIN_LEVELS, partComplete, type Answers2, type Part, type Q } from "@/lib/survey2";

type Set2 = <K extends keyof Answers2>(k: K, v: Answers2[K]) => void;

/* ---------- Question renderers ---------- */

function Question({ q, a, set }: { q: Q; a: Answers2; set: Set2 }) {
  if ("showIf" in q && q.showIf && !q.showIf(a)) return null;
  const v = a[q.id as keyof Answers2];
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-[17px] leading-[1.38] font-semibold text-midnight">{q.text}</p>
      {q.kind === "scale" ? (
        <div>
          <div className="flex gap-2">
            {Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i).map((n) => (
              <Chip key={n} active={v === n} onClick={() => set(q.id as "confidence", n)}>
                <span className="w-5 text-center font-mono">{n}</span>
              </Chip>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[13px] text-slate"><span>{q.low}</span><span>{q.high}</span></div>
        </div>
      ) : q.kind === "single" ? (
        q.rows ? (
          <div className="flex flex-col gap-2.5">
            {q.options.map((op) => <Row key={op.id} active={v === op.id} onClick={() => set(q.id as keyof Answers2, op.id as never)}>{op.label}</Row>)}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {q.options.map((op) => <Chip key={op.id} active={v === op.id} onClick={() => set(q.id as keyof Answers2, op.id as never)}>{op.label}</Chip>)}
          </div>
        )
      ) : (
        <MultiQ q={q} a={a} set={set} />
      )}
    </div>
  );
}

function MultiQ({ q, a, set }: { q: Extract<Q, { kind: "multi" }>; a: Answers2; set: Set2 }) {
  const key = q.id as keyof Answers2;
  const cur = (a[key] as string[]) || [];
  const toggle = (id: string) => {
    // "none"/"no" style options are exclusive.
    const exclusive = ["none", "no"];
    let next: string[];
    if (cur.includes(id)) next = cur.filter((x) => x !== id);
    else if (exclusive.includes(id)) next = [id];
    else next = [...cur.filter((x) => !exclusive.includes(x)), id];
    set(key, next as never);
  };
  const otherKey = q.other as keyof Answers2 | undefined;
  return (
    <div>
      {q.rows ? (
        <div className="flex flex-col gap-2.5">{q.options.map((op) => <Row key={op.id} active={cur.includes(op.id)} onClick={() => toggle(op.id)}>{op.label}</Row>)}</div>
      ) : (
        <div className="flex flex-wrap gap-2">{q.options.map((op) => <Chip key={op.id} active={cur.includes(op.id)} onClick={() => toggle(op.id)}>{op.label}</Chip>)}</div>
      )}
      {otherKey && cur.includes("other") ? <TextArea id={String(otherKey)} placeholder="What happened?" value={String(a[otherKey] || "")} onChange={(v) => set(otherKey, v as never)} /> : null}
      {q.optional ? <p className="mt-2 mb-0 text-[13px] text-slate">Optional.</p> : null}
    </div>
  );
}

/* ---------- Generic part screen ---------- */

export function PartScreen({ part, a, set, next, back, step, total, busy }: { part: Part; a: Answers2; set: Set2; next: () => void; back: () => void; step: number; total: number; busy?: boolean }) {
  const ok = partComplete(part, a);
  const last = step === total;
  return (
    <Screen onBack={back} step={step} total={total} cta={<Button onClick={next} disabled={!ok || busy}>{busy ? "Sending…" : last ? "Finish" : "Continue"}</Button>}>
      <Title className="mb-1.5">{part.title.replace(/\.$/, "")}<span className="text-salmon">.</span></Title>
      {part.lead ? <Lead className="mb-4 text-[16px]">{part.lead}</Lead> : <div className="mb-4" />}
      <div className="flex flex-col gap-[26px]">
        {part.key === "pains" ? <PainRating a={a} set={set} /> : null}
        {part.key === "pains2" ? <TopPain a={a} set={set} /> : null}
        {part.questions.map((q) => <Question key={q.id} q={q} a={a} set={set} />)}
      </div>
    </Screen>
  );
}

/* ---------- Part 6 · pains: one tap per line ---------- */

function PainRating({ a, set }: { a: Answers2; set: Set2 }) {
  const rate = (id: string, level: string) => set("pains", { ...a.pains, [id]: level });
  return (
    <div className="flex flex-col">
      {PAINS.map((p, i) => {
        const [head, rest] = p.label.split(" — ");
        return (
          <div key={p.id} className={"py-[14px] border-t border-line" + (i === PAINS.length - 1 ? " border-b" : "")}>
            <p className="m-0 mb-2.5 text-[16px] leading-[1.4]"><span className="font-semibold text-midnight">{head}</span>{rest ? <span className="text-slate"> — {rest}</span> : null}</p>
            <div className="flex flex-wrap gap-2">
              {PAIN_LEVELS.map((l) => (
                <button key={l.id} type="button" onClick={() => rate(p.id, l.id)} aria-pressed={a.pains[p.id] === l.id}
                  className={"h-9 px-3 rounded-full text-[13.5px] font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-salmon " + (a.pains[p.id] === l.id ? (l.id === "2" ? "bg-salmon border border-salmon text-midnight" : l.id === "1" ? "bg-white border-[1.5px] border-midnight text-midnight" : "bg-sage border border-sage text-midnight") : "bg-paper border border-line text-slate hover:border-taupe")}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TopPain({ a, set }: { a: Answers2; set: Set2 }) {
  const candidates = PAINS.filter((p) => a.pains[p.id] && a.pains[p.id] !== "0");
  if (candidates.length === 0) return <p className="m-0 text-[17px] text-slate">Nothing on the list bothers you — noted.</p>;
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-[17px] leading-[1.38] font-semibold text-midnight">Which one bothers you most?</p>
      <div className="flex flex-col gap-2.5">
        {candidates.map((p) => <Row key={p.id} active={a.top_pain === p.id} onClick={() => set("top_pain", p.id)}>{p.label.split(" — ")[0]}</Row>)}
      </div>
    </div>
  );
}

/* ---------- Intro ---------- */

export function S2Intro({ firstName, needEmail, email, setEmail, emailError, next, loading }: { firstName: string; needEmail: boolean; email: string; setEmail: (v: string) => void; emailError?: string; next: () => void; loading: boolean }) {
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  return (
    <Screen cta={<Button onClick={next} disabled={loading || (needEmail && !emailOk)}>{loading ? "One moment…" : "Let’s go"}</Button>}>
      <Title className="text-[42px] leading-[1.02] mb-4">Let&rsquo;s get to know you better<span className="text-salmon">.</span></Title>
      <Lead className="mb-[18px]">
        {firstName ? `${firstName}, you’re in.` : "You’re in."} Before your first call, a few questions about how you run your supplements today &mdash; what you buy, how you decide, what gets in the way. There are no right answers; we want the real picture.
      </Lead>
      <Ticket eyebrow="Time"><p className="m-0 text-[17px]">About ten minutes. Your answers save when you finish.</p></Ticket>
      {needEmail ? (
        <div className="mt-6">
          <Field id="s2_email" label="The email you applied with" value={email} onChange={setEmail} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" error={emailError || undefined} />
        </div>
      ) : null}
    </Screen>
  );
}

/* ---------- Close ---------- */

export function S2Close({ firstName, bookingUrl }: { firstName: string; bookingUrl?: string }) {
  return (
    <Screen cta={bookingUrl ? <a href={bookingUrl} className="block"><Button>Pick a time</Button></a> : undefined}>
      <div className="mt-6">
        <Ticket eyebrow="Profile complete">
          <div className="text-[32px] leading-[1.05] font-semibold tracking-[-0.01em]">That&rsquo;s it<span className="text-salmon">.</span></div>
        </Ticket>
      </div>
      <div className="flex flex-col gap-3.5 mt-6 text-[18px] leading-[1.5]">
        <p className="m-0 text-midnight">Thanks, {firstName || "there"}. This is what lets Marlo start already knowing you.</p>
        <p className="m-0 text-slate">Next: your first call. If you haven&rsquo;t booked it yet, the link is in your &ldquo;You&rsquo;re in&rdquo; email{bookingUrl ? " — or right here" : ""}.</p>
        <p className="m-0 text-slate">See you there.</p>
        <p className="m-0 mt-1.5 font-semibold text-midnight">&mdash; The Marlo team</p>
      </div>
    </Screen>
  );
}

export function S2Done() {
  return (
    <Screen>
      <div className="mt-[100px]">
        <Title className="mb-3.5">You&rsquo;ve already done this one.</Title>
        <Lead>We have your answers. Something changed? Tell us on your first call.</Lead>
      </div>
    </Screen>
  );
}

export function S2NotFound() {
  return (
    <Screen>
      <div className="mt-[100px]">
        <Title className="mb-3.5">We couldn&rsquo;t find you.</Title>
        <Lead>This link doesn&rsquo;t match an application, or the email isn&rsquo;t the one you applied with. Reply to our email and we&rsquo;ll fix it.</Lead>
      </div>
    </Screen>
  );
}

export function S2Error({ retry }: { retry: () => void }) {
  return (
    <Screen cta={<Button onClick={retry}>Try again</Button>}>
      <div className="mt-[100px]">
        <Title className="mb-3.5">That didn&rsquo;t go through.</Title>
        <Lead>Something on our side. Your answers are still here &mdash; try once more.</Lead>
      </div>
    </Screen>
  );
}

/** Convenience for the page: the ordered list of numbered parts. */
export const NUMBERED_PARTS = PARTS;
export function useStep2() { return useState(0); }
