"use client";
import React from "react";

function cx(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

/** One screen: wordmark, content, CTA pinned at the bottom. 393-wide column on every width. */
export function Screen({ children, cta, onBack, step, total }: { children: React.ReactNode; cta?: React.ReactNode; onBack?: () => void; step?: number; total?: number }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-cream">
      <header className="mx-auto w-full max-w-[393px] px-[22px] pt-4 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {onBack ? (
            <button type="button" onClick={onBack} aria-label="Back" className="-ml-1 h-11 w-11 rounded-full flex items-center justify-center text-midnight focus:outline-none focus-visible:ring-2 focus-visible:ring-salmon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          ) : null}
          <span className="text-[17px] font-semibold tracking-[0.02em] text-midnight">Marlo<span className="text-salmon">.</span></span>
        </div>
        {step && total ? <span className="font-mono text-[13px] font-medium text-slate tabular-nums">{step} / {total}</span> : null}
      </header>
      <main className="mx-auto w-full max-w-[393px] px-[22px] pt-2 flex-1 flex flex-col pb-4 fade-up">{children}</main>
      {cta ? (
        <footer className="mx-auto w-full max-w-[393px] px-[22px] pt-3" style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>{cta}</footer>
      ) : null}
    </div>
  );
}

export function Title({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h1 className={cx("text-[32px] leading-[1.08] font-semibold tracking-[-0.01em] text-midnight", className)}>{children}</h1>;
}

export function Lead({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cx("text-[17px] leading-[1.45] text-slate", className)}>{children}</p>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[14px] font-semibold tracking-[0.03em] text-slate mb-2.5">{children}</div>;
}

export function Button({ children, onClick, disabled, quiet, type = "button" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; quiet?: boolean; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "w-full h-[54px] rounded-full text-[17px] font-semibold transition-[filter,background-color] focus:outline-none focus-visible:ring-2 focus-visible:ring-salmon focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
        disabled ? "bg-paper border border-line text-taupe cursor-not-allowed" : quiet ? "bg-paper border border-line text-midnight hover:border-midnight" : "bg-salmon text-midnight hover:brightness-[0.97] active:brightness-[0.94]"
      )}
    >
      {children}
    </button>
  );
}

/** Pill chip (v5 Selection Chip): paper/line at rest; white with a 1.5px midnight border when on. */
export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "inline-flex items-center min-h-[44px] px-4 py-2.5 rounded-full text-[15px] font-semibold text-left leading-snug transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-salmon",
        active ? "bg-white border-[1.5px] border-midnight text-midnight" : "bg-paper border border-line text-slate hover:border-taupe"
      )}
    >
      {children}
    </button>
  );
}

/** Full-width row option (radius 14). */
export function Row({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "w-full min-h-[56px] px-[18px] py-[15px] rounded-[14px] text-left text-[17px] leading-[1.4] text-midnight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-salmon",
        active ? "bg-white border-[1.5px] border-midnight" : "bg-paper border border-line hover:border-taupe"
      )}
    >
      {children}
    </button>
  );
}

export function Field({ id, label, value, onChange, type = "text", inputMode, autoComplete, placeholder, prefix, error }: { id: string; label: string; value: string; onChange: (v: string) => void; type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; autoComplete?: string; placeholder?: string; prefix?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[14px] font-semibold tracking-[0.03em] text-slate">{label}</label>
      <div className={cx("flex items-center h-[56px] rounded-[14px] bg-paper border", error ? "border-danger" : "border-line focus-within:border-midnight")}>
        {prefix ? <span className="pl-[18px] pr-2 font-mono text-[16px] text-slate select-none">{prefix}</span> : null}
        <input id={id} type={type} inputMode={inputMode} autoComplete={autoComplete} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className={cx("w-full h-full bg-transparent text-[17px] text-midnight placeholder:text-taupe focus:outline-none", prefix ? "pr-[18px]" : "px-[18px]")} />
      </div>
      {error ? <p className="text-[13px] text-danger">{error}</p> : null}
    </div>
  );
}

export function TextArea({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} className="mt-2 w-full rounded-[14px] border border-line bg-paper px-4 py-3.5 text-[16px] text-midnight placeholder:text-taupe focus:outline-none focus:border-midnight" />
  );
}

/** Dark "ticket" block — one per screen at most. */
export function Ticket({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="bg-midnight text-cream rounded-[24px] px-5 py-[18px] flex flex-col gap-2">
      <div className="text-[12px] tracking-[0.08em] uppercase text-[#B9B4A6]">{eyebrow}</div>
      <div>{children}</div>
    </div>
  );
}
