"use client";
import React from "react";
import { Screen, Title, Lead, Label, Button, Chip, Field, TextArea } from "./ui";
import { AGE_BANDS, SEX, DEVICE, COUNTRY, FIT, FREQUENCY, SUPPLEMENTS, type Answers, firstName } from "@/lib/copy";

type Common = {
  a: Answers;
  set: <K extends keyof Answers>(k: K, v: Answers[K]) => void;
  next: () => void;
  back: () => void;
  step: number;
  total: number;
};

/* 1 · Meet Marlo — Marlo's voice */
export function S1Meet({ next }: Pick<Common, "next">) {
  return (
    <Screen cta={<Button onClick={next}>Next</Button>}>
      <div className="flex-1 flex flex-col justify-center py-8">
        <Title className="text-[40px] leading-[1.05] mb-5">Meet Marlo.</Title>
        <Lead className="mb-8">
          I&rsquo;m a contact in your phone. A supplement expert and your concierge in one, built by leading longevity scientists and backed by science. This is the place to talk about supplements and health — and what&rsquo;s right for you. I know your labs, your goals, your routine, and I work only for you. And I don&rsquo;t just advise, I act: I buy, I reorder, I follow up, on your behalf.
        </Lead>
        <div className="space-y-5 text-[16px] leading-[1.45]">
          <p><span className="font-semibold text-ink">I help you discover what you actually need.</span> <span className="text-ink-2">From your labs, your tests, your goals. The answer, and the why.</span></p>
          <p><span className="font-semibold text-ink">I buy for you.</span> <span className="text-ink-2">Before you run out, at member prices. One tap.</span></p>
          <p><span className="font-semibold text-ink">I remind you.</span> <span className="text-ink-2">Your times, adjusted to your life.</span></p>
          <p><span className="font-semibold text-ink">I tell you what&rsquo;s working.</span> <span className="text-ink-2">And what isn&rsquo;t.</span></p>
        </div>
        <p className="mt-8 text-[17px] font-medium text-ink">You make the calls. I do the work.</p>
      </div>
    </Screen>
  );
}

/* 2 · The deal — company voice */
export function S2Deal({ next, back }: Pick<Common, "next" | "back">) {
  return (
    <Screen
      onBack={back}
      cta={
        <div>
          <Button onClick={next}>I&rsquo;m in</Button>
          <p className="mt-3 text-center text-[13px] text-ink-3">iPhone · US-based · 18+</p>
        </div>
      }
    >
      <div className="flex-1 flex flex-col justify-center py-8">
        <Title className="text-[36px] mb-8">The deal.</Title>
        <div className="space-y-6 text-[16px] leading-[1.5]">
          <p><span className="font-semibold text-ink">What you get.</span> <span className="text-ink-2">Three months of Marlo, with your protocol covered. Marlo orders your supplements; we pay for them. You get its full attention the whole way.</span></p>
          <p><span className="font-semibold text-ink">What we ask.</span> <span className="text-ink-2">Use Marlo for real. A 30-minute call with us each week. Honest feedback, the good and the bad. That&rsquo;s it.</span></p>
          <p><span className="font-semibold text-ink">Why.</span> <span className="text-ink-2">You&rsquo;re one of the first. What you tell us shapes what Marlo becomes.</span></p>
        </div>
      </div>
    </Screen>
  );
}

/* 3 · Contact */
export function S3Contact({ a, set, next, back, step, total }: Common) {
  const phoneDigits = a.phone.replace(/\D/g, "");
  const phoneOk = phoneDigits.length === 10;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a.email.trim());
  const nameOk = a.full_name.trim().split(/\s+/).length >= 2;
  const ready = phoneOk && emailOk && nameOk;
  const fmt = (d: string) => {
    const x = d.slice(0, 10);
    if (x.length <= 3) return x;
    if (x.length <= 6) return `${x.slice(0, 3)} ${x.slice(3)}`;
    return `${x.slice(0, 3)} ${x.slice(3, 6)} ${x.slice(6)}`;
  };
  return (
    <Screen onBack={back} step={step} total={total} cta={<Button onClick={next} disabled={!ready}>Continue</Button>}>
      <Title className="mt-4 mb-6">How do we reach you?</Title>
      <div className="space-y-5">
        <Field id="full_name" label="Full name" value={a.full_name} onChange={(v) => set("full_name", v)} autoComplete="name" placeholder="First and last" />
        <Field
          id="phone"
          label="Mobile number"
          value={fmt(phoneDigits)}
          onChange={(v) => set("phone", v.replace(/\D/g, "").slice(0, 10))}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          prefix="+1"
          placeholder="555 123 4567"
          error={a.phone && !phoneOk ? "Ten digits, US number." : undefined}
        />
        <Field id="email" label="Email" value={a.email} onChange={(v) => set("email", v)} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" error={a.email && !emailOk ? "That doesn't look like an email." : undefined} />
      </div>
    </Screen>
  );
}

