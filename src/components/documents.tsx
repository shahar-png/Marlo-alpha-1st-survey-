"use client";

import React, { useEffect, useRef, useState } from "react";
import "./documents.css";

export function DocumentIcon({ kind = "arrow" }: { kind?: "arrow" | "back" | "plus" | "check" }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={kind === "back" ? "M19 12H5m7-7-7 7 7 7" : kind === "plus" ? "M12 5v14M5 12h14" : kind === "check" ? "m5 12 4 4L19 6" : "M7 17 17 7M7 7h10v10"} /></svg>;
}

export function DocumentShell({ children }: { children: React.ReactNode }) {
  return <div id="marlo-documents"><div className="document">
    <header className="brand-header">
      {/* Original supplied artwork, cropped to the mark's bounds. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <span className="wordmark"><img src="/brand/marlo-wordmark.png" alt="Marlo" /></span>
      <span className="edition">The alpha program</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <span className="brand-symbol" aria-hidden="true"><img src="/brand/marlo-icon.jpg" alt="" /></span>
    </header>
    <main>{children}</main>
    <footer className="footer"><span>Marlo alpha · Made with you.</span><a href="mailto:support@marlo.me">Contact the team</a></footer>
  </div></div>;
}

export function DocumentButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} type={props.type || "button"} className={`primary ${props.className || ""}`}>{children}<DocumentIcon /></button>;
}

export function DocumentLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="primary" href={href}>{children}<DocumentIcon /></a>;
}

export function Chapters({ items, legal = false }: { items: { id: string; title: string; body: React.ReactNode }[]; legal?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [allOpen, setAllOpen] = useState(false);
  // Preserve existing guide #section links, including on initial navigation.
  useEffect(() => {
    const reveal = () => {
      const target = document.getElementById(window.location.hash.slice(1));
      if (target instanceof HTMLDetailsElement && ref.current?.contains(target)) {
        target.open = true; target.scrollIntoView({ block: "start" });
      }
    };
    reveal(); window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);
  const sync = () => setAllOpen(Array.from(ref.current?.querySelectorAll("details") || []).every(d => d.open));
  return <div ref={ref} className={legal ? "legal-chapters" : "chapter-list"} id={legal ? "agreement-chapters" : "guide-chapters"}>
    <div className="section-bar">{legal ? <span className="label">10 sections</span> : <h2>In this guide.</h2>}
      <button type="button" className="small-action" onClick={() => { ref.current?.querySelectorAll("details").forEach(d => { d.open = !allOpen; }); setAllOpen(!allOpen); }}>{allOpen ? "Collapse all" : "Expand all"}</button>
    </div>
    {items.map((item, i) => <details className="chapter" id={item.id} key={item.id} onToggle={sync}>
      <summary><span className="number">{String(i + 1).padStart(2, "0")}</span><span className="chapter-title">{item.title}</span><span className="expand"><DocumentIcon kind="plus" /></span></summary>
      <div className="chapter-content">{item.body}</div>
    </details>)}
  </div>;
}

export function GuideStart() {
  return <DocumentButton className="hero-action" onClick={() => {
    const first = document.querySelector<HTMLDetailsElement>("#guide-chapters details");
    if (first) { first.open = true; first.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }
  }}>Get to know the program</DocumentButton>;
}
