"use client";
import React, { useState } from "react";
import { Screen, Title, Lead, Label, Button, Chip, Row, Field, TextArea, Ticket } from "./ui";
import { AGE_BANDS, SEX, FIT, FREQUENCY, SUPPLEMENTS, type Answers, firstName } from "@/lib/copy";

type Common = {
  a: Answers;
  set: <K extends keyof Answers>(k: K, v: Answers[K]) => void;
  next: () => void;
  back: () => void;
  step: number;
  total: number;
};

const Line = ({ bold, rest, last }: { bold: string; rest: string; last?: boolean }) => (
  <div className={"py-[13px] border-t border-line text-[17px] leading-[1.42]" + (last ? " border-b" : "")}>
    <span className="font-semibold text-midnight">{bold}</span> <span className="text-slate">{rest}</span>
  </div>
);

/* 1 · Meet Marlo — Marlo's voice */
export function S1Meet({ next }: Pick<Common, "next">) {
  return (
    <Screen cta={<Button onClick={next}>Next</Button>}>
      <Title className="text-[42px] leading-[1.02] mb-4">Meet Marlo<span className="text-salmon">.</span></Title>
      <Lead className="mb-[18px]">
        I&rsquo;m a contact in your phone. A supplement expert and your concierge in one, built by leading longevity scientists and backed by science. Talk to me about supplements, health, and what&rsquo;s right for you. I know your labs, your goals, your routine, and I work only for you. And I don&rsquo;t just advise &mdash; I buy, I reorder, I follow up, on your behalf.
      </Lead>
      <div className="flex flex-col">
        <Line bold="I help you discover what you actually need." rest="From your labs, your tests, your goals." />
        <Line bold="I buy for you." rest="Before you run out, at member prices." />
        <Line bold="I remind you." rest="Your times, adjusted to your life." />
        <Line bold="I tell you what’s working." rest="And what isn’t." last />
      </div>
      <p className="mt-[18px] text-[19px] font-semibold text-midnight">You make the calls. I do the work.</p>
    </Screen>
  );
}

