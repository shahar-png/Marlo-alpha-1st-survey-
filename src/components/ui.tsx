"use client";
import React from "react";

function cx(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

/** One screen: wordmark on top, content, CTA pinned at the bottom. Mobile column on every width. */
export function Screen({
  children,
  cta,
  onBack,
  step,
  total,
}: {
  children: React.ReactNode;
  cta?: React.ReactNode;
  onBack?: () => void;
  step?: number;
  total?: number;
}) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-ground">
      <header className="mx-auto w-full max-w-[440px] px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="-ml-2 h-9 w-9 rounded-md flex items-center justify-center text-ink-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          ) : null}
          <span className="text-[15px] font-semibold tracking-[0.06em] text-ink">marlo</span>
        </div>
        {step && total ? (
          <span className="text-[13px] text-ink-3 tabular-nums">{step} / {total}</span>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-[440px] px-6 flex-1 flex flex-col pb-6 fade-up">{children}</main>
      {cta ? (
        <footer
          className="mx-auto w-full max-w-[440px] px-6 pt-3"
          style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
        >
          {cta}
        </footer>
      ) : null}
    </div>
  );
}

export function Title({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h1 className={cx("text-[28px] leading-[1.15] font-semibold tracking-tight text-ink", className)}>{children}</h1>;
}

export function Lead({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cx("text-[17px] leading-[1.5] text-ink-2", className)}>{children}</p>;
}

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("text-[15px] font-medium text-ink mb-2.5", className)}>{children}</div>;
}

export function Button({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "w-full h-[52px] rounded-md text-[17px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ground",
        disabled ? "bg-line text-ink-3 cursor-not-allowed" : "bg-accent text-white hover:brightness-95 active:brightness-90"
      )}
    >
      {children}
    </button>
  );
}

export function Chip({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "w-full rounded-md border text-left leading-snug transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        small ? "px-3 py-2.5 text-[15px]" : "px-4 py-3.5 text-[16px]",
        active ? "border-accent bg-accent-soft text-ink" : "border-line bg-surface text-ink hover:border-ink-3"
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  prefix,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  placeholder?: string;
  prefix?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[15px] font-medium text-ink mb-1.5">{label}</label>
      <div className={cx("flex items-center rounded-md border bg-surface", error ? "border-danger" : "border-line focus-within:border-ink-2")}>
        {prefix ? <span className="pl-4 pr-1 text-[17px] text-ink-3 select-none">{prefix}</span> : null}
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cx("w-full h-[52px] bg-transparent text-[17px] text-ink placeholder:text-ink-3 focus:outline-none", prefix ? "pr-4" : "px-4")}
        />
      </div>
      {error ? <p className="mt-1.5 text-[13px] text-danger">{error}</p> : null}
    </div>
  );
}

export function TextArea({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className="mt-2 w-full rounded-md border border-line bg-surface px-4 py-3 text-[16px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink-2"
    />
  );
}
