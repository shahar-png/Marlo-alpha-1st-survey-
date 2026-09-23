"use client";
import React, { useState } from "react";
import { Screen, Title, Lead, Label, Button, Chip, Row, Field, TextArea } from "./survey-one-ui";
import { MarloIntro } from "./survey-one-intro";
import "./survey-one.css";
import { AGE_BANDS, SEX, FIT, FREQUENCY, SUPPLEMENTS, type Answers, firstName } from "@/lib/copy";

type Common = {
  a: Answers;
  set: <K extends keyof Answers>(k: K, v: Answers[K]) => void;
  next: () => void;
  back: () => void;
  step: number;
  total: number;
};

/* 1 · Approved animated introduction */
export function S1Meet({ next }: Pick<Common, "next">) {
  return <MarloIntro next={next} />;
}

/* 2 · The deal — company voice; the only screen with two buttons */
export function S2Deal({ next, back, exit }: Pick<Common, "next" | "back"> & { exit: () => void }) {
  return (
    <Screen
      onBack={back}
      cta={
        <div>
          <Button onClick={next}>I&rsquo;m in</Button>
          <Button quiet onClick={exit}>I don&rsquo;t fit this round</Button>
        </div>
      }
    >
      <Title>The deal.</Title>
      <p className="flow-kicker">What you get</p>
      <p className="deal-lead">Three months of Marlo,<br />with your protocol <mark>covered.</mark></p>
      <Lead>Marlo orders your supplements; we pay for them.</Lead>
      <section className="deal-block"><h2>What we ask.</h2><Lead>Use Marlo for real. A 30-minute call with us each week. Honest feedback.</Lead></section>
      <section className="deal-block"><Lead>This round is for people who:</Lead><ul className="eligibility">
        {["Use an iPhone", "Live in the US", "Are 18 or older"].map(t => <li key={t}><span aria-hidden="true">✓</span>{t}</li>)}
      </ul></section>
    </Screen>
  );
}

/* 3 · Contact */
export function S3Contact({ a, set, next, back, step, total }: Common) {
  const digits = a.phone.replace(/\D/g, "");
  const phoneOk = digits.length === 10;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a.email.trim());
  const nameOk = a.full_name.trim().split(/\s+/).length >= 2;
  const fmt = (d: string) => (d.length <= 3 ? d : d.length <= 6 ? `${d.slice(0, 3)} ${d.slice(3)}` : `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`);
  return (
    <Screen onBack={back} step={step} total={total} cta={<Button onClick={next} disabled={!(phoneOk && emailOk && nameOk)}>Continue</Button>}>
      <Title>How do we<br />reach you?</Title>
      <div className="contact-fields">
        <Field id="full_name" label="Full name" value={a.full_name} onChange={(v) => set("full_name", v)} autoComplete="name" placeholder="First and last" />
        <Field id="phone" label="Mobile number" value={fmt(digits)} onChange={(v) => set("phone", v.replace(/\D/g, "").slice(0, 10))} type="tel" inputMode="tel" autoComplete="tel-national" prefix="+1" placeholder="555 123 4567" error={a.phone && !phoneOk ? "Ten digits, US number." : undefined} />
        <Field id="email" label="Email" value={a.email} onChange={(v) => set("email", v)} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" error={a.email && !emailOk ? "That doesn't look like an email." : undefined} />
      </div>
    </Screen>
  );
}

/* 4 · About you — age + sex */
export function S4About({ a, set, next, back, step, total }: Common) {
  return (
    <Screen onBack={back} step={step} total={total} cta={<Button onClick={next} disabled={!(a.age_band && a.sex)}>Continue</Button>}>
      <Title>A little<br />about you.</Title>
      <div className="question-groups about-groups">
        <div>
          <Label>Age</Label>
          <div className="choices">{AGE_BANDS.map((o) => <Chip key={o.id} active={a.age_band === o.id} onClick={() => set("age_band", o.id)}>{o.label}</Chip>)}</div>
        </div>
        <div>
          <Label>Sex</Label>
          <div className="choices">{SEX.map((o) => <Chip key={o.id} active={a.sex === o.id} onClick={() => set("sex", o.id)}>{o.label}</Chip>)}</div>
        </div>
      </div>
    </Screen>
  );
}

