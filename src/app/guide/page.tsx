import type { Metadata } from "next";
import React from "react";

// The Marlo Alpha — Program Guide. Source of truth: 02_Acceptance/program-guide-v1.md (v1, 15 Sep 2026). Copy verbatim; change it there first.
export const metadata: Metadata = { title: "The Marlo alpha — program guide", robots: { index: false, follow: false } };

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-[26px] leading-[1.12] font-semibold tracking-[-0.01em] text-midnight mt-11 mb-4 pt-6 border-t border-line">{children}<span className="text-salmon">.</span></h2>
);
const P = ({ children }: { children: React.ReactNode }) => <p className="m-0 text-[17px] leading-[1.5] text-midnight">{children}</p>;
const B = ({ children }: { children: React.ReactNode }) => <span className="font-semibold text-midnight">{children}</span>;
const Slash = ({ children = "/" }: { children?: React.ReactNode }) => <span className="font-mono font-semibold text-midnight bg-paper border border-line rounded-[6px] px-1.5 py-0.5 text-[15px]">{children}</span>;
const Shot = ({ src, alt, caption }: { src: string; alt: string; caption: string }) => (
  <figure className="m-0 flex flex-col gap-2.5">
    <div className="rounded-[28px] overflow-hidden border border-line bg-black shadow-[0_18px_40px_-24px_rgba(26,26,23,0.45)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={393} height={852} className="block w-full h-auto" loading="lazy" />
    </div>
    <figcaption className="text-[13px] leading-[1.4] text-slate px-1">{caption}</figcaption>
  </figure>
);
const Q = ({ q, children }: { q: string; children: React.ReactNode }) => (
  <div className="py-4 border-t border-line">
    <p className="m-0 mb-1.5 text-[17px] font-semibold text-midnight">{q}</p>
    <p className="m-0 text-[17px] leading-[1.5] text-slate">{children}</p>
  </div>
);

