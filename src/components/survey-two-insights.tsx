import React from "react";
import Image from "next/image";
import { LABEL, type Answers2 } from "@/lib/survey2";
import {
  ageBenchmark,
  PRIORITIES,
  selectedWearables,
  WEARABLES,
  type Profile,
  type Priority,
  type Wearable,
} from "@/lib/survey2-flow";
import { INSIGHT_SOURCES } from "@/lib/survey2-insight-sources";
export const LOOKS: Record<
  string,
  { bg: string; text: string; accent: string; dark: boolean }
> = {
  insight: { bg: "#4144ef", text: "#f2e9dd", accent: "#e6ffb3", dark: true },
  "insight-history": {
    bg: "#f7e478",
    text: "#191918",
    accent: "#294e46",
    dark: false,
  },
  "insight-data": {
    bg: "#bde9df",
    text: "#173e38",
    accent: "#184e47",
    dark: false,
  },
  "insight-decide": {
    bg: "#ff805f",
    text: "#301d3a",
    accent: "#301d3a",
    dark: false,
  },
  "insight-pains2": {
    bg: "#502742",
    text: "#ffe4ec",
    accent: "#ffb6d1",
    dark: true,
  },
  "insight-handover": {
    bg: "#191918",
    text: "#f2e9dd",
    accent: "#c5b6ff",
    dark: true,
  },
  "insight-money": {
    bg: "#d9cdff",
    text: "#27223d",
    accent: "#45402d",
    dark: false,
  },
};
export function Arrow({ back = false }: { back?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={back ? "M19 12H5m7-7-7 7 7 7" : "M6 18 18 6M6 6h12v12"} />
    </svg>
  );
}
export function Action({
  children,
  onClick,
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "submit" | "button";
}) {
  return (
    <div className="recap-actions">
      <button
        className="recap-main"
        type={type}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
        <Arrow />
      </button>
    </div>
  );
}
function Source({
  id,
  extra = "",
}: {
  id: keyof typeof INSIGHT_SOURCES;
  extra?: string;
}) {
  const s = INSIGHT_SOURCES[id];
  return (
    <details className="insight-source">
      <summary>Source: {s.title.split(" · ")[0]}</summary>
      <p>
        {s.detail} {extra}
      </p>
      <a href={s.url} target="_blank" rel="noopener noreferrer">
        Read the research
        <Arrow />
      </a>
    </details>
  );
}
function NumberStat({ n }: { n: number }) {
  return (
    <div className="insight-number">
      {n}
      <span>%</span>
    </div>
  );
}
function Photo({ name, alt }: { name: string; alt: string }) {
  return (
    <div className={"insight-photo insight-photo-" + name}>
      <Image
        src={"/survey-two/" + name + ".jpg"}
        width={850}
        height={567}
        sizes="393px"
        alt={alt}
      />
    </div>
  );
}
function Title({ text }: { text: string }) {
  return (
    <h2 className="insight-title">
      {text.split("\n").map((line, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </React.Fragment>
      ))}
    </h2>
  );
}
export default function Insight({
  id,
  a,
  profile,
  priority,
  wearableView,
  setWearableView,
  next,
  adjust,
}: {
  id: string;
  a: Answers2;
  profile: Profile;
  priority: Priority;
  wearableView: Wearable;
  setWearableView: (k: Wearable) => void;
  next: () => void;
  adjust: () => void;
}) {
  const age = ageBenchmark(profile),
    ids = Object.keys(LOOKS),
    index = ids.indexOf(id) + 1;
  const header = (label: string) => (
    <div className="insight-kicker">
      <span>{label}</span>
      <span>{String(index).padStart(2, "0")} / 07</span>
    </div>
  );
  const end = (source: keyof typeof INSIGHT_SOURCES, extra = "") => (
    <>
      <Source id={source} extra={extra} />
      <Action onClick={next}>Continue</Action>
    </>
  );
  if (id === "insight")
    return (
      <>
        {header("U.S. adults · Health information")}
        <Title text={"LET’S KEEP\nIT SIMPLE."} />
        <div
          className="insight-orbit"
          role="img"
          aria-label="72 percent say clear health information matters"
        >
          <div className="insight-dial">
            <NumberStat n={72} />
          </div>
        </div>
        <p className="insight-stat">
          say it’s important that health information is easy to understand.
        </p>
        <p className="insight-you">
          Your top priority: {PRIORITIES[priority]}. Let’s start there.
        </p>
        <Source id="simple" />
        <Action onClick={next}>Let’s explore your story</Action>
        <button className="recap-secondary" onClick={adjust}>
          Adjust my priorities
        </button>
      </>
    );
  if (id === "insight-history")
    return (
      <>
        {header(age.label)}
        <Title text={"IN GOOD\nCOMPANY."} />
        <div className="insight-history-stat">
          <NumberStat n={age.supplements} />
          <p className="insight-stat">
            of {age.population}
            <br />
            take supplements.
          </p>
        </div>
        <Photo name="coast" alt="Runner on a sunlit coastal path" />
        <p className="insight-you">
          {a.count_now && a.count_now !== "0"
            ? `You take ${LABEL.count_now[a.count_now]} a day. Let’s explore what works for you.`
            : "Everyone’s routine is different. Let’s explore yours."}
        </p>
        {end("supplements")}
      </>
    );
  if (id === "insight-data") {
    const selected = selectedWearables(a);
    if (!selected.length) return null;
    const key = selected.includes(wearableView) ? wearableView : selected[0],
      device = WEARABLES[key];
    return (
      <>
        {header(device.name)}
        {selected.length > 1 && (
          <div
            className="wearable-picker"
            role="group"
            aria-label="Your selected trackers"
          >
            {selected.map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={k === key}
                onClick={() => setWearableView(k)}
              >
                {WEARABLES[k].name}
              </button>
            ))}
          </div>
        )}
        <div aria-live="polite">
          <Title text={device.headline} />
          <Photo name={key} alt={device.alt} />
          {device.smartwatch && (
            <div className="insight-side-stat">
              <NumberStat n={age.watch} />
              <p className="insight-stat">
                of {age.population} own a smartwatch.
              </p>
            </div>
          )}
          <p className="insight-you">{device.body}</p>
          {key === "other" && (
            <p className="wearable-image-note">
              Illustrative image. Your device may look different.
            </p>
          )}
        </div>
        {device.smartwatch && (
          <Source
            id="watch"
            extra={
              "This measures all smartwatch brands, not " +
              device.name +
              " ownership."
            }
          />
        )}
        <Action onClick={next}>Continue</Action>
      </>
    );
  }
  if (id === "insight-decide")
    return (
      <>
        {header(age.label)}
        <p className="insight-sideword" aria-hidden="true">
          ASK. LEARN. REPEAT.
        </p>
        <NumberStat n={age.ai} />
        <Title text={"A NEW KIND\nOF SEARCH."} />
        <p className="insight-stat">
          of {age.population} have used AI chatbots for health questions or
          help.
        </p>
        <div
          className="insight-proportion"
          role="img"
          aria-label={age.ai + " out of 100 adults"}
        >
          <span style={{ width: age.ai + "%" }} />
        </div>
        <p className="insight-you">
          {a.ai === "never"
            ? "You haven’t tried AI for supplements. Where do you turn instead?"
            : "You’ve tried AI for supplements. This number covers all kinds of health questions."}
        </p>
        {end("ai")}
      </>
    );
  if (id === "insight-pains2")
    return (
      <>
        {header("All U.S. adults · Health information")}
        <Title text={"WHAT CAN\nYOU TRUST?"} />
        <div
          className="insight-halves"
          role="img"
          aria-label="50 percent find judging health information accuracy difficult"
        >
          <div>
            <NumberStat n={50} />
          </div>
          <div className="insight-half-label">
            ONE
            <br />
            IN
            <br />
            TWO.
          </div>
        </div>
        <p className="insight-stat">
          find it hard to tell if health information is accurate.
        </p>
        <p className="insight-you">
          {a.top_pain
            ? "What gets in your way: " + LABEL.pains[a.top_pain] + "."
            : "Let’s find out what would make your routine easier."}
        </p>
        {end("clarity")}
      </>
    );
  if (id === "insight-handover")
    return (
      <>
        {header("All U.S. adults · Trust in AI")}
        <Title text={"TRUST.\nON YOUR\nTERMS."} />
        <div className="insight-trust-ticket">
          <span className="insight-ticket-label">Trust takes time</span>
          <NumberStat n={32} />
          <p className="insight-stat">
            would trust AI to read their health records and give information
            based on them.
          </p>
        </div>
        <p className="insight-you">
          {a.handover === "cautious"
            ? "You want proof first. That makes sense."
            : a.handover === "myself" || a.allow.includes("none")
              ? "You want to make the decisions. We’ve noted that."
              : "You’re open to help. You decide how much."}
        </p>
        {end("trust")}
      </>
    );
  return (
    <>
      {header("U.S. adults · Supplement costs")}
      <Title text={"MAKE IT\nWORTH IT."} />
      <NumberStat n={58} />
      <p className="insight-stat">
        say specialty supplements
        <br />
        cost too much.
      </p>
      <div className="insight-budget">
        <span>Your monthly spend</span>
        <strong>{LABEL.spend[a.spend]}</strong>
      </div>
      <p className="insight-you">
        {a.spend_feel === "more"
          ? "You’d like to spend less. Let’s focus on what’s worth keeping."
          : a.spend_feel === "no_idea"
            ? "You’re unsure what you get for your money. Let’s make that clearer."
            : "You feel your supplements are worth it. That matters."}
      </p>
      {end("cost")}
    </>
  );
}
