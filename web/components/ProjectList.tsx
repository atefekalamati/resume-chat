"use client";

import { useState } from "react";
import { PROJECT_CATEGORIES, type Project, type ProjectCategory } from "@/lib/types";

type Labels = {
  all: string;
  filter: string;
  role: string;
  view: string;
  expand: string;
  list: string;
  categories: Record<ProjectCategory, string>;
};

type Props = { projects: Project[]; labels: Labels };

/** Numbered, filterable project list; rows expand like the experience timeline. The first project starts open. */
export default function ProjectList({ projects, labels }: Props) {
  const [filter, setFilter] = useState<ProjectCategory | "all">("all");
  const [open, setOpen] = useState(() => new Set([0]));

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(i)) next.add(i);
      return next;
    });

  const filters = [
    { id: "all" as const, label: labels.all },
    ...PROJECT_CATEGORIES.filter((c) => projects.some((p) => p.category === c)).map((c) => ({ id: c, label: labels.categories[c] })),
  ];

  return (
    <>
      <div role="group" aria-label={labels.filter} className="mb-10 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`label rounded-sm border px-4 py-2 text-xs transition-colors ${
              filter === f.id ? "border-accent bg-accent text-white" : "border-border text-muted hover:border-accent hover:text-heading"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ol aria-label={labels.list} className="border-t border-surface">
        {projects.map((p, i) =>
          filter === "all" || p.category === filter ? (
            <ProjectEntry key={p.name} project={p} index={i} open={open.has(i)} onToggle={() => toggle(i)} labels={labels} />
          ) : null,
        )}
      </ol>
    </>
  );
}

function ProjectEntry({
  project: p,
  index,
  open,
  onToggle,
  labels,
}: {
  project: Project;
  index: number;
  open: boolean;
  onToggle: () => void;
  labels: Labels;
}) {
  const detailsId = `project-${index}-details`;
  return (
    <li
      data-category={p.category}
      className="group grid grid-cols-[3.5rem_1fr] gap-4 border-b border-surface py-8 transition-colors hover:bg-surface/50 sm:grid-cols-[5rem_1fr] sm:gap-6 sm:px-4"
    >
      <span
        dir="ltr"
        aria-hidden
        className={`font-display text-4xl font-bold leading-none tabular-nums transition-colors sm:text-5xl ${
          open ? "text-accent" : "text-accent-dim group-hover:text-accent"
        }`}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="min-w-0">
        <h3>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={detailsId}
            className="flex w-full items-start justify-between gap-4 text-start"
          >
            <span
              className={`font-display text-2xl font-bold leading-tight transition-colors sm:text-3xl ${
                open ? "text-heading" : "text-body group-hover:text-heading"
              }`}
            >
              {p.name}
            </span>
            <span
              className={`mt-2 flex h-4 w-4 shrink-0 items-center justify-center text-muted transition-transform duration-200 ${open ? "rotate-45 text-accent" : ""}`}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="sr-only">{labels.expand}</span>
            </span>
          </button>
        </h3>

        <p className="label mt-2 text-xs text-accent">
          {labels.categories[p.category]}
          {p.period && <span className="text-muted"> · {p.period}</span>}
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-soft">{p.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {p.tech.map((tech) => (
            <span key={tech} className="rounded-sm border border-border bg-surface-2 px-2 py-0.5 font-display text-xs tracking-wider text-muted">
              {tech}
            </span>
          ))}
        </div>

        <div
          id={detailsId}
          className={`project-details grid transition-all duration-300 ${open ? "visible grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0"}`}
        >
          <div className="overflow-hidden">
            <p className="mt-6 text-sm text-body">
              <span className="label me-2 text-xs text-accent">{labels.role}</span>
              {p.role}
            </p>
            <div className="mt-4 border-t border-surface">
              {p.sections.map((s, i) => (
                <details key={s.title} open={i === 0} className="group/section border-b border-surface">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-semibold text-body transition-colors hover:text-heading [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-3">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      {s.title}
                    </span>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      aria-hidden
                      className="shrink-0 text-muted transition-transform duration-200 group-open/section:rotate-45 group-open/section:text-accent"
                    >
                      <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </summary>
                  <ul className="space-y-2 pb-4 ps-4">
                    {s.items.map((item, j) => (
                      <li key={j} className="flex gap-2 text-sm leading-7 text-soft">
                        <span className="shrink-0 text-accent">—</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
            {p.link && (
              <a href={p.link} target="_blank" rel="noreferrer" className="label mt-4 inline-block text-xs text-accent hover:text-heading">
                {labels.view} ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
