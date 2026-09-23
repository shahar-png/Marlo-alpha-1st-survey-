// Marlo Alpha Program — Participant Agreement. Source of truth for the text is
// 02_Acceptance/alpha-participant-agreement-v1.md; this file is that text, rendered by /waiver and
// baked into every signed PDF. Change the .md first, then this file, then bump VERSION.
// The hash of the text (see waiverHash) is written to the card and the PDF so every signature
// says exactly which wording was signed.

export const WAIVER_VERSION = "v2 · 23 Sep 2026";
export const COMPANY = "OliHealth Inc.";
export const SIGNER = { name: "Shahar Cohen", title: "Founder" };
export const CAP = "$200";

export type Block = { kind: "p"; text: string } | { kind: "ul"; items: string[] };
export type Section = { n: number; title: string; blocks: Block[] };

const p = (text: string): Block => ({ kind: "p", text });
const ul = (...items: string[]): Block => ({ kind: "ul", items });

export const WAIVER: Section[] = [
  {
    n: 1,
    title: "The program",
    blocks: [
      p(`This agreement is between you and ${COMPANY} ("Marlo," "we," "us") for your participation in the Marlo alpha program (the "Program").`),
      p("The Program runs for up to three months from the day you receive Marlo's contact. It is a testing program for an early version of the Marlo service, and its purpose is to help us learn how the service works in real life."),
      p("This agreement covers one participant: you. It can't be transferred or shared."),
      p("Either of us can end your participation at any time, for any reason, by letting the other know. If that happens, section 2 explains what happens to open orders."),
    ],
  },
  {
    n: 2,
    title: "What Marlo covers",
    blocks: [
      p(`During the Program, we cover the cost of supplements that Marlo orders for you, up to ${CAP} per month. This is the only benefit of the Program. There is no cash payment, and we don't reimburse anything you buy elsewhere.`),
      p("Orders are placed by Marlo, at the brand's or retailer's own price, and shipped to the address you give us. You don't need a credit card."),
      p(`Once the ${CAP} monthly limit is reached, you can keep using Marlo, but any further orders that month are at your own cost and only if you approve them.`),
      p("If your participation ends early — by you or by us — we'll cancel any order that hasn't shipped. Anything already shipped is yours to keep."),
    ],
  },
  {
    n: 3,
    title: "What you agree to",
    blocks: [
      p("By joining the Program, you confirm that you are at least 18 years old, live in the United States, and use an iPhone."),
      p("You agree to:"),
      ul(
        "Use Marlo as your real supplement service for the length of the Program — roughly four short sessions a week.",
        "Order all your supplements through Marlo during the Program.",
        "Join a 30-minute video call with us each week.",
        "Give honest feedback in the thread and on the calls.",
        "Give Marlo accurate information about what you take, including any prescription medication, so it can check for interactions.",
      ),
      p("If you stop taking part — no sessions, no calls, no replies for more than two weeks — we may end your participation under section 1."),
    ],
  },
  {
    n: 4,
    title: "Not medical advice",
    blocks: [
      p("Marlo is a supplement service, not a doctor, pharmacist, or licensed health provider. Nothing Marlo says — about supplements, interactions, lab results, or your health — is medical advice, diagnosis, or treatment."),
      p("You stay responsible for your own health decisions. Before starting, stopping, or changing any supplement, and especially if you take prescription medication, are pregnant or nursing, or have a medical condition, talk to your doctor."),
      p("Marlo will never tell you to start, stop, or change a prescription. If Marlo flags something in your labs, that's a reason to see a clinician, not a substitute for one."),
      p("Dietary supplements have not been evaluated by the Food and Drug Administration and are not intended to diagnose, treat, cure, or prevent any disease."),
    ],
  },
  {
    n: 5,
    title: "Alpha software",
    blocks: [
      p("Marlo is an early, unfinished version of the service. Things will break. It may give wrong answers, miss a reminder, place an order late or incorrectly, or stop responding for a while. Features may change or disappear during the Program."),
      p("We provide Marlo \"as is,\" with no promises about availability, accuracy, or results. In particular, we don't promise that any supplement, protocol, or recommendation will have any effect on your health."),
      p("Please double-check anything that matters — a dose, an order, an interaction — and tell us when something looks wrong. That's part of the point."),
    ],
  },
  {
    n: 6,
    title: "Your data",
    blocks: [
      p("To run the Program, we collect and store:"),
      ul(
        "Your contact details and shipping address.",
        "What you tell Marlo, and the conversation itself, including feedback you send with /.",
        "Documents you share, such as lab reports or a photo of what you take.",
        "Your orders and reorders.",
        "Data from accounts you choose to connect, only where it's relevant to your supplements: Email — lab results, order confirmations, and shipping updates; we don't read or keep anything else. Calendar — travel and training, so Marlo can adjust reminders and reorders. Health records — MyChart, Apple Health Records, or similar: lab results and medication lists. Wearables — Oura, Whoop, Apple Health, Garmin, or similar: sleep, training, and recovery.",
      ),
      p("Connecting any account is optional and always asked for separately."),
      p("We use this only to run your protocol, run the Program, and improve Marlo. We don't sell it, and we don't share it with anyone outside the company."),
      p("Some of what you share is health information. By joining, you consent to us collecting and using it for these purposes."),
      p("You can see what Marlo knows about you and correct it at any time. If you leave the Program, you can ask us to delete your data and we will, apart from records we're required to keep by law."),
    ],
  },
  {
    n: 7,
    title: "Confidentiality",
    blocks: [
      p("During the Program you'll see things that aren't public: unreleased features, prototypes, ideas, plans, and how Marlo works behind the scenes. Please keep them inside the Program. Don't share screenshots, recordings, or descriptions of them publicly or with anyone outside the Program, until we've released them or told you it's fine."),
      p("This doesn't stop you from telling people you're in the Marlo alpha, or from describing your own experience in general terms once the Program ends."),
      p("We keep your side too: what you tell us stays inside the company, as set out in section 6."),
    ],
  },
  {
    n: 8,
    title: "Feedback",
    blocks: [
      p("Everything you tell us during the Program — comments, ideas, suggestions, wish-list items, reactions to what we show you — is feedback we can use freely to build and improve Marlo, without owing you anything beyond what's in section 2 and without needing to credit you."),
      p("We may quote your feedback internally and, if we ever want to use it publicly (for example, a testimonial), we'll ask you first."),
    ],
  },
  {
    n: 9,
    title: "Release of liability",
    blocks: [
      p(`You take part in the Program at your own risk. To the fullest extent the law allows, you release ${COMPANY}, its founders, employees, and partners from any claim, loss, or damage arising from your participation — including from using Marlo, relying on anything it says, taking or not taking any supplement it orders or recommends, or any error, delay, or failure of the service.`),
      p("Nothing in this section limits liability that can't be limited by law, including for gross negligence or willful misconduct."),
      p("This agreement is governed by the laws of the State of Delaware, and any dispute will be handled in the courts of that state."),
    ],
  },
  {
    n: 10,
    title: "Agreement",
    blocks: [
      p("By signing, you confirm that you've read this agreement, understand it, and agree to it."),
      p("You agree to sign electronically. Your typed name, your signature as drawn or typed on this page, and the time, network address and device recorded with them are your signature on this agreement, with the same effect as a signature on paper. You'll receive a copy by email, and you can ask us for one at any time."),
    ],
  },
];

/** Plain text of the agreement — what gets hashed. */
export function waiverPlainText(): string {
  return [
    `Marlo Alpha Program — Participant Agreement (${WAIVER_VERSION})`,
    ...WAIVER.flatMap((s) => [`${s.n}. ${s.title}`, ...s.blocks.map((b) => (b.kind === "p" ? b.text : b.items.map((i) => `- ${i}`).join("\n")))]),
  ].join("\n\n");
}
