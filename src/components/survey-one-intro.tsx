"use client";
import { useEffect, useRef } from "react";
import { BrandIcon, Wordmark, Button } from "./survey-one-ui";

export function MarloIntro({ next }: { next: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current!;
    const el = (selector: string) => root.querySelector<HTMLElement>(selector)!;
    const hero = el('.hero'), actor = el('.brand-actor'), typing = el('.typing'), logo = el('.original-icon'), title = el('.title'), cue = el('.scroll-cue');
    const story = el('.scroll-story'), stage = el('.story-stage');
    const panels = Array.from(root.querySelectorAll<HTMLElement>('.story-panel'));
    const sections = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations: Animation[] = [];
    let storyAnimations: Animation[] = [], observer: IntersectionObserver | null = null;
    let frame = 0, beat = -1, disposed = false, openingSkipped = false;
    const animate = (target: HTMLElement, frames: Keyframe[], duration: number, delay = 0, easing = 'cubic-bezier(.22,.75,.2,1)', fill: FillMode = 'both') => {
      const animation = target.animate(frames, {duration, delay, easing, fill});
      animations.push(animation);
      return animation;
    };
    function showAll() {
      openingSkipped = true;
      animations.forEach(a => a.cancel()); observer?.disconnect();
      root.dataset.staged = 'false';
    }
    function updateStory() {
      frame = 0;
      cue.hidden = root.getBoundingClientRect().bottom <= window.innerHeight + 2;
      if (reduced.matches) {
        root.dataset.liveScroll = 'false'; storyAnimations.forEach(a => a.cancel()); beat = -1;
        panels.forEach(panel => {panel.removeAttribute('aria-hidden'); panel.style.opacity = ''; panel.style.transform = '';});
        return;
      }
      root.dataset.liveScroll = 'true';
      const top = parseFloat(getComputedStyle(stage).top) || 80;
      const progress = Math.max(0, Math.min(1, (top - story.getBoundingClientRect().top) / (story.offsetHeight - stage.offsetHeight)));
      const nextBeat = progress < .35 ? 0 : progress < .70 ? 1 : 2;
      if (nextBeat === beat) return;
      const previous = beat; beat = nextBeat;
      storyAnimations.forEach(a => a.cancel()); storyAnimations = [];
      panels.forEach((panel, i) => {panel.style.opacity = i === beat ? '1' : '0'; panel.style.transform = 'none'; panel.setAttribute('aria-hidden', String(i !== beat));});
      if (previous >= 0) {
        const direction = beat > previous ? 1 : -1;
        storyAnimations.push(panels[previous].animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:`translateY(${-18 * direction}px)`}], {duration:250,easing:'ease-out'}));
        storyAnimations.push(panels[beat].animate([{opacity:0,transform:`translateY(${28 * direction}px)`},{opacity:1,transform:'translateY(0)'}], {duration:671.875,delay:250,fill:'backwards',easing:'cubic-bezier(.2,.8,.2,1)'}));
      }
    }
    // Observe native scrolling; never intercept gestures or write the scroll position.
    const queueScroll = () => {
      if (window.scrollY > 0 && !openingSkipped) showAll();
      if (!frame) frame = requestAnimationFrame(updateStory);
    };
    const motionChange = () => {if (reduced.matches) showAll(); updateStory();};
    window.addEventListener('scroll', queueScroll, {passive:true});
    window.addEventListener('resize', queueScroll);
    reduced.addEventListener('change', motionChange);
    updateStory();
    if (!reduced.matches) root.dataset.staged = 'true';
    async function start() {
      await Promise.race([Promise.allSettled([document.fonts.ready, ...Array.from(root.querySelectorAll('img')).map(img => img.decode())]), new Promise(resolve => setTimeout(resolve, 1000))]);
      if (disposed || reduced.matches || openingSkipped) return;
      const dx = hero.clientWidth / 2 - 46 - actor.offsetLeft, dy = hero.clientHeight / 2 - 23 - actor.offsetTop;
      animate(actor, [{transform:`translate(${dx}px,${dy}px) scale(1)`},{transform:'translate(0,0) scale(.7)'}], 780, 1950, 'cubic-bezier(.65,0,.2,1)');
      Array.from(typing.children).forEach((child, i) => {
        const dot = child as HTMLElement;
        animate(dot, [{opacity:.35,transform:'translateY(0) scale(.86)',offset:0},{opacity:1,transform:'translateY(-5px) scale(1.03)',offset:.19},{opacity:.35,transform:'translateY(0) scale(.86)',offset:.43},{opacity:.35,transform:'translateY(0) scale(.86)',offset:.52},{opacity:1,transform:'translateY(-5px) scale(1.03)',offset:.72},{opacity:.7,transform:'translateY(0) scale(1)',offset:1}], 920, 100+i*90, 'ease-in-out');
        const shape = [{x:0,y:11,w:42,h:20,a:-48},{x:25,y:11,w:41,h:22,a:-37},{x:50,y:10,w:44,h:21,a:-48}][i];
        animate(dot, [{opacity:.7,left:(15+i*25)+'px',top:'17px',width:'12px',height:'12px',transform:'rotate(0deg)'},{opacity:1,left:shape.x+'px',top:shape.y+'px',width:shape.w+'px',height:shape.h+'px',transform:`rotate(${shape.a}deg)`}], 560, 1190+i*40, 'cubic-bezier(.65,0,.2,1)', 'forwards');
      });
      animate(typing, [{opacity:1},{opacity:0}], 220, 1660);
      animate(logo, [{opacity:0,transform:'scale(.97)'},{opacity:1,transform:'scale(1)'}], 280, 1610);
      animate(title, [{opacity:0,transform:'translateY(-95px)',offset:0},{opacity:1,transform:'translateY(7px)',offset:.67},{opacity:1,transform:'translateY(-3px)',offset:.85},{opacity:1,transform:'translateY(0)',offset:1}], 820, 2780, 'linear');
      const gate = performance.now() + 3540;
      observer = new IntersectionObserver(entries => {
        let stagger = 0;
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          observer!.unobserve(entry.target);
          animate(entry.target as HTMLElement, [{opacity:0,transform:'translateY(30px)'},{opacity:1,transform:'translateY(0)'}], 740, Math.max(0,gate-performance.now())+stagger);
          stagger += 100;
        });
      }, {threshold:.15,rootMargin:'0px 0px -45px 0px'});
      sections.forEach(section => observer!.observe(section));
    }
    start().catch(() => {if (!disposed) showAll();});
    return () => {
      disposed = true; showAll(); storyAnimations.forEach(a => a.cancel()); cancelAnimationFrame(frame);
      window.removeEventListener('scroll', queueScroll); window.removeEventListener('resize', queueScroll); reduced.removeEventListener('change', motionChange);
    };
  }, []);

  return <div id="marlo-arrival" className="survey-one" ref={ref}>
    <div className="scroll-cue" aria-hidden="true">↓</div>
    <article className="survey">
      <header className="hero" aria-label="Marlo introduction">
        <div className="brand-actor" aria-hidden="true"><BrandIcon className="original-icon" /><span className="typing"><span className="dot" /><span className="dot" /><span className="dot" /></span></div>
        <h1 className="title" aria-label="Meet Marlo."><span className="meet">Meet</span><Wordmark className="wordmark" /></h1>
      </header>
      <main>
        <section className="intro-section reveal"><h2>I’m a contact<br />in your phone.</h2><p>A supplement expert and your concierge in one, built by leading longevity scientists and backed by science. Talk to me about supplements, health, and what’s right for you.</p><p>I know your labs, your goals, your routine, and I work only for you. And I don’t just advise — I buy, I reorder, I follow up, on your behalf.</p></section>
        <section className="benefit discover reveal"><h2>I help you discover<br />what you<br /><span>actually need.</span></h2><p>From your labs, your tests, your goals.</p></section>
        <section className="scroll-story" aria-label="How Marlo helps"><div className="story-stage">
          <section className="story-panel"><h2>I <em>buy</em><br />for you.</h2><p>Before you run out,<br />at member prices.</p></section>
          <section className="story-panel"><h2>I <em>remind</em><br />you.</h2><p>Your times, adjusted to your life.</p></section>
          <section className="story-panel"><h2>I tell you<br />what’s <em>working.</em></h2><p>And what isn’t.</p></section>
        </div></section>
        <section className="closing reveal"><p>You make<br />the calls.<br /><span>I do the work.</span></p></section>
      </main>
      <footer className="reveal"><Button onClick={next}>Next</Button></footer>
    </article>
  </div>;
}
