"use client";
import { useEffect, useRef } from "react";
import { Title, Lead } from "./survey-one-ui";

export function QueueCelebration({ name }: { name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current!;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;
    const animations: Animation[] = [];
    const stop = () => animations.forEach(animation => animation.cancel());
    root.querySelectorAll<HTMLElement>(".queue-reveal").forEach((el, i) => {
      animations.push(el.animate([
        { opacity: 0, transform: "translateY(24px) scale(.97)" },
        { opacity: 1, transform: "translateY(-3px) scale(1.01)", offset: .75 },
        { opacity: 1, transform: "none" },
      ], { duration: 850, delay: i * 150, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" }));
    });
    root.querySelectorAll<HTMLElement>(".queue-confetti i").forEach((el, i) => {
      const x = Math.cos(i * 2.4) * (65 + i % 5 * 18);
      const y = -45 - i % 4 * 18;
      animations.push(el.animate([
        { opacity: 0, transform: "translate(0,0) scale(.3) rotate(0deg)" },
        { opacity: 1, transform: `translate(${x}px,${y}px) rotate(${i * 33}deg)`, offset: .32 },
        { opacity: 0, transform: `translate(${x * 1.1}px,190px) rotate(${i * 33 + 150}deg)` },
      ], { duration: 2100, delay: 160 + i % 4 * 70, easing: "cubic-bezier(.2,.7,.3,1)" }));
    });
    motion.addEventListener("change", stop);
    return () => { stop(); motion.removeEventListener("change", stop); };
  }, []);

  return <div className="queue-copy" ref={ref}>
    <div className="queue-confetti" aria-hidden="true">{Array.from({ length: 20 }, (_, i) => <i key={i} />)}</div>
    <p className="flow-kicker queue-reveal">Application received</p>
    <div className="queue-reveal"><Title className="queue-title">You&rsquo;re in<br /><span className="queue-highlight">the queue.</span></Title></div>
    <div className="queue-reveal"><Lead>Thanks, {name}. Your application is with the Marlo founders now.</Lead></div>
    <div className="queue-reveal"><Lead>We&rsquo;re reading every one ourselves, and we&rsquo;ll be in touch shortly with the next step.</Lead></div>
    <div className="queue-reveal"><Lead>Really glad you&rsquo;re here.</Lead><p className="signature">&mdash; The Marlo team</p></div>
  </div>;
}