export default function Guide() {
  return (
    <div className="min-h-[100dvh] bg-cream">
      <header className="mx-auto w-full max-w-[560px] px-[22px] pt-4 h-[72px] flex items-center">
        <span className="text-[17px] font-semibold tracking-[0.02em] text-midnight">Marlo<span className="text-salmon">.</span></span>
      </header>
      <main className="mx-auto w-full max-w-[560px] px-[22px] pb-20 fade-up">
        <div className="bg-midnight text-cream rounded-[24px] px-5 py-[22px] flex flex-col gap-2 mt-2">
          <div className="text-[12px] tracking-[0.08em] uppercase text-[#B9B4A6]">The Marlo alpha</div>
          <div className="text-[34px] leading-[1.05] font-semibold tracking-[-0.01em]">Program guide<span className="text-salmon">.</span></div>
          <div className="text-[15px] text-[#B9B4A6] mt-1">Three months. Your stack, covered. Your feedback, built in.</div>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2">
          {[["what-marlo-is", "What Marlo is"], ["the-program", "The program"], ["what-you-get", "What you get"], ["what-we-ask", "What we ask"], ["how-it-runs", "How it runs"], ["feedback", "Feedback"], ["your-data", "Your data"], ["questions", "Questions"]].map(([id, t]) => (
            <a key={id} href={`#${id}`} className="inline-flex items-center h-9 px-3.5 rounded-full bg-paper border border-line text-[14px] font-semibold text-slate hover:border-midnight hover:text-midnight">{t}</a>
          ))}
        </nav>

        <section id="what-marlo-is">
          <H2>What Marlo is</H2>
          <div className="flex flex-col gap-4">
            <P>Marlo lives in your contacts. You save the number and text it, the same way you&rsquo;d text a friend. From then on, it&rsquo;s the one place you go for anything about your supplements &mdash; and it does the work.</P>
            <P><B>You can talk to it.</B> Ask it about your health, your prescriptions, your vitamins, your supplements. What interacts with what. Whether something is right for you. What the evidence says. Marlo answers plainly, with the reasoning, and it says so when the evidence is thin.</P>
            <P><B>It knows you.</B> With your permission, Marlo connects to your data: it reads your lab results, your order history, what you already take, and your wearables &mdash; sleep, training, recovery. It uses that to tell you what you actually need, what&rsquo;s worth adding, and what isn&rsquo;t earning its place. It does the research so you don&rsquo;t have to.</P>
            <P><B>It acts for you.</B> Marlo isn&rsquo;t just an advisor. It buys your supplements before you run out, at member prices. It reminds you at your times, and adjusts when your life changes. It tracks what&rsquo;s working and tells you, including when the answer is &ldquo;drop it.&rdquo; You confirm the calls that matter; Marlo does the rest.</P>
            <P><B>It remembers.</B> Everything you tell it, and every piece of data that matters to managing your supplements &mdash; your labs, your goals, your routine, what you said three weeks ago. You never start over.</P>
            <P><B>It&rsquo;s built to be trusted.</B> Marlo was built by leading longevity experts and draws on clinical and research databases that general AI assistants can&rsquo;t reach. When it tells you something, it&rsquo;s grounded in that, not in a search result.</P>
          </div>
        </section>

        <section id="the-program">
          <H2>What the program is</H2>
          <div className="flex flex-col gap-4">
            <P>The Marlo alpha is a small, hand-picked group of people who take supplements seriously &mdash; and a safe space to test what we&rsquo;re building before it launches.</P>
            <P>We&rsquo;re doing two things with you over three months:</P>
            <P><B>Testing ideas.</B> We&rsquo;ll show you concepts, flows, and features before they&rsquo;re built, and ask what you think. Some will be sketches. Some will be half-working. Your reaction &mdash; what lands, what doesn&rsquo;t, what you&rsquo;d never use &mdash; decides what gets built and what gets dropped.</P>
            <P><B>Watching Marlo work, day to day.</B> You&rsquo;ll use Marlo for real: your stack, your routine, your reorders. We&rsquo;ll see where it does its job, where it fails, whether the problem we set out to solve is the one you actually have, and whether what Marlo tells you matches what happens in real life.</P>
            <P>That&rsquo;s the whole program: use it like it&rsquo;s yours, tell us the truth, and help us make it right before anyone else sees it.</P>
          </div>
        </section>

        <section id="what-you-get">
          <H2>What you get</H2>
          <div className="flex flex-col gap-4">
            <P><B>Your protocol, covered.</B> For the three months, Marlo orders your supplements and we pay for them. Whatever your stack needs, at the brand&rsquo;s price, delivered to your door. All of it goes through Marlo &mdash; that&rsquo;s how we cover it, and how Marlo learns.</P>
            <P><B>Marlo, in full.</B> Everything it can do, from day one: the answers, the buying, the reminders, the tracking. Plus the things we&rsquo;re still building, before anyone else sees them.</P>
            <P><B>A direct line to the people building it.</B> Thirty minutes with us every week, and a thread you can write to any time. When something&rsquo;s wrong, you tell us and we fix it. When something&rsquo;s right, you&rsquo;ll see it shape the product.</P>
            <P><B>A say in what Marlo becomes.</B> The first version of Marlo that the world sees will be the one you helped make.</P>
          </div>
        </section>

        <section id="what-we-ask">
          <H2>What we ask</H2>
          <div className="flex flex-col gap-4">
            <P><B>Use Marlo for real.</B> Not as a demo &mdash; as the thing that runs your supplements. Challenge it with questions. Consult it about the things that interest you, and the topics around them. Let it reorder. Answer the reminders, or ignore them and tell us why.</P>
            <P><B>Five minutes, four times a week.</B> Open the thread and use it: ask, consult, react to what it says. Short, real sessions. That&rsquo;s where we learn the most.</P>
            <P><B>Give feedback as you go.</B> We expect you to tell us how Marlo performs and how you react to what it does &mdash; the good and the bad. How to do it is in the feedback section below.</P>
            <P><B>Buy through Marlo.</B> For the three months, every supplement you take comes through Marlo. No credit card needed &mdash; just a shipping address. That&rsquo;s how we cover the cost, and how Marlo learns your stack and your cadence.</P>
            <P><B>Thirty minutes a week, on video.</B> One call with us, same slot each week if you can. We&rsquo;ll ask targeted questions, show you ideas, use cases, and what we&rsquo;re building next, and talk through the problems we&rsquo;re trying to solve.</P>
            <P><B>Tell us the truth.</B> What worked, what didn&rsquo;t, what felt wrong, what you&rsquo;d never use. The bad news is the useful part.</P>
          </div>
        </section>

        <section id="how-it-runs">
          <H2>How it runs</H2>
          <div className="flex flex-col gap-4">
            <P><B>The first call.</B> Thirty minutes on video. We introduce ourselves, walk you through what Marlo is and how the program works, answer your questions, and set what happens next. Depending on where we are in the build, we may also show you a few of the ideas we&rsquo;re working on and get your first read.</P>
            <P><B>Day one.</B> It starts the moment you receive Marlo&rsquo;s contact. Save it, text Marlo anything, and it takes it from there: it introduces itself, asks for what it needs &mdash; your labs, your shelf, your goal, your address &mdash; and builds your protocol with you. Your first order goes out.</P>
            <P><B>Every week: using Marlo.</B> Four times a week, about five minutes each. Text Marlo the way you&rsquo;d text a friend who happens to know supplements: ask it something, challenge it, consult it, let it reorder, answer its reminders. Whenever something&rsquo;s worth telling us, tell us right there in the thread &mdash; how, in the next section.</P>
            <P><B>Every week: the call.</B> Thirty minutes on video. We start with targeted questions about your week with Marlo, then show you what we&rsquo;re building next and ask for your read. The last few minutes are yours: anything about the overall experience, good or bad.</P>
            <P><B>Wrap-up.</B> One last call. What worked, what didn&rsquo;t, what you&rsquo;d keep. Then Marlo keeps running &mdash; if you want it to.</P>
          </div>
        </section>

        <section id="feedback">
          <H2>How to give feedback</H2>
          <div className="flex flex-col gap-4">
            <P>We expect it, and we read all of it.</P>
            <P><B>In the thread.</B> Three ways:</P>
            <ol className="m-0 pl-0 list-none flex flex-col gap-7">
              {[
                { text: <><B>React to a specific message.</B> Reply to that message, start with <Slash /> and write your feedback.</>, src: "/guide/reply-on-message.webp", alt: "iMessage thread: a reply to one of Marlo’s messages, starting with a slash", caption: "Long-press Marlo’s message → Reply, then start with /" },
                { text: <><B>General feedback.</B> Send a new message to the thread, start with <Slash /> and write your feedback.</>, src: "/guide/general-feedback.webp", alt: "iMessage thread: a new message to Marlo starting with a slash", caption: "A new message that starts with / — about anything" },
                { text: <><B>Straight to the founders.</B> When something needs a person: start a message with <Slash>/founders</Slash> and write what&rsquo;s going on. The conversation routes to us, we take over in the thread, and we sort it out. Use it for things like an order that&rsquo;s wrong, late, or never arrived; something Marlo said that seems incorrect or unsafe; Marlo stuck or not responding; wanting to pause, change your protocol, or leave the program; or anything you&rsquo;d rather not say to Marlo.</>, src: "/guide/founders.webp", alt: "iMessage thread: a message starting with /founders, answered by a founder in the same thread", caption: "/founders — a person answers in the same thread" },
              ].map((item, i) => (
                <li key={i} className="flex flex-col gap-4">
                  <div className="flex gap-3 text-[17px] leading-[1.5] text-midnight">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-salmon text-midnight font-mono text-[14px] font-semibold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <span>{item.text}</span>
                  </div>
                  <div className="pl-10 max-w-[330px]"><Shot src={item.src} alt={item.alt} caption={item.caption} /></div>
                </li>
              ))}
            </ol>
            <P>Everything with a <Slash /> goes to us, not to Marlo.</P>
            <P><B>On the weekly call.</B> The last few minutes of every call are yours. Bring anything: what annoyed you, what surprised you, what you&rsquo;d change &mdash; and your wish list, the things you&rsquo;d want Marlo to do that it doesn&rsquo;t yet.</P>
            <P>There&rsquo;s no wrong feedback. &ldquo;This felt off and I can&rsquo;t say why&rdquo; is useful. So is &ldquo;I didn&rsquo;t use it this week.&rdquo;</P>
            <P>If something goes wrong and Marlo stops working, or you have a question you&rsquo;d rather keep out of the thread, email <a href="mailto:support@marlo.me" className="font-semibold underline decoration-line underline-offset-4">support@marlo.me</a> any time and we&rsquo;ll take it from there.</P>
          </div>
        </section>

        <section id="your-data">
          <H2>Your data</H2>
          <div className="flex flex-col gap-4">
            <P><B>What Marlo keeps.</B> What you tell it, the labs and documents you share, what you take, your orders, and the conversation itself. It keeps all of it for as long as you&rsquo;re a member, because that&rsquo;s what lets it know you. You can see what it knows about you at any time, and correct it &mdash; just tell Marlo.</P>
            <P><B>What we do with it.</B> We use it to run your protocol and to run this program: reading how Marlo performs, where it fails, and what to build next. Feedback you send with <Slash /> goes to the team, not to Marlo.</P>
            <P><B>What we don&rsquo;t do.</B> We don&rsquo;t sell your data, and we don&rsquo;t share it with anyone. It&rsquo;s used internally to improve the product, and that&rsquo;s it.</P>
            <P><B>Leaving.</B> You can leave the program at any point. Send <Slash>/founders</Slash> and say so. We&rsquo;ll stop everything, cancel any open orders, and delete your data &mdash; or keep Marlo running for you, if you&rsquo;d rather.</P>
          </div>
        </section>

        <section id="questions">
          <H2>Questions</H2>
          <div className="flex flex-col gap-4 mb-2">
            <P><B>General questions.</B> Any time you have a question about the program, ask Marlo. It knows how the program works and will answer right there in the thread. For anything it can&rsquo;t settle, use <Slash>/founders</Slash>.</P>
            <p className="m-0 mt-2 text-[14px] font-semibold tracking-[0.03em] text-slate">A few we get asked</p>
          </div>
          <Q q="What if I don’t have a recent lab test?">No worries. Marlo builds your protocol from your goal and what you already take. Forward it a lab report any time &mdash; even months in &mdash; and it reads it and adjusts.</Q>
          <Q q="Do I pay anything?">No. Your supplements are covered for the three months, and there&rsquo;s no card on file. All we need is a shipping address.</Q>
          <Q q="Can I keep the brands I already use?">Yes. Marlo will show you options and its reasoning, but you make the call. If you want your brand, say so.</Q>
          <Q q="What if I disagree with something Marlo suggests?">Say so, in the thread. Marlo explains its reasoning and adjusts. Nothing changes in your protocol without your yes.</Q>
          <Q q="What about my prescriptions?">Tell Marlo what you take so it can check interactions. Marlo never advises starting, stopping, or changing a prescription &mdash; that&rsquo;s between you and your doctor.</Q>
          <Q q="Is Marlo a doctor?">No. It&rsquo;s a supplement expert, not a clinician. If something in your labs needs a doctor&rsquo;s eye, it will tell you so.</Q>
          <Q q="What if I miss a week?">Nothing happens. No streaks, no guilt. Pick it back up when you&rsquo;re ready, and tell us why on the call &mdash; that&rsquo;s useful too.</Q>
          <Q q="What if an order is wrong or late?">Send <Slash>/founders</Slash> with what happened. We take it from there.</Q>
          <Q q="What happens after three months?">One last call, and then Marlo keeps running for you if you want it to. We&rsquo;ll talk about what that looks like before the program ends.</Q>
          <div className="border-t border-line" />
        </section>

        <div className="mt-10 flex flex-col gap-2 text-[18px] leading-[1.5]">
          <p className="m-0 text-midnight">Thanks for being one of the first. Let&rsquo;s build this right.</p>
          <p className="m-0 font-semibold text-midnight">&mdash; The Marlo team</p>
        </div>
      </main>
    </div>
  );
}