/* 5 · Who you are */
export function S5Fit({ a, set, next, back, step, total }: Common) {
  const toggle = (id: string) => set("fit", a.fit.includes(id) ? a.fit.filter((x) => x !== id) : [...a.fit, id]);
  return (
    <Screen onBack={back} step={step} total={total} cta={<Button onClick={next} disabled={a.fit.length === 0}>Continue</Button>}>
      <Title className="long">Let&rsquo;s learn more<br />about you<br />and your fit.</Title>
      <Lead>Which of these sound like you? Pick all that apply.</Lead>
      <div className="choice-list">
        {FIT.map((f) => (
          <div key={f.id}>
            <Row active={a.fit.includes(f.id)} onClick={() => toggle(f.id)}>
              <span className="choice-title">{f.title}</span>{f.body ? <span className="choice-description"> {f.body}</span> : null}
            </Row>
            {"text" in f && f.text && a.fit.includes(f.id) ? (
              <TextArea id={`fit_${f.id}`} placeholder="Tell us more" value={f.id === "specific" ? a.fit_specific_text : a.fit_other_text} onChange={(v) => set(f.id === "specific" ? "fit_specific_text" : "fit_other_text", v)} />
            ) : null}
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* 6 · How often */
export function S6Frequency({ a, set, next, back, step, total }: Common) {
  return (
    <Screen onBack={back} step={step} total={total} cta={<Button onClick={next} disabled={!a.frequency}>Continue</Button>}>
      <Title>How often do<br />you take<br />supplements?</Title>
      <div className="choice-list">
        {FREQUENCY.map((o) => <Row key={o.id} active={a.frequency === o.id} onClick={() => set("frequency", o.id)}>{o.label}</Row>)}
      </div>
    </Screen>
  );
}

/* 7 · What you take */
export function S7Stack({ a, set, next, back, step, total, busy }: Common & { busy: boolean }) {
  const toggle = (id: string) => set("supplements", a.supplements.includes(id) ? a.supplements.filter((x) => x !== id) : [...a.supplements, id]);
  const otherOn = a.supplements.includes("other");
  return (
    <Screen onBack={back} step={step} total={total} cta={<Button onClick={next} disabled={busy || !(a.supplements.length > 0 || a.rx)}>{busy ? "Sending…" : "Continue"}</Button>}>
      <Title>What do<br />you take?</Title>
      <Lead>Pick everything that&rsquo;s part of your routine.</Lead>
      <Label>Supplements</Label>
      <div className="choices">
        {SUPPLEMENTS.map((s) => <Chip key={s.id} active={a.supplements.includes(s.id)} onClick={() => toggle(s.id)}>{s.label}</Chip>)}
        <Chip active={otherOn} onClick={() => toggle("other")}>Other</Chip>
      </div>
      {otherOn ? <TextArea id="supplements_other" placeholder="What else?" value={a.supplements_other} onChange={(v) => set("supplements_other", v)} /> : null}
      <div className="prescriptions">
        <Label>Prescriptions</Label>
        <Row active={a.rx} onClick={() => set("rx", !a.rx)}>I take prescription medication alongside</Row>
        {a.rx ? <TextArea id="rx_text" placeholder="Which ones? (optional)" value={a.rx_text} onChange={(v) => set("rx_text", v)} /> : null}
      </div>
    </Screen>
  );
}

/* 8 · Close */
export function S8Close({ a }: { a: Answers }) {
  return <Screen><div className="end-copy">
    <p className="flow-kicker">Application received</p><Title>You&rsquo;re in<br />the queue.</Title>
    <Lead>Thanks, {firstName(a.full_name) || "there"}. Your application is with the Marlo founders now.</Lead>
    <Lead>We&rsquo;re reading every one ourselves, and we&rsquo;ll be in touch shortly with the next step.</Lead>
    <Lead>Really glad you&rsquo;re here.</Lead><p className="signature">&mdash; The Marlo team</p>
  </div></Screen>;
}

/* Exit · Later round — from "I don't fit this round" or Under 18 */
export function SExit({ back, onInterested, onNot, busy }: { back: () => void; onInterested: (email: string) => void; onNot: () => void; busy: boolean }) {
  const [email, setEmail] = useState("");
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  return (
    <Screen
      onBack={back}
      cta={
        <div>
          <Button onClick={() => onInterested(email.trim())} disabled={!ok || busy}>{busy ? "Sending…" : "I’m interested"}</Button>
          <Button quiet onClick={onNot}>I&rsquo;m not interested</Button>
        </div>
      }
    >
      <div>
        <Title className="long">Not this round &mdash;<br />but maybe<br />the next.</Title>
        <Lead>We can still count you into our later round of the alpha. Once we support Android or a non-US-based program, we&rsquo;ll reach out to you.</Lead>
        <div className="mt-1.5">
          <Field id="later_email" label="Your email, so we can reach you" value={email} onChange={setEmail} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" />
        </div>
      </div>
    </Screen>
  );
}

export function SExitYes() {
  return <Screen><div className="end-copy"><p className="flow-kicker">On the list</p><Title>Done.</Title><Lead>We&rsquo;ve added you to our list and will contact you when a suitable opportunity arises.</Lead><p className="signature">&mdash; The Marlo team</p></div></Screen>;
}
export function SExitNo() {
  return <Screen><div className="end-copy"><Title>No worries.</Title><Lead>Thank you anyway.</Lead><p className="signature">&mdash; The Marlo team</p></div></Screen>;
}
export function SAlready() {
  return <Screen><div className="end-copy"><Title>You&rsquo;ve<br />already applied.</Title><Lead>We have your application and we&rsquo;ll be in touch shortly. Something changed? Reply to our email and we&rsquo;ll fix it.</Lead></div></Screen>;
}
export function SError({ retry }: { retry: () => void }) {
  return <Screen cta={<Button onClick={retry}>Try again</Button>}><div className="end-copy"><Title>That didn&rsquo;t<br />go through.</Title><Lead>Something on our side. Your answers are still here &mdash; try once more.</Lead></div></Screen>;
}
