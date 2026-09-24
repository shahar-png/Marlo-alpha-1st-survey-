"use client";
import React, { useEffect, useRef, useState } from "react";
import { Wordmark, BrandIcon } from "./survey-one-ui";
import {
  EMPTY2,
  LABEL,
  PAINS,
  TOP_PAINS,
  PAIN_LEVELS,
  PARTS,
  type Answers2,
  type Q,
} from "@/lib/survey2";
import {
  buildFlow,
  CHAPTER_NAMES,
  cleanAnswers,
  EMPTY_PROFILE,
  isComplete,
  optionsFor,
  PRIORITIES,
  restoreAnswers,
  validItem,
  type Priority,
  type Profile,
  type Wearable,
} from "@/lib/survey2-flow";
import { cleanContext } from "@/lib/survey2-context";
import Insight, { Action, Arrow, LOOKS, PageLayout } from "./survey-two-insights";
import SurveyRanking from "./survey-ranking";
import { STAGING } from "@/lib/staging-mode";
import "./survey-two-story.css";
import "./survey-two-refinements.css";
import "./survey-two-mobile.css";

type Run = {
  page: string;
  answers: Answers2;
  profile: Profile;
  priorityOrder: Priority[];
};
const fresh = (): Run => ({
  page: "intro",
  answers: structuredClone(EMPTY2),
  profile: { ...EMPTY_PROFILE },
  priorityOrder: Object.keys(PRIORITIES) as Priority[],
});
const draftKey = (email: string) => "marlo-deep-dive-story-v1:" + email;
type SetAnswer = <K extends keyof Answers2>(key: K, value: Answers2[K]) => void;
function Question({ q, a, set }: { q: Q; a: Answers2; set: SetAnswer }) {
  const value = a[q.id as keyof Answers2];
  return (
    <>
      <h2 className="quiz-form-title" data-long={q.text.length > 100}>
        {q.text}
      </h2>
      {q.note && <p className="question-note">{q.note}</p>}
      <fieldset className="recap-options quiz-options" data-layout={["years", "count_now", "count_peak", "testing", "spend"].includes(q.id) ? "boxes" : "rows"}>
        <legend className="rank-live">{q.text}</legend>
        {q.kind === "multi" && (
          <p className="quiz-instruction">
            Choose all that apply. {q.optional ? "Optional." : ""}
          </p>
        )}
        {q.kind === "scale" ? (
          <>
            <div className="quiz-scale">
              {Array.from(
                { length: q.max - q.min + 1 },
                (_, i) => i + q.min,
              ).map((n) => (
                <label key={n}>
                  <input
                    type="radio"
                    name={q.id}
                    value={n}
                    checked={value === n}
                    onChange={() => set("confidence", n)}
                    aria-label={`${n} out of ${q.max}`}
                  />
                  <span>{n}</span>
                </label>
              ))}
            </div>
            <div className="quiz-scale-ends">
              <span>{q.low}</span>
              <span>{q.high}</span>
            </div>
          </>
        ) : (
          optionsFor(q, a).map((o) => (
            <label className="recap-option" key={o.id}>
              <input
                type={q.kind === "multi" ? "checkbox" : "radio"}
                name={q.id}
                value={o.id}
                checked={
                  Array.isArray(value) ? value.includes(o.id) : value === o.id
                }
                onChange={() => {
                  let next: string | string[] = o.id;
                  if (q.kind === "multi") {
                    const cur = value as string[];
                    next = cur.includes(o.id)
                      ? cur.filter((x) => x !== o.id)
                      : ["no", "none"].includes(o.id)
                        ? [o.id]
                        : [
                            ...cur.filter((x) => !["no", "none"].includes(x)),
                            o.id,
                          ];
                  }
                  set(q.id as keyof Answers2, next);
                }}
              />
              <span>{o.label}</span>
            </label>
          ))
        )}
      </fieldset>
      {q.kind === "multi" &&
        q.other &&
        Array.isArray(value) &&
        value.includes("other") && (
          <label className="quiz-field">
            Anything you’d like to add? <small>(optional)</small>
            <textarea
              maxLength={500}
              name={q.other}
              value={a.stop_why_other}
              onChange={(e) => set("stop_why_other", e.target.value)}
            />
          </label>
        )}
      {q.id === "confidence" && (
        <p className="quiz-demo">
          A starting point, not a score. We’ll ask again at the end of the
          program.
        </p>
      )}
    </>
  );
}
function Pain({
  group,
  a,
  set,
}: {
  group: number;
  a: Answers2;
  set: SetAnswer;
}) {
  return (
    <>
      <h2>
        {
          [
            "Your daily routine.",
            "The guesswork.",
            "The big questions.",
            "The real-life bits.",
          ][group]
        }
      </h2>
      <p className="quiz-instruction">
        How much does each one bother you? One tap per line.
      </p>
      {PAINS.slice(group * 3, group * 3 + 3).map((p) => (
        <fieldset className="quiz-pain" key={p.id}>
          <legend>
            {p.label.split(" — ")[0]}
            <small>{p.label.split(" — ")[1]}</small>
          </legend>
          <div className="quiz-pain-options">
            {PAIN_LEVELS.map((l) => (
              <label key={l.id}>
                <input
                  type="radio"
                  name={"pain-" + p.id}
                  value={l.id}
                  checked={a.pains[p.id] === l.id}
                  onChange={() => set("pains", { ...a.pains, [p.id]: l.id })}
                />
                <span>{l.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </>
  );
}
function Priorities({ order, set }: { order: Priority[]; set: (order: Priority[]) => void }) {
  return <>
    <p className="recap-caption">Your next chapter starts here.</p>
    <h2>What matters most?</h2>
    <p className="rank-intro">Put your highest priority at the top.</p>
    <SurveyRanking order={order} options={Object.entries(PRIORITIES).map(([id,label]) => ({id,label}))}
      onChange={order => set(order as Priority[])} label="Your priorities, highest first" />
    <p className="rank-instructions">Hold the six dots, then drag. Highest priority first.</p>
  </>;
}
export default function SurveyTwoStory({
  participantId,
}: {
  participantId: string;
}) {
  const [run, setRun] = useState<Run>(fresh),
    [email, setEmail] = useState(""),
    [identity, setIdentity] = useState(""),
    [firstName, setFirstName] = useState("");
  const [editingReview, setEditingReview] = useState(false);
  const [loading, setLoading] = useState(Boolean(participantId) && !STAGING),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [replay, setReplay] = useState(0),
    [wearableView, setWearableView] = useState<Wearable>("apple_watch");
  const requestBusy = useRef(false),
    formRef = useRef<HTMLFormElement>(null),
    stageRef = useRef<HTMLDivElement>(null),
    swipe = useRef<{ x: number; y: number } | null>(null);
  const { page, answers: a, profile, priorityOrder } = run,
    flow = buildFlow(a),
    item = flow.find((x) => x.id === page),
    index = flow.findIndex((x) => x.id === page),
    isInsight = item?.type === "insight",
    look = isInsight ? LOOKS[page] : null;
  useEffect(() => {
    if (!participantId || STAGING) return;
    const controller = new AbortController();
    fetch("/api/participant?p=" + encodeURIComponent(participantId), {
      signal: controller.signal,
    })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setEmail(data.email || "");
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [participantId]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    stageRef.current?.querySelector(".page-body")?.scrollTo(0, 0);
    stageRef.current?.focus({ preventScroll: true });
  }, [page]);
  useEffect(() => {
    if (STAGING || !identity || ["intro", "done", "close"].includes(page)) return;
    try {
      sessionStorage.setItem(draftKey(identity), JSON.stringify(run));
    } catch {}
  }, [run, identity, page]);
  const go = (id: string) => {
    setError("");
    setRun((prev) => ({ ...prev, page: id }));
  };
  const set: SetAnswer = (key, value) =>
    setRun((prev) => ({
      ...prev,
      answers: cleanAnswers({ ...prev.answers, [key]: value }),
    }));
  const returnToSummary = () => { setEditingReview(false); go("review"); };
  const editFromSummary = (id: string) => { setEditingReview(true); go(id); };
  const next = () => {
    if (editingReview && item && validItem(item, a)) { returnToSummary(); return; }
    if (item && validItem(item, a) && flow[index + 1]) go(flow[index + 1].id);
  };
  const back = () => {
    if (page === "edit") go("profile");
    else if (flow[index - 1]) go(flow[index - 1].id);
  };
  async function identify() {
    if (requestBusy.current || !formRef.current?.reportValidity()) return;
    requestBusy.current = true;
    setLoading(true);
    setError("");
    const normalized = email.trim().toLowerCase();
    try {
      const query = new URLSearchParams({ email: normalized });
      if (participantId) {
        query.set("p", participantId);
        query.set("include", "profile");
      }
      const res = await fetch("/api/participant?" + query);
      if (res.status === 404) {
        setError(
          "This email is not in our system. Please reach out to the program manager.",
        );
        return;
      }
      if (!res.ok) throw new Error("lookup");
      const data = await res.json();
      setFirstName(data.first_name || "");
      setIdentity(normalized);
      if (data.done) {
        try {
          sessionStorage.removeItem(draftKey(normalized));
        } catch {}
        setRun({ ...fresh(), page: "done" });
        return;
      }
      let initial = {
        ...fresh(),
        page: "profile",
        profile: { ...EMPTY_PROFILE, ...data.profile },
      };
      try {
        const raw = STAGING ? null : sessionStorage.getItem(draftKey(normalized));
        if (raw) {
          const saved = JSON.parse(raw),
            context = cleanContext(saved);
          const answers = restoreAnswers(saved.answers);
          initial = {
            page:
              buildFlow(answers).some((x) => x.id === saved.page) &&
              saved.page !== "intro"
                ? saved.page
                : "profile",
            answers,
            profile: context?.profile || initial.profile,
            priorityOrder: context?.priorityOrder || initial.priorityOrder,
          };
        }
      } catch {}
      setRun(initial);
    } catch {
      setError("Something on our side — try once more.");
    } finally {
      requestBusy.current = false;
      setLoading(false);
    }
  }
  async function submit() {
    if (requestBusy.current || !isComplete(a) || !identity) return;
    requestBusy.current = true;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/deep-dive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          p: participantId,
          email: identity,
          answers: cleanAnswers(a),
          context: { priorityOrder, profile },
        }),
      });
      if (res.status === 404) {
        setError(
          "We couldn’t find your application. Please contact the program manager. Your answers are still here.",
        );
        return;
      }
      if (!res.ok && res.status !== 409) throw new Error("submit");
      try {
        sessionStorage.removeItem(draftKey(identity));
      } catch {}
      go(res.status === 409 ? "done" : "close");
    } catch {
      setError(
        "That didn’t go through. Your answers are still here — please try again.",
      );
    } finally {
      requestBusy.current = false;
      setBusy(false);
    }
  }
  const inChapter = flow.filter((x) =>
    item?.chapter !== undefined
      ? x.chapter === item.chapter
      : ["intro", "profile", "priority", "insight"].includes(x.id),
  );
  const count =
    page === "review"
      ? "Review"
      : page === "edit"
        ? "Your details"
        : String(inChapter.findIndex((x) => x.id === page) + 1).padStart(
            2,
            "0",
          ) +
          " / " +
          String(inChapter.length).padStart(2, "0");
  const nav = (
    <nav className="recap-footer" aria-label="Quiz navigation">
      <div className="recap-footer-left">
        <button
          className="recap-nav"
          data-back
          type="button"
          aria-label="Back"
          onClick={back}
          disabled={busy}
        >
          <Arrow back />
          <span className="quiz-back-label">Back</span>
        </button>
        <span className="recap-count">{count}</span>
      </div>
      <span className="recap-swipe">
        {item?.chapter !== undefined
          ? CHAPTER_NAMES[item.chapter]
          : page === "priority"
            ? "Highest priority first"
            : page === "review"
              ? "Your personal brief"
              : "Your starting point"}
      </span>
    </nav>
  );
  const nextInSection = editingReview && item?.chapter !== undefined
    ? flow.slice(index + 1).find(x => x.chapter === item.chapter && x.type !== "insight") : undefined;
  const terminal = ["done", "close"].includes(page);
  let content: React.ReactNode;
  if (page === "intro")
    content = (
      <div className="opening opening-run" key={replay}>
        <div className="opening-stage">
          <div className="opening-arrival" aria-hidden="true">
            <div className="opening-dots">
              <span />
              <span />
              <span />
            </div>
            <div className="opening-mark">
              <BrandIcon className="recap-symbol" />
            </div>
          </div>
          <div className="opening-name">
            <Wordmark className="recap-wordmark" />
          </div>
          <div className="opening-copy">
            <h2>
              Welcome
              <br />
              back.
            </h2>
            <p>Tell us a little more about you.</p>
          </div>
        </div>
        <form
          ref={formRef}
          className="opening-form"
          onSubmit={(e) => {
            e.preventDefault();
            void identify();
          }}
        >
          <label className="quiz-field">
            Your email
            <input
              type="email"
              name="email"
              required
              maxLength={120}
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="you@example.com"
              aria-describedby="opening-email-help"
              disabled={loading}
            />
          </label>
          <p id="opening-email-help" className="opening-help">
            {STAGING ? "QA preview: use any valid email. You’ll see a fictional profile." : "Use the email from your first survey."}
          </p>
          {error && (
            <p role="alert" className="quiz-error">
              {error}
            </p>
          )}
          <Action type="submit" disabled={loading}>
            {loading ? "One moment…" : "Continue"}
          </Action>
        </form>
        <button
          type="button"
          className="opening-replay"
          onClick={() => setReplay((n) => n + 1)}
        >
          Replay intro
        </button>
      </div>
    );
  else if (page === "profile")
    content = (
      <>
        <p className="recap-greeting">Hey{firstName ? ", " + firstName : ""}.</p>
        <h1>
          What we know
          <br />
          about you.
        </h1>
        <ul className="recap-facts">
          {[
            ["Your focus", profile.goal],
            ["Your stack", profile.stack],
            ["Your rhythm", profile.routine],
          ].map(([label, value], i) => (
            <li key={label}>
              <span className="fact-no">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <small>{label}</small>
                <strong>{value || "Let’s fill this in together."}</strong>
              </div>
            </li>
          ))}
        </ul>
        {profile.ageBand && (
          <p className="quiz-demo">Age group: {profile.ageBand}</p>
        )}
        <Action onClick={next}>That’s me. Let’s go.</Action>
        <button className="recap-secondary" onClick={() => go("edit")}>
          Update my details
        </button>
      </>
    );
  else if (page === "edit")
    content = (
      <form className="recap-edit"
        onSubmit={(e) => {
          e.preventDefault();
          go("profile");
        }}
      >
        <PageLayout><h2>Anything to update?</h2>
        <p>Update anything that has changed. All fields are optional.</p>
        {(
          [
            ["age", "Your age"],
            ["goal", "Your focus"],
            ["stack", "Your supplements"],
            ["routine", "Your routine"],
          ] as const
        ).map(([key, label]) => (
          <label className="quiz-field" key={key}>
            {label}
            <input
              type={key === "age" ? "number" : "text"}
              min={key === "age" ? 18 : undefined}
              max={key === "age" ? 99 : undefined}
              step={key === "age" ? 1 : undefined}
              maxLength={key === "stack" ? 500 : 200}
              value={profile[key]}
              onChange={(e) =>
                setRun((prev) => ({
                  ...prev,
                  profile: { ...prev.profile, [key]: e.target.value },
                }))
              }
            />
          </label>
        ))}
        <Action type="submit">Save details</Action></PageLayout>
      </form>
    );
  else if (page === "priority")
    content = (
      <>
        <Priorities
          order={priorityOrder}
          set={(order) => setRun((prev) => ({ ...prev, priorityOrder: order }))}
        />
        <Action onClick={next}>{editingReview ? "Save & return to summary" : "This is my order"}</Action>
      </>
    );
  else if (isInsight)
    content = (
      <Insight
        id={page}
        a={a}
        profile={profile}
        priority={priorityOrder[0]}
        wearableView={wearableView}
        setWearableView={setWearableView}
        next={next}
        adjust={() => go("priority")}
      />
    );
  else if (item?.q || item?.type === "top" || item?.type === "pain") {
    const q = item.q;
    content = (
      <>
        {item.type === "top" ? <>
          <h2>What gets in your way most?</h2>
          <p className="rank-intro">Hold the dots to rank. Biggest frustration first.</p>
          <SurveyRanking compact order={a.pain_priority} options={TOP_PAINS} label="Your frustrations, biggest first"
            onChange={order => set("pain_priority", order)} />
        </> : q ? (
          <Question q={q} a={a} set={set} />
        ) : (
          <Pain group={item.group!} a={a} set={set} />
        )}
        <Action onClick={next} disabled={!validItem(item, a)}>
          {editingReview ? "Save & return to summary" : item.type === "top" ? "Save my order" : q &&
          "optional" in q &&
          q.optional &&
          !(a[q.id as keyof Answers2] as string[]).length
            ? "Skip for now"
            : "Continue"}
        </Action>
        {nextInSection && <button className="recap-secondary" type="button" disabled={!validItem(item, a)} onClick={() => go(nextInSection.id)}>Next question in this section</button>}
      </>
    );
  } else if (page === "review")
    content = (
      <>
        <h2>
          Your story,
          <br />
          together.
        </h2>
        <p className="quiz-summary-caption">Take a look before finishing.</p>
        <ul className="quiz-recap">
          {[
            ["Your first priority", PRIORITIES[priorityOrder[0]], "priority"],
            [
              "Your main friction",
              TOP_PAINS.find(p => p.id === a.top_pain)?.label || "No listed friction",
              flow.some(x => x.id === "top_pain") ? "top_pain" : "pain-0",
            ],
            [
              "Your monthly spend",
              LABEL.spend[a.spend] || "Not answered yet",
              "spend",
            ],
            [
              "Your confidence",
              a.confidence ? `${a.confidence} out of 5` : "Not answered yet",
              "confidence",
            ],
          ].map(([label, value, target]) => (
            <li key={label}>
              <div>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
              <button onClick={() => editFromSummary(target)} aria-label={"Edit " + label}>
                Edit
              </button>
            </li>
          ))}
        </ul>
        <div className="quiz-review-links">
          {PARTS.map((p, i) => (
            <button
              key={p.key}
              onClick={() => editFromSummary(flow.find((x) => x.chapter === i)!.id)}
            >
              <span>{CHAPTER_NAMES[i]}</span>
              <small>
                {flow
                  .filter((x) => x.chapter === i)
                  .every((x) => validItem(x, a))
                  ? "Done"
                  : "Needs answers"}
              </small>
              <Arrow />
            </button>
          ))}
        </div>
        {error && (
          <p className="quiz-error" role="alert">
            {error}
          </p>
        )}
        <Action
          onClick={() =>
            isComplete(a)
              ? void submit()
              : editFromSummary(flow.find((x) => !validItem(x, a))!.id)
          }
          disabled={busy}
        >
          {busy
            ? "Sending…"
            : isComplete(a)
              ? "Finish my story"
              : "Fill in missing answers"}
        </Action>
      </>
    );
  else
    content =
      page === "done" ? (
        <>
          <h2>
            You’ve already
            <br />
            done this one.
          </h2>
          <p>
            We have your answers. Something changed? Tell us on your first call.
          </p>
        </>
      ) : (
        <>
          <h2>{STAGING ? "QA run complete." : "That’s so you."}</h2>
          <p>
            {STAGING ? "You’ve reached the end. No answers were saved or sent. Refresh to start a new test." : <>Thanks{firstName ? ", " + firstName : ""}. This is what lets Marlo start already knowing you.</>}
          </p>
          {!STAGING && <p>
            Next: your first call. If you haven’t booked it yet, the link is in
            your “You’re in” email.
          </p>}
          <p>
            See you there.
            <br />— The Marlo team
          </p>
          {!STAGING && process.env.NEXT_PUBLIC_BOOKING_URL && (
            <a
              className="recap-main"
              href={process.env.NEXT_PUBLIC_BOOKING_URL}
            >
              Pick a time
              <Arrow />
            </a>
          )}
        </>
      );
  return (
    <div
      id="marlo-recap"
      data-staging={STAGING}
      data-screen={page}
      data-palette="electric"
      data-opening={page === "intro"}
      data-motion="true"
      data-presentation={isInsight ? "insight" : "quiz"}
      data-insight={isInsight ? page : ""}
    >
      {STAGING && <span className="stage-tag" title="Fictional profile · Refresh to reset · Nothing is saved">STAGING</span>}
      <div className="recap-app">
        {page !== "intro" && (
          <div
            className="recap-progress"
            role="progressbar"
            aria-label="Survey progress"
            aria-valuemin={0}
            aria-valuemax={10}
            aria-valuenow={
              terminal || page === "review" ? 10 : (item?.chapter ?? 0)
            }
          >
            {PARTS.map((p, i) => (
              <span
                key={p.key}
                className={
                  terminal || page === "review" || (item?.chapter ?? -1) > i
                    ? "done"
                    : item?.chapter === i
                      ? "active"
                      : ""
                }
              />
            ))}
          </div>
        )}
        <div className="recap-stage" ref={stageRef} tabIndex={-1}>
          <div
            className="recap-peek"
            aria-hidden="true"
            style={look ? { background: look.accent } : undefined}
          />
          <article
            key={page}
            className="recap-card"
            data-presentation={isInsight ? "insight" : "quiz"}
            data-insight={isInsight ? page : ""}
            data-tone={look?.dark ? "ink" : "paper"}
            style={
              look
                ? ({
                    "--surface": look.bg,
                    "--text": look.text,
                    "--accent": look.accent,
                  } as React.CSSProperties)
                : undefined
            }
            onPointerDown={(e) => {
              if (
                !isInsight ||
                (e.target as HTMLElement).closest("button,input,a,details")
              )
                return;
              swipe.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => {
              const start = swipe.current;
              swipe.current = null;
              if (!start) return;
              const dx = e.clientX - start.x,
                dy = e.clientY - start.y;
              if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.4) {
                if (dx < 0) next();
                else back();
              }
            }}
            onPointerCancel={() => {
              swipe.current = null;
            }}
          >
            <header className="recap-brand">
              <Wordmark className="recap-wordmark" />
              <BrandIcon className="recap-symbol" />
            </header>
            {!isInsight && page !== "intro" && !terminal && nav}
            {editingReview && <div className="review-edit-bar"><span>Editing your answers</span><button type="button" onClick={returnToSummary}>Back to summary</button></div>}
            <main data-density={item?.q && "options" in item.q && item.q.options.length >= 6 ? "dense" : "normal"} className={`recap-page quiz-page${terminal ? " quiz-complete" : ""}`}>
              {page === "intro" || page === "edit" || isInsight ? content : <PageLayout>{content}</PageLayout>}
            </main>
          </article>
        </div>
        {isInsight && nav}
        {identity && !terminal && page !== "intro" && (
          <p className="recap-note">
            Your progress stays in this tab. Your answers are sent when you
            finish.
          </p>
        )}
      </div>
    </div>
  );
}
