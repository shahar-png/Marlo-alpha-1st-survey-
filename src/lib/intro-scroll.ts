// Intro-only pacing. Capped distance and time steps also avoid jumps after a paused tab.
export const INTRO_MAX_PX_PER_SECOND = 480;
export const INTRO_MAX_PENDING_PX = 240;
export function scrollStep(current: number, target: number, elapsedMs: number, speed = INTRO_MAX_PX_PER_SECOND) {
  const limit = Math.min(INTRO_MAX_PX_PER_SECOND, speed) * Math.min(32, Math.max(0, elapsedMs)) / 1000;
  return current + Math.sign(target - current) * Math.min(Math.abs(target - current), limit);
}

export function paceIntroScroll(root: HTMLElement, onExplore: () => void) {
  let position = window.scrollY, target = position, frame = 0, lastTime = 0;
  let touchY: number | null = null, explored = false, writing = false;
  const max = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const clamp = (n: number) => Math.max(0, Math.min(max(), n));
  const explore = () => { if (!explored) { explored = true; onExplore(); } };
  const write = () => { writing = true; window.scrollTo({ top: position, behavior: 'instant' }); writing = false; };
  const tick = (time: number) => {
    frame = 0;
    const story = root.querySelector<HTMLElement>('.scroll-story');
    const stage = root.querySelector<HTMLElement>('.story-stage');
    const bounds = story?.getBoundingClientRect();
    const top = stage ? parseFloat(getComputedStyle(stage).top) || 80 : 80;
    const inStory = root.dataset.liveScroll === 'true' && bounds && bounds.top <= top + 40 && bounds.bottom >= top + (stage?.offsetHeight || 380);
    position = clamp(scrollStep(position, target, time - lastTime, inStory ? 150 : INTRO_MAX_PX_PER_SECOND)); lastTime = time; write();
    if (Math.abs(target - position) > .5) frame = requestAnimationFrame(tick);
  };
  const start = () => { if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(tick); } };
  const move = (delta: number) => {
    explore();
    // Reversing direction cancels pending travel; repeated fast input cannot build a long queue.
    if (Math.sign(delta) !== Math.sign(target - position)) target = position;
    target = clamp(position + Math.max(-INTRO_MAX_PENDING_PX, Math.min(INTRO_MAX_PENDING_PX, target - position + delta)));
    start();
  };
  const wheel = (e: WheelEvent) => {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault(); move(e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1));
  };
  const touchStart = (e: TouchEvent) => { touchY = e.touches.length === 1 ? e.touches[0].clientY : null; };
  const touchMove = (e: TouchEvent) => {
    if (e.touches.length !== 1 || touchY === null) { touchY = null; return; }
    const y = e.touches[0].clientY;
    if (e.cancelable) e.preventDefault();
    move(touchY - y); touchY = y;
  };
  const touchEnd = () => { touchY = null; };
  const key = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || (e.target instanceof Element && e.target.closest('input,textarea,select,button,a,[contenteditable=true]'))) return;
    if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); explore(); target = e.key === 'Home' ? 0 : max(); start(); return; }
    const delta = e.key === 'ArrowDown' ? 64 : e.key === 'ArrowUp' ? -64 : e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey) ? innerHeight * .75 : e.key === 'PageUp' || (e.key === ' ' && e.shiftKey) ? -innerHeight * .75 : 0;
    if (delta) { e.preventDefault(); move(delta); }
  };
  // Also pace scrollbar drags, Home/End and native/programmatic jumps.
  const nativeScroll = () => {
    if (writing || Math.abs(window.scrollY - position) <= 1) return;
    const requested = window.scrollY;
    explore(); write(); target = clamp(requested); start();
  };
  window.addEventListener('wheel', wheel, { passive: false });
  root.addEventListener('touchstart', touchStart, { passive: true });
  root.addEventListener('touchmove', touchMove, { passive: false });
  root.addEventListener('touchend', touchEnd, { passive: true });
  root.addEventListener('touchcancel', touchEnd, { passive: true });
  window.addEventListener('keydown', key);
  window.addEventListener('scroll', nativeScroll, { passive: true });
  return {
    to(y: number) { explore(); target = clamp(y); start(); },
    destroy() {
      cancelAnimationFrame(frame);
      window.removeEventListener('wheel', wheel); window.removeEventListener('keydown', key); window.removeEventListener('scroll', nativeScroll);
      root.removeEventListener('touchstart', touchStart); root.removeEventListener('touchmove', touchMove); root.removeEventListener('touchend', touchEnd); root.removeEventListener('touchcancel', touchEnd);
    },
  };
}
