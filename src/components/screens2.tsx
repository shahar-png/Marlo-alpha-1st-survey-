"use client";
import React, { useState } from "react";
import { Button, Field, TextArea, Wordmark, BrandIcon } from "./survey-one-ui";
import {
  PARTS,
  PAINS,
  PAIN_LEVELS,
  partComplete,
  type Answers2,
  type Part,
  type Q,
} from "@/lib/survey2";
import "./survey-two.css";

type Set2 = <K extends keyof Answers2>(k: K, v: Answers2[K]) => void;

function Screen({
  children,
  cta,
  onBack,
  step,
  total,
}: {
  children: React.ReactNode;
  cta?: React.ReactNode;
  onBack?: () => void;
  step?: number;
  total?: number;
}) {
  return (
    <div id="marlo-deep-dive">
      <article className="survey-shell">
        <header className="brand-header">
          <Wordmark className="wordmark" />
          <BrandIcon className="brand-icon" />
        </header>
        <div className="screen-body">
          {onBack ? (
            <nav className="screen-nav" aria-label="Survey navigation">
              <button className="back" type="button" onClick={onBack}>
                <span className="back-line" aria-hidden="true" />
                Back
              </button>
              {step && total ? (
                <span>
                  {String(step).padStart(2, "0")} / {total}
                </span>
              ) : null}
            </nav>
          ) : null}
          {children}
          {cta ? <footer className="footer">{cta}</footer> : null}
        </div>
      </article>
    </div>
  );
}
function Choice({
  name,
  value,
  label,
  checked,
  onChange,
  multiple = false,
  row = false,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  multiple?: boolean;
  row?: boolean;
}) {
  return (
    <label className={row ? "choice-row" : "chip"}>
      <input
        type={multiple ? "checkbox" : "radio"}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}
function Question({ q, a, set }: { q: Q; a: Answers2; set: Set2 }) {
  if ("showIf" in q && q.showIf && !q.showIf(a)) return null;
  const v = a[q.id as keyof Answers2];
  return (
    <fieldset className="question">
      <legend>{q.text}</legend>
      <div className="question-options">
        {q.kind === "scale" ? (
          <>
            <div className="scale">
              {Array.from(
                { length: q.max - q.min + 1 },
                (_, i) => q.min + i,
              ).map((n) => (
                <Choice
                  key={n}
                  name={q.id}
                  value={String(n)}
                  label={String(n)}
                  checked={v === n}
                  onChange={() => set(q.id as "confidence", n)}
                />
              ))}
            </div>
            <div className="scale-labels">
              <span>{q.low}</span>
              <span>{q.high}</span>
            </div>
          </>
        ) : q.kind === "single" ? (
          <div className={q.rows ? "row-list" : "choices"}>
            {q.options.map((op) => (
              <Choice
                key={op.id}
                name={q.id}
                value={op.id}
                label={op.label}
                checked={v === op.id}
                onChange={() => set(q.id as keyof Answers2, op.id as never)}
                row={q.rows}
              />
            ))}
          </div>
        ) : (
          <MultiQ q={q} a={a} set={set} />
        )}
      </div>
    </fieldset>
  );
}
function MultiQ({
  q,
  a,
  set,
}: {
  q: Extract<Q, { kind: "multi" }>;
  a: Answers2;
  set: Set2;
}) {
  const key = q.id as keyof Answers2,
    cur = (a[key] as string[]) || [];
  const toggle = (id: string) => {
    const exclusive = ["none", "no"];
    const next = cur.includes(id)
      ? cur.filter((x) => x !== id)
      : exclusive.includes(id)
        ? [id]
        : [...cur.filter((x) => !exclusive.includes(x)), id];
    set(key, next as never);
  };
  const otherKey = q.other as keyof Answers2 | undefined;
  return (
    <>
      <p className="selection-hint">Select all that apply</p>
      <div className={q.rows ? "row-list" : "choices"}>
        {q.options.map((op) => (
          <Choice
            key={op.id}
            name={q.id}
            value={op.id}
            label={op.label}
            checked={cur.includes(op.id)}
            onChange={() => toggle(op.id)}
            multiple
            row={q.rows}
          />
        ))}
      </div>
      {otherKey && cur.includes("other") ? (
        <TextArea
          id={String(otherKey)}
          placeholder="What happened?"
          value={String(a[otherKey] || "")}
          onChange={(v) => set(otherKey, v as never)}
        />
      ) : null}
      {q.optional ? <p className="optional">Optional.</p> : null}
    </>
  );
}
export function PartScreen({
  part,
  a,
  set,
  next,
  back,
  step,
  total,
  busy,
}: {
  part: Part;
  a: Answers2;
  set: Set2;
  next: () => void;
  back: () => void;
  step: number;
  total: number;
  busy?: boolean;
}) {
  return (
    <Screen
      onBack={back}
      step={step}
      total={total}
      cta={
        <Button onClick={next} disabled={!partComplete(part, a) || busy}>
          {busy ? "Sending…" : step === total ? "Finish" : "Continue"}
        </Button>
      }
    >
      <h1 className={part.title.length > 25 ? "long-title" : undefined}>
        {part.title}
      </h1>
      {part.lead && part.key !== "pains" ? <p>{part.lead}</p> : null}
      <main>
        {part.key === "pains" ? <PainRating a={a} set={set} /> : null}
        {part.key === "pains2" ? <TopPain a={a} set={set} /> : null}
        {part.questions.map((q) => (
          <Question key={q.id} q={q} a={a} set={set} />
        ))}
      </main>
    </Screen>
  );
}
function PainRating({ a, set }: { a: Answers2; set: Set2 }) {
  const rate = (id: string, level: string) => {
    set("pains", { ...a.pains, [id]: level });
    if (level === "0" && a.top_pain === id) set("top_pain", "");
  };
  return (
    <>
      <div className="rating-progress">
        <span>One tap per line.</span>
        <strong aria-live="polite">
          {PAINS.filter((p) => a.pains[p.id] !== undefined).length} /{" "}
          {PAINS.length} rated
        </strong>
      </div>
      {PAINS.map((p) => {
        const [head, rest] = p.label.split(" — ");
        return (
          <fieldset className="rating-item" key={p.id}>
            <legend>
              {head}
              {rest ? <small>— {rest}</small> : null}
            </legend>
            <div className="rating-options">
              {PAIN_LEVELS.map((l) => (
                <Choice
                  key={l.id}
                  name={`pain-${p.id}`}
                  value={l.id}
                  label={l.label}
                  checked={a.pains[p.id] === l.id}
                  onChange={() => rate(p.id, l.id)}
                />
              ))}
            </div>
          </fieldset>
        );
      })}
    </>
  );
}
function TopPain({ a, set }: { a: Answers2; set: Set2 }) {
  const candidates = PAINS.filter(
    (p) => a.pains[p.id] && a.pains[p.id] !== "0",
  );
  if (!candidates.length)
    return <p>Nothing on the list bothers you — noted.</p>;
  return (
    <Question
      q={{
        id: "top_pain",
        kind: "single",
        rows: true,
        text: "Which one bothers you most?",
        options: candidates.map((p) => ({
          id: p.id,
          label: p.label.split(" — ")[0],
        })),
      }}
      a={a}
      set={set}
    />
  );
}
export function S2Intro({
  email,
  setEmail,
  emailError,
  next,
  loading,
}: {
  email: string;
  setEmail: (v: string) => void;
  emailError?: string;
  next: () => void;
  loading: boolean;
}) {
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  return (
    <Screen
      cta={
        <Button onClick={next} disabled={loading || !emailOk}>
          {loading ? "One moment…" : "Let’s go"}
        </Button>
      }
    >
      <main>
        <h1 className="intro-title">
          Let’s get to
          <br />
          know you
          <br />
          better.
        </h1>
        <p className="intro-copy">
          You’re in. Before your first call, a few questions about how you run
          your supplements today — what you buy, how you decide, what gets in
          the way. There are no right answers; we want the real picture.
        </p>
        <section className="time-note">
          <p className="kicker">Time</p>
          <p>
            <mark>About ten minutes.</mark>
            <br />
            Your answers save when you finish.
          </p>
        </section>
        <Field
          id="s2_email"
          label="The email you applied with"
          value={email}
          onChange={setEmail}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={emailError}
        />
      </main>
    </Screen>
  );
}
export function S2Close({
  firstName,
  bookingUrl,
}: {
  firstName: string;
  bookingUrl?: string;
}) {
  return (
    <Screen
      cta={
        bookingUrl ? (
          <a className="next" href={bookingUrl}>
            Pick a time
            <svg
              className="button-arrow"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M6 18 18 6M6 6h12v12" />
            </svg>
          </a>
        ) : undefined
      }
    >
      <main className="end-copy">
        <p className="kicker">Profile complete</p>
        <h1>That’s it.</h1>
        <p>
          Thanks, {firstName || "there"}. This is what lets Marlo start already
          knowing you.
        </p>
        <p>
          Next: your first call. If you haven’t booked it yet, the link is in
          your “You’re in” email{bookingUrl ? " — or right here" : ""}.
        </p>
        <p>See you there.</p>
        <p className="signature">— The Marlo team</p>
      </main>
    </Screen>
  );
}
export function S2Done() {
  return (
    <Screen>
      <main className="end-copy">
        <h1>
          You’ve already
          <br />
          done this one.
        </h1>
        <p>
          We have your answers. Something changed? Tell us on your first call.
        </p>
      </main>
    </Screen>
  );
}
export function S2NotFound() {
  return (
    <Screen>
      <main className="end-copy">
        <h1>
          We couldn’t
          <br />
          find you.
        </h1>
        <p>
          This link doesn’t match an application, or the email isn’t the one you
          applied with. Reply to our email and we’ll fix it.
        </p>
      </main>
    </Screen>
  );
}
export function S2Error({ retry }: { retry: () => void }) {
  return (
    <Screen cta={<Button onClick={retry}>Try again</Button>}>
      <main className="end-copy">
        <h1>
          That didn’t
          <br />
          go through.
        </h1>
        <p>
          Something on our side. Your answers are still here — try once more.
        </p>
      </main>
    </Screen>
  );
}
export const NUMBERED_PARTS = PARTS;
export function useStep2() {
  return useState(0);
}