/* 4 · About you */
export function S4About({ a, set, next, back, step, total }: Common) {
  const ready = a.age_band && a.sex && a.device && a.country;
  const Row = ({ label, opts, k }: { label: string; opts: readonly { id: string; label: string }[]; k: "age_band" | "sex" | "device" | "country" }) => (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => (
          <div key={o.id} className="w-auto">
            <Chip small active={a[k] === o.id} onClick={() => set(k, o.id)}>{o.label}</Chip>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <Screen onBack={back} step={step} total={total} cta={<Button onClick={next} disabled={!ready}>Continue</Button>}>
      <Title className="mt-4 mb-6">A little about you.</Title>
      <div className="space-y-7">
        <Row label="Age" opts={AGE_BANDS} k="age_band" />
        <Row label="Sex" opts={SEX} k="sex" />
        <Row label="Your phone" opts={DEVICE} k="device" />
        <Row label="Where you live" opts={COUNTRY} k="country" />
      </div>
    </Screen>
  );
}

/* Under-18 stop — the one hard stop inside the survey */
export function SUnder18() {
  return (
    <Screen>
      <div className="flex-1 flex flex-col justify-center py-8">
        <Title className="mb-4">Not yet.</Title>
        <Lead>The Marlo alpha is for adults, so we can&rsquo;t take your application right now. Thanks for your interest — really.</Lead>
      </div>
    </Screen>
  );
}

/* 5 · Who you are */
export function S5Fit({ a, set, next, back, step, total }: Common) {
  const toggle = (id: string) => set("fit", a.fit.includes(id) ? a.fit.filter((x) => x !== id) : [...a.fit, id]);
  const ready = a.fit.length > 0;
  return (
    <Screen onBack={back} step={step} total={total} cta={<Button onClick={next} disabled={!ready}>Continue</Button>}>
      <Title className="mt-4 mb-2">Let&rsquo;s learn more about you and your fit for this program.</Title>
      <Lead className="mb-6 text-[16px]">Which of these sound like you? Pick all that apply.</Lead>
      <div className="space-y-2.5">
        {FIT.map((f) => (
          <div key={f.id}>
            <Chip active={a.fit.includes(f.id)} onClick={() => toggle(f.id)}>
              <span className="font-semibold">{f.title}</span>{f.body ? <span className="text-ink-2"> {f.body}</span> : null}
            </Chip>
            {"text" in f && f.text && a.fit.includes(f.id) ? (
              <TextArea
                id={`fit_${f.id}`}
                placeholder="Tell us more"
                value={f.id === "specific" ? a.fit_specific_text : a.fit_other_text}
                onChange={(v) => set(f.id === "specific" ? "fit_specific_text" : "fit_other_text", v)}
              />
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
      <Title className="mt-4 mb-6">How often do you take supplements?</Title>
      <div className="space-y-2.5">
        {FREQUENCY.map((o) => (
          <Chip key={o.id} active={a.frequency === o.id} onClick={() => set("frequency", o.id)}>{o.label}</Chip>
        ))}
      </div>
    </Screen>
  );
}

/* 7 · What you take */
export function S7Stack({ a, set, next, back, step, total }: Common) {
  const toggle = (id: string) => set("supplements", a.supplements.includes(id) ? a.supplements.filter((x) => x !== id) : [...a.supplements, id]);
  const otherOn = a.supplements.includes("other");
  const ready = a.supplements.length > 0 || a.rx;
  return (
    <Screen onBack={back} step={step} total={total} cta={<Button onClick={next} disabled={!ready}>Continue</Button>}>
      <Title className="mt-4 mb-1">What do you take?</Title>
      <Lead className="mb-6 text-[16px]">Pick everything that&rsquo;s part of your routine.</Lead>
      <Label>Supplements</Label>
      <div className="grid grid-cols-2 gap-2">
        {SUPPLEMENTS.map((s) => (
          <Chip key={s.id} small active={a.supplements.includes(s.id)} onClick={() => toggle(s.id)}>{s.label}</Chip>
        ))}
        <Chip small active={otherOn} onClick={() => toggle("other")}>Other</Chip>
      </div>
      {otherOn ? <TextArea id="supplements_other" placeholder="What else?" value={a.supplements_other} onChange={(v) => set("supplements_other", v)} /> : null}
      <div className="mt-8">
        <Label>Prescriptions</Label>
        <Chip active={a.rx} onClick={() => set("rx", !a.rx)}>I take prescription medication alongside</Chip>
        {a.rx ? <TextArea id="rx_text" placeholder="Which ones? (optional)" value={a.rx_text} onChange={(v) => set("rx_text", v)} /> : null}
      </div>
    </Screen>
  );
}

/* 8 · Close */
export function S8Close({ a }: { a: Answers }) {
  return (
    <Screen>
      <div className="flex-1 flex flex-col justify-center py-8">
        <Title className="text-[36px] mb-6">You&rsquo;re in the queue.</Title>
        <div className="space-y-4 text-[17px] leading-[1.5] text-ink-2">
          <p>Thanks, {firstName(a.full_name) || "there"}. Your application is with the Marlo founders now.</p>
          <p>We&rsquo;re reading every one ourselves, and we&rsquo;ll be in touch shortly with the next step of the program.</p>
          <p>Really glad you&rsquo;re here.</p>
          <p className="text-ink">— The Marlo team</p>
        </div>
      </div>
    </Screen>
  );
}

export function SAlready() {
  return (
    <Screen>
      <div className="flex-1 flex flex-col justify-center py-8">
        <Title className="mb-4">You&rsquo;ve already applied.</Title>
        <Lead>We have your application and we&rsquo;ll be in touch shortly. Something changed? Reply to our email and we&rsquo;ll fix it.</Lead>
      </div>
    </Screen>
  );
}

export function SError({ retry }: { retry: () => void }) {
  return (
    <Screen cta={<Button onClick={retry}>Try again</Button>}>
      <div className="flex-1 flex flex-col justify-center py-8">
        <Title className="mb-4">That didn&rsquo;t go through.</Title>
        <Lead>Something on our side. Your answers are still here — try once more.</Lead>
      </div>
    </Screen>
  );
}
