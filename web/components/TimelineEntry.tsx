"use client";

import { useState } from "react";

type Props = {
  title: string;
  subtitle: string;
  period: string;
  details?: string[];
  expandLabel: string;
};

/** Timeline row from the template; rows with details expand on click. */
export default function TimelineEntry({ title, subtitle, period, details = [], expandLabel }: Props) {
  const [open, setOpen] = useState(false);
  const expandable = details.length > 0;

  const header = (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3
          className={`font-display text-xl font-bold leading-tight transition-colors ${open ? "text-heading" : "text-body group-hover:text-heading"}`}
        >
          {title}
        </h3>
        <p className="label mt-1 text-sm font-semibold text-accent">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3 pt-1 text-muted transition-colors group-hover:text-soft">
        <span className="font-display text-xs tabular-nums tracking-wider">{period}</span>
        {expandable && (
          <span className={`flex h-4 w-4 items-center justify-center transition-transform duration-200 ${open ? "rotate-45" : ""}`}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="group relative pb-10 ps-8">
      <div className="absolute inset-y-0 start-0 w-px bg-gradient-to-b from-accent to-border" aria-hidden />
      <div
        className={`absolute -start-1 top-1.5 h-2 w-2 rounded-full border transition-all ${
          open ? "border-accent bg-accent" : "border-muted bg-canvas group-hover:scale-150 group-hover:border-accent"
        }`}
        aria-hidden
      />
      {expandable ? (
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={`${expandLabel}: ${title}`} className="w-full text-start">
          {header}
        </button>
      ) : (
        header
      )}
      {expandable && (
        <div
          className="timeline-content overflow-hidden transition-all duration-300"
          style={{ maxHeight: open ? 600 : 0, opacity: open ? 1 : 0, visibility: open ? "visible" : "hidden" }}
        >
          <ul className="space-y-2 pt-4">
            {details.map((d, i) => (
              <li key={i} className="flex gap-2 text-sm leading-7 text-soft">
                <span className="shrink-0 text-accent">—</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
