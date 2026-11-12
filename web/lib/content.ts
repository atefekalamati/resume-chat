import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Locale, Profile } from "./types";

export const LOCALES = ["fa", "en"] as const satisfies readonly Locale[];

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function loadProfile(locale: Locale = "fa"): Profile {
  return JSON.parse(readFileSync(path.join(process.cwd(), "content", `profile.${locale}.json`), "utf8"));
}

export function loadDocs(): { source: string; text: string }[] {
  return readdirSync(path.join(process.cwd(), "content", "docs"))
    .filter((f) => /\.(md|txt)$/i.test(f))
    .sort()
    .map((f) => ({ source: f, text: readFileSync(path.join(process.cwd(), "content", "docs", f), "utf8") }));
}

export function profileToMarkdown(p: Profile): string {
  const contact = Object.entries(p.contact)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");
  return [
    `# ${p.name}`,
    `${p.title}${p.location ? ` - ${p.location}` : ""}`,
    p.summary,
    `## Contact\n${contact}`,
    `## About\n${p.about.join("\n\n")}`,
    ...p.experience.map(
      (e) => `## Experience: ${e.role} - ${e.company} (${e.period})\n${e.highlights.map((h) => `- ${h}`).join("\n")}`,
    ),
    `## Education\n${p.education.map((e) => `- ${e.degree}, ${e.school} (${e.period})`).join("\n")}`,
    `## Skills\n${p.skills.map((s) => `- ${s.group}: ${s.items.join(", ")}`).join("\n")}`,
    ...p.projects.map((pr) =>
      [
        `## Project: ${pr.name}`,
        `Category: ${pr.category}`,
        pr.period && `Period: ${pr.period}`,
        `Role: ${pr.role}`,
        pr.description,
        ...pr.sections.map((s) => `### ${s.title}\n${s.items.map((item) => `- ${item}`).join("\n")}`),
        `Tech: ${pr.tech.join(", ")}`,
        pr.link && `Link: ${pr.link}`,
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  ].join("\n\n");
}
