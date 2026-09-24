"use client";
import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Opt } from "@/lib/survey2";

type Drag = { id: string; pointer: number; x: number; y: number; offsetX: number; offset: number; width: number; height: number; initial: string[]; active: boolean; timer?: ReturnType<typeof setTimeout>; raf?: number };
/** Capture belongs to the stable list; only the six-dot handle starts a drag. */
export default function SurveyRanking({ order, options, onChange, label, compact = false }: {
  order: string[]; options: Opt[]; onChange: (order: string[]) => void; label: string; compact?: boolean;
}) {
  const list = useRef<HTMLOListElement>(null), drag = useRef<Drag | null>(null);
  const latest = useRef({ order, onChange });
  const [announcement, announce] = useState("");
  useEffect(() => { latest.current = { order, onChange }; }, [order, onChange]);
  const name = (id: string) => options.find(o => o.id === id)?.label || id;
  const items = () => Array.from(list.current?.querySelectorAll<HTMLElement>(".rank-item") || []);
  const itemFor = (id: string) => items().find(el => el.dataset.rankId === id)!;
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function move(id: string, to: number, speak = true) {
    const current = latest.current.order;
    to = Math.max(0, Math.min(current.length - 1, to));
    if (current.indexOf(id) === to) return;
    const old = new Map(items().map(el => [el.dataset.rankId, el.getBoundingClientRect()]));
    const next = current.filter(k => k !== id); next.splice(to, 0, id);
    latest.current.order = next;
    flushSync(() => latest.current.onChange(next));
    if (!reduced()) items().forEach(el => {
      if (el.dataset.rankId === drag.current?.id) return;
      el.getAnimations().forEach(a => a.cancel());
      const now = el.getBoundingClientRect(), before = old.get(el.dataset.rankId) ?? now;
      const dx = before.left - now.left, dy = before.top - now.top;
      if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 180, easing: "ease-out" });
    });
    if (speak) announce(`${name(id)} moved to priority ${to + 1} of ${next.length}.`);
  }
  function paint() {
    const d = drag.current; if (!d?.active || !list.current) return;
    const viewport = list.current.closest<HTMLElement>(".page-body");
    if (viewport) {
      const b = viewport.getBoundingClientRect();
      viewport.scrollTop += d.y < b.top + 45 ? -9 : d.y > b.bottom - 45 ? 9 : 0;
    }
    const el = itemFor(d.id); if (!el) return;
    el.style.transform = "none";
    el.style.transform = `translate(${d.x - d.offsetX - el.getBoundingClientRect().left}px, ${d.y - d.offset - el.getBoundingClientRect().top}px) scale(1.025)`;
    const centerX = d.x - d.offsetX + d.width / 2, centerY = d.y - d.offset + d.height / 2;
    const bounds = list.current.getBoundingClientRect();
    // Compare live layout slots in both dimensions so the same control works in a grid or list.
    const slots = items().map((other, index) => ({ index, distance: Math.hypot(
      centerX - (bounds.left + other.offsetLeft + other.offsetWidth / 2),
      centerY - (bounds.top + other.offsetTop + other.offsetHeight / 2)) }));
    const target = slots.reduce((best, slot) => slot.distance < best.distance ? slot : best).index;
    if (target !== latest.current.order.indexOf(d.id)) {
      move(d.id, target, false);
      el.style.transform = "none";
      el.style.transform = `translate(${d.x - d.offsetX - el.getBoundingClientRect().left}px, ${d.y - d.offset - el.getBoundingClientRect().top}px) scale(1.025)`;
    }
    d.raf = requestAnimationFrame(paint);
  }
  function release(e: React.PointerEvent<HTMLOListElement>) {
    const d = drag.current; if (!d || e.pointerId !== d.pointer) return;
    e.stopPropagation(); clearTimeout(d.timer); cancelAnimationFrame(d.raf || 0); drag.current = null;
    const el = itemFor(d.id); el.style.transform = ""; el.classList.remove("dragging");
    el.querySelector("button")?.removeAttribute("aria-pressed");
    if (e.type === "pointercancel") { latest.current.order = d.initial; latest.current.onChange(d.initial); }
    if (list.current?.hasPointerCapture(d.pointer)) list.current.releasePointerCapture(d.pointer);
    announce(`${name(d.id)} is priority ${latest.current.order.indexOf(d.id) + 1} of ${latest.current.order.length}.`);
  }
  useEffect(() => () => {
    clearTimeout(drag.current?.timer); cancelAnimationFrame(drag.current?.raf || 0);
  }, []);
  return <>
    <ol ref={list} className={`rank-list${compact ? " pain-rank-list" : ""}`} aria-label={label}
      onPointerDown={e => {
        const grip = (e.target as HTMLElement).closest<HTMLButtonElement>(".rank-grip");
        if (!grip || e.button > 0 || drag.current) return;
        e.preventDefault(); e.stopPropagation();
        const el = grip.closest<HTMLElement>(".rank-item")!, box = el.getBoundingClientRect();
        const d: Drag = { id: el.dataset.rankId!, pointer: e.pointerId, x: e.clientX, y: e.clientY, offsetX: e.clientX - box.left, width: box.width, offset: e.clientY - box.top, height: box.height, initial: [...latest.current.order], active: false };
        drag.current = d; e.currentTarget.setPointerCapture(e.pointerId);
        const start = () => { if (drag.current !== d) return; d.active = true; el.classList.add("dragging"); grip.setAttribute("aria-pressed", "true"); announce(`Picked up ${name(d.id)}`); paint(); };
        if (e.pointerType === "mouse") start(); else d.timer = setTimeout(start, 220);
      }}
      onPointerMove={e => { const d = drag.current; if (d?.pointer !== e.pointerId) return; e.preventDefault(); e.stopPropagation(); d.x = e.clientX; d.y = e.clientY; }}
      onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
      {order.map((id, i) => <li className="rank-item" key={id} data-rank-id={id}>
        <span className="rank-number">{String(i + 1).padStart(2, "0")}</span>
        <span className="rank-label">{name(id)}</span>
        <button className="rank-grip" type="button" aria-label={`Reorder ${name(id)}. Priority ${i + 1} of ${order.length}. Hold and drag, or use Up and Down arrow keys.`}
          onKeyDown={e => {
            const to = e.key === "ArrowUp" ? i - 1 : e.key === "ArrowDown" ? i + 1 : e.key === "Home" ? 0 : e.key === "End" ? order.length - 1 : null;
            if (to === null) return; e.preventDefault(); move(id, to); e.currentTarget.focus({ preventScroll: true });
          }}>
          <svg viewBox="0 0 20 28" aria-hidden="true" fill="currentColor">{[6,14,22].flatMap(y => [6,14].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" />))}</svg>
        </button>
      </li>)}
    </ol>
    <p className="rank-live" role="status">{announcement}</p>
  </>;
}
