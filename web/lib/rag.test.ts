import { describe, expect, it } from "vitest";
import { chunkDocument, normalize, search, tokenize } from "./rag";

describe("normalize", () => {
  it("unifies Arabic letters, Persian digits and zero-width non-joiners", () => {
    expect(normalize("كتاب علي ۱۴۰۱")).toBe("کتاب علی 1401");
    expect(normalize("می‌خواهم")).toBe("میخواهم");
    expect(normalize("React")).toBe("react");
  });
});

describe("tokenize", () => {
  it("splits on punctuation and drops stop words in both languages", () => {
    expect(tokenize("سوابق کاری سارا چیست؟")).toEqual(["سوابق", "کاری", "سارا"]);
    expect(tokenize("What is her experience with Next.js?")).toEqual(["experience", "next", "js"]);
  });
});

describe("chunkDocument", () => {
  it("splits by headings and keeps the heading on each chunk", () => {
    const chunks = chunkDocument("a.md", "# Title\nintro\n\n## One\nfirst body\n\n## Two\nsecond body");
    expect(chunks).toEqual([
      { source: "a.md", heading: "Title", text: "intro" },
      { source: "a.md", heading: "One", text: "first body" },
      { source: "a.md", heading: "Two", text: "second body" },
    ]);
  });

  it("splits long sections by paragraph", () => {
    const para = "word ".repeat(100).trim();
    const chunks = chunkDocument("b.md", `## Long\n${para}\n\n${para}\n\n${para}`);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.heading === "Long")).toBe(true);
  });

  it("handles plain text without headings", () => {
    expect(chunkDocument("c.txt", "just text")).toEqual([{ source: "c.txt", heading: "", text: "just text" }]);
  });
});

describe("search", () => {
  const chunks = [
    { source: "x", heading: "Education", text: "MSc in software engineering from Amirkabir University" },
    { source: "x", heading: "Hobbies", text: "Hiking and landscape photography" },
    { source: "y", heading: "زبان‌ها", text: "فارسی و انگلیسی در سطح پیشرفته" },
    { source: "y", heading: "پروژه‌ها", text: "ساخت داشبوردها با Next.js" },
  ];

  it("returns the most relevant chunk first", () => {
    expect(search(chunks, "Which university did she study at?")[0].heading).toBe("Education");
    expect(search(chunks, "به چه زبان‌هایی مسلط است؟")[0].heading).toBe("زبان‌ها");
  });

  it("matches simple suffixes like plurals", () => {
    expect(search(chunks, "داشبورد")[0].heading).toBe("پروژه‌ها");
  });

  it("returns nothing for unrelated or empty queries", () => {
    expect(search(chunks, "quantum chromodynamics")).toEqual([]);
    expect(search(chunks, "؟")).toEqual([]);
  });

  it("limits results to k", () => {
    expect(search(chunks, "hiking photography software next", 2)).toHaveLength(2);
  });
});
