"use client";
import React from "react";

// The supplied artwork is deliberately rendered without recreating its letterforms.
/* eslint-disable @next/next/no-img-element */
export function Wordmark({ className = "flow-wordmark" }: { className?: string }) {
  return <span className={className}><img src="/brand/marlo-wordmark.png" alt="Marlo" /></span>;
}
export function BrandIcon({ className = "flow-icon" }: { className?: string }) {
  return <span className={className} aria-hidden="true"><img src="/brand/marlo-icon.jpg" alt="" /></span>;
}
export function Screen({ children, cta, onBack, step, total }: { children: React.ReactNode; cta?: React.ReactNode; onBack?: () => void; step?: number; total?: number }) {
  return <div className="survey-one"><div className="flow">
    <header className="flow-header"><Wordmark /><BrandIcon /></header>
    {onBack || step ? <nav className="flow-nav" aria-label="Survey navigation">
      {onBack ? <button className="flow-back" type="button" onClick={onBack} aria-label="Back">← Back</button> : <span />}
      {step && total ? <span>{String(step).padStart(2, "0")} / {String(total).padStart(2, "0")}</span> : null}
    </nav> : null}
    <main className="flow-content">{children}</main>
    {cta ? <footer className="flow-actions">{cta}</footer> : null}
  </div></div>;
}
export function Title({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h1 className={`flow-title ${className}`}>{children}</h1>;
}
export function Lead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`flow-lead ${className}`}>{children}</p>;
}
export function Label({ children }: { children: React.ReactNode }) { return <div className="flow-label">{children}</div>; }
export function Button({ children, onClick, disabled, quiet, type = "button" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; quiet?: boolean; type?: "button" | "submit" }) {
  return <button type={type} className={quiet ? "secondary" : "next"} onClick={onClick} disabled={disabled}>{children}{!quiet && <svg className="button-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M6 18 18 6M6 6h12v12" /></svg>}</button>;
}
export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className="chip" aria-pressed={active} onClick={onClick}>{children}</button>;
}
export function Row({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className="choice-row" aria-pressed={active} onClick={onClick}><span className="choice-indicator" aria-hidden="true">{active ? "✓" : ""}</span><span className="choice-content">{children}</span></button>;
}
export function Field({ id, label, value, onChange, type = "text", inputMode, autoComplete, placeholder, prefix, error }: { id: string; label: string; value: string; onChange: (v: string) => void; type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; autoComplete?: string; placeholder?: string; prefix?: string; error?: string }) {
  return <div className="field"><label htmlFor={id}>{label}</label><div className={prefix ? "phone-row" : ""}>
    {prefix ? <span className="phone-prefix">{prefix}</span> : null}
    <input id={id} type={type} inputMode={inputMode} autoComplete={autoComplete} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
  </div>{error ? <p className="field-error" id={`${id}-error`} role="alert">{error}</p> : null}</div>;
}
export function TextArea({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <label className="field conditional"><span>{placeholder}</span><textarea id={id} value={value} onChange={e => onChange(e.target.value)} aria-label={placeholder} rows={2} /></label>;
}
