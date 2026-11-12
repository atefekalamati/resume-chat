"use client";

import { useEffect, useState } from "react";

type Props = {
  title: string;
  sections: { id: string; label: string }[];
  downloadLabel: string;
  preparingLabel: string;
  otherLocale: { href: string; lang: string; label: string; name: string };
  /** When set, the download button serves this PDF; otherwise it prints the page. */
  pdfHref?: string;
};

const buttonClass =
  "label flex shrink-0 items-center gap-2 border border-accent bg-accent px-4 py-2 text-xs text-white transition hover:bg-accent-dim";

const downloadIcon = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M6 1v7M3 5l3 3 3-3M1 9v2h10V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Fixed top bar: name, section links that highlight while scrolling, a language switch and a resume download button. */
export default function SiteHeader({ title, sections, downloadLabel, preparingLabel, otherLocale, pdfHref }: Props) {
  const [active, setActive] = useState(sections[0]?.id);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const observers = sections.map(({ id }) => {
      const observer = new IntersectionObserver(
        ([entry]) => entry.isIntersecting && setActive(id),
        { rootMargin: "-40% 0px -50% 0px" },
      );
      const el = document.getElementById(id);
      if (el) observer.observe(el);
      return observer;
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  const print = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 150);
  };

  return (
    <header className="no-print fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-4 border-b border-surface bg-canvas/90 px-5 py-4 backdrop-blur-md sm:px-8">
      <div className="label truncate text-sm text-muted">{title}</div>
      <nav className="flex items-center gap-6">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={active === s.id ? "true" : undefined}
            className={`label hidden text-xs transition-colors md:block ${active === s.id ? "text-heading" : "text-muted hover:text-body"}`}
          >
            {s.label}
          </a>
        ))}
        <a
          href={otherLocale.href}
          lang={otherLocale.lang}
          aria-label={otherLocale.name}
          onClick={(e) => {
            e.preventDefault();
            window.location.assign(otherLocale.href + window.location.hash);
          }}
          className="label shrink-0 text-xs text-muted transition-colors hover:text-heading"
        >
          {otherLocale.label}
        </a>
        {pdfHref ? (
          <a href={pdfHref} download className={buttonClass}>
            {downloadIcon}
            {downloadLabel}
          </a>
        ) : (
          <button type="button" onClick={print} className={buttonClass}>
            {printing ? (
              preparingLabel
            ) : (
              <>
                {downloadIcon}
                {downloadLabel}
              </>
            )}
          </button>
        )}
      </nav>
    </header>
  );
}
