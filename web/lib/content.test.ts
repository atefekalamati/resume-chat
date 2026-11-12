import { describe, expect, it } from "vitest";
import { loadDocs, loadProfile, LOCALES, profileToMarkdown } from "./content";
import { buildSystemPrompt } from "./prompt";
import { getKnowledge } from "./knowledge";
import { PROJECT_CATEGORIES } from "./types";

/** Object keys and array lengths, recursively; string values are ignored. */
function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
  }
  return typeof value;
}

describe("content", () => {
  it.each(LOCALES)("loads a valid %s profile", (locale) => {
    const p = loadProfile(locale);
    expect(p.locale).toBe(locale);
    expect(p.name).toBeTruthy();
    expect(p.chat.suggestions.length).toBeGreaterThan(0);
  });

  it("defaults to the Persian profile", () => {
    expect(loadProfile().locale).toBe("fa");
  });

  it("has fa and en profiles with identical keys and array lengths", () => {
    expect(shape(loadProfile("en"))).toEqual(shape(loadProfile("fa")));
  });

  it("loads only markdown and text docs", () => {
    const docs = loadDocs();
    expect(docs.length).toBeGreaterThan(0);
    expect(docs.every((d) => /\.(md|txt)$/.test(d.source))).toBe(true);
  });

  it("converts the profile to markdown with every section", () => {
    const p = loadProfile();
    const md = profileToMarkdown(p);
    expect(md).toContain(`# ${p.name}`);
    expect(md).toContain(p.experience[0].company);
    expect(md).toContain(p.education[0].school);
    expect(md).toContain(p.projects[0].name);
    expect(md).toContain(p.skills[0].items[0]);
  });

  it.each(LOCALES)("puts every %s project with its category, role and detail sections in the markdown", (locale) => {
    const p = loadProfile(locale);
    const md = profileToMarkdown(p);
    expect(p.projects.length).toBeGreaterThan(0);
    for (const project of p.projects) {
      const block = md.slice(md.indexOf(`## Project: ${project.name}`)).split("\n## ")[0];
      expect(block).toContain(`Category: ${project.category}`);
      expect(block).toContain(`Role: ${project.role}`);
      for (const s of project.sections) {
        expect(block).toContain(`### ${s.title}`);
        for (const item of s.items) expect(block).toContain(`- ${item}`);
      }
    }
  });

  it.each(LOCALES)("gives every %s project a valid category and non-empty detail sections", (locale) => {
    for (const project of loadProfile(locale).projects) {
      expect(PROJECT_CATEGORIES).toContain(project.category);
      expect(project.sections.length).toBeGreaterThan(0);
      for (const s of project.sections) expect(s.items.length).toBeGreaterThan(0);
    }
  });

  it("builds a knowledge base per locale with shared doc chunks", () => {
    const fa = getKnowledge("fa");
    const en = getKnowledge("en");
    expect(fa.resume).toContain(loadProfile("fa").name);
    expect(en.resume).toContain(loadProfile("en").name);
    expect(en.chunks).toBe(fa.chunks);
    expect(new Set(fa.chunks.map((c) => c.source))).toEqual(new Set(loadDocs().map((d) => d.source)));
  });
});

describe("buildSystemPrompt", () => {
  const p = loadProfile();

  it("includes grounding rules, contact and the retrieved context", () => {
    const prompt = buildSystemPrompt(p, "RESUME TEXT", [{ source: "faq.md", heading: "Hours", text: "9 to 6" }]);
    expect(prompt).toContain(p.name);
    expect(prompt).toContain("ONLY using the resume and documents");
    expect(prompt).toContain("RESUME TEXT");
    expect(prompt).toContain(p.contact.email!);
    expect(prompt).toContain("[1] (faq.md > Hours)\n9 to 6");
  });

  it("says when nothing matched", () => {
    expect(buildSystemPrompt(p, "", [])).toContain("(no matching documents)");
  });
});