/* 2 · The deal — company voice; the only screen with two buttons */
export function S2Deal({ next, back, exit }: Pick<Common, "next" | "back"> & { exit: () => void }) {
  return (
    <Screen
      onBack={back}
      cta={
        <div className="flex flex-col gap-2.5">
          <Button onClick={next}>I&rsquo;m in</Button>
          <Button quiet onClick={exit}>I don&rsquo;t fit this round</Button>
        </div>
      }
    >
      <Title className="text-[42px] leading-[1.02] mb-[18px]">The deal<span className="text-salmon">.</span></Title>
      <Ticket eyebrow="What you get">
        <p className="m-0 text-[17px] leading-[1.42]">Three months of Marlo, with your protocol covered. Marlo orders your supplements; we pay for them.</p>
      </Ticket>
      <div className="mt-4 py-[14px] border-t border-line text-[17px] leading-[1.42]">
        <span className="font-semibold text-midnight">What we ask.</span> <span className="text-slate">Use Marlo for real. A 30-minute call with us each week. Honest feedback.</span>
      </div>
      <div className="pt-[14px] pb-4 border-t border-b border-line">
        <div className="text-[17px] font-semibold text-midnight mb-2.5">This round is for people who:</div>
        <ul className="m-0 p-0 list-none flex flex-col gap-2 text-[17px] text-midnight">
          {["Use an iPhone", "Live in the US", "Are 18 or older"].map((t) => (
            <li key={t} className="flex items-center gap-2.5"><span className="w-2 h-2 rounded-full bg-salmon shrink-0" />{t}</li>
          ))}
        </ul>
      </div>
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
      <Title className="mb-[22px]">How do we reach you?</Title>
      <div className="flex flex-col gap-5">
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
      <Title className="mb-[22px]">A little about you.</Title>
      <div className="flex flex-col gap-[26px]">
        <div>
          <Label>Age</Label>
          <div className="flex flex-wrap gap-2">{AGE_BANDS.map((o) => <Chip key={o.id} active={a.age_band === o.id} onClick={() => set("age_band", o.id)}>{o.label}</Chip>)}</div>
        </div>
        <div>
          <Label>Sex</Label>
          <div className="flex flex-wrap gap-2">{SEX.map((o) => <Chip key={o.id} active={a.sex === o.id} onClick={() => set("sex", o.id)}>{o.label}</Chip>)}</div>
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
      <Title className="text-[28px] mb-2">Let&rsquo;s learn more about you and your fit.</Title>
      <Lead className="mb-4 text-[16px]">Which of these sound like you? Pick all that apply.</Lead>
      <div className="flex flex-col gap-2.5">
        {FIT.map((f) => (
          <div key={f.id}>
            <Row active={a.fit.includes(f.id)} onClick={() => toggle(f.id)}>
              <span className="font-semibold text-[16px]">{f.title}</span>{f.body ? <span className="text-slate text-[16px]"> {f.body}</span> : null}
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
      <Title className="mb-[22px]">How often do you take supplements?</Title>
      <div className="flex flex-col gap-2.5">
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
      <Title className="mb-1.5">What do you take?</Title>
      <Lead className="mb-4 text-[16px]">Pick everything that&rsquo;s part of your routine.</Lead>
      <Label>Supplements</Label>
      <div className="flex flex-wrap gap-2">
        {SUPPLEMENTS.map((s) => <Chip key={s.id} active={a.supplements.includes(s.id)} onClick={() => toggle(s.id)}>{s.label}</Chip>)}
        <Chip active={otherOn} onClick={() => toggle("other")}>Other</Chip>
      </div>
      {otherOn ? <TextArea id="supplements_other" placeholder="What else?" value={a.supplements_other} onChange={(v) => set("supplements_other", v)} /> : null}
      <div className="mt-5">
        <Label>Prescriptions</Label>
        <Row active={a.rx} onClick={() => set("rx", !a.rx)}>I take prescription medication alongside</Row>
        {a.rx ? <TextArea id="rx_text" placeholder="Which ones? (optional)" value={a.rx_text} onChange={(v) => set("rx_text", v)} /> : null}
      </div>
    </Screen>
  );
}

/* 8 · Close — dark ticket */
export function S8Close({ a }: { a: Answers }) {
  return (
    <Screen>
      <div className="mt-6">
        <Ticket eyebrow="Application received">
          <div className="text-[32px] leading-[1.05] font-semibold tracking-[-0.01em]">You&rsquo;re in the queue<span className="text-salmon">.</span></div>
        </Ticket>
      </div>
      <div className="flex flex-col gap-3.5 mt-6 text-[18px] leading-[1.5]">
        <p className="m-0 text-midnight">Thanks, {firstName(a.full_name) || "there"}. Your application is with the Marlo founders now.</p>
        <p className="m-0 text-slate">We&rsquo;re reading every one ourselves, and we&rsquo;ll be in touch shortly with the next step.</p>
        <p className="m-0 text-slate">Really glad you&rsquo;re here.</p>
        <p className="m-0 mt-1.5 font-semibold text-midnight">&mdash; The Marlo team</p>
      </div>
    </Screen>
  );
}

/* Exit · Later round — from "I don't fit this round" or Under 18 */
export function SExit({ back, onInterested, onNot, busy }: { back: () => void; onInterested: (email: string) => void; onNot: () => void; busy: boolean }) {
  const [email, setEmail] = useState("");
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  return (
    <Screen
      onBack={back}
      cta={
        <div className="flex flex-col gap-2.5">
          <Button onClick={() => onInterested(email.trim())} disabled={!ok || busy}>{busy ? "Sending…" : "I’m interested"}</Button>
          <Button quiet onClick={onNot}>I&rsquo;m not interested</Button>
        </div>
      }
    >
      <div className="mt-4 flex flex-col gap-[18px]">
        <Title>Not this round &mdash; but maybe the next.</Title>
        <p className="m-0 text-[18px] leading-[1.5] text-slate">We can still count you into our later round of the alpha. Once we support Android or a non-US-based program, we&rsquo;ll reach out to you.</p>
        <div className="mt-1.5">
          <Field id="later_email" label="Your email, so we can reach you" value={email} onChange={setEmail} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" />
        </div>
      </div>
    </Screen>
  );
}

export function SExitYes() {
  return (
    <Screen>
      <div className="mt-6">
        <Ticket eyebrow="On the list"><div className="text-[32px] leading-[1.05] font-semibold">Done<span className="text-salmon">.</span></div></Ticket>
      </div>
      <p className="mt-6 text-[18px] leading-[1.5] text-midnight">We&rsquo;ve added you to our list and will contact you when a suitable opportunity arises.</p>
      <p className="mt-3.5 text-[18px] font-semibold">&mdash; The Marlo team</p>
    </Screen>
  );
}

export function SExitNo() {
  return (
    <Screen>
      <div className="mt-[100px]">
        <Title className="mb-3.5">No worries.</Title>
        <p className="m-0 text-[18px] leading-[1.5] text-slate">Thank you anyway.</p>
        <p className="mt-3.5 text-[18px] font-semibold text-midnight">&mdash; The Marlo team</p>
      </div>
    </Screen>
  );
}

export function SAlready() {
  return (
    <Screen>
      <div className="mt-[100px]">
        <Title className="mb-3.5">You&rsquo;ve already applied.</Title>
        <Lead>We have your application and we&rsquo;ll be in touch shortly. Something changed? Reply to our email and we&rsquo;ll fix it.</Lead>
      </div>
    </Screen>
  );
}

export function SError({ retry }: { retry: () => void }) {
  return (
    <Screen cta={<Button onClick={retry}>Try again</Button>}>
      <div className="mt-[100px]">
        <Title className="mb-3.5">That didn&rsquo;t go through.</Title>
        <Lead>Something on our side. Your answers are still here &mdash; try once more.</Lead>
      </div>
    </Screen>
  );
}
