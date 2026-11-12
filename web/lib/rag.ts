import type { Chunk } from "./types";

const MAX_CHUNK = 800;

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ً-ْـ]/g, "") // Arabic diacritics and tatweel
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/‌/g, "");
}

const STOP_WORDS = new Set(
  (
    "the a an and or of to in on for is are was were be with at by from as it this that what who how which do does did " +
    "has have had his her she he they their about can you me my i " +
    "و در به از که این آن را با برای است هست بود های ها یک تا هم چه چی چیست کجا کی آیا او اش ایشان شما من می ای"
  ).split(" "),
);

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/** Split a markdown/text document into chunks by headings, then by paragraph if a section is long. */
export function chunkDocument(source: string, text: string): Chunk[] {
  const chunks: Chunk[] = [];
  let heading = "";
  let buffer: string[] = [];

  const flush = () => {
    const body = buffer.join("\n").trim();
    buffer = [];
    if (!body) return;
    let current = "";
    for (const para of body.split(/\n\s*\n/)) {
      if (current && current.length + para.length > MAX_CHUNK) {
        chunks.push({ source, heading, text: current.trim() });
        current = "";
      }
      current += para + "\n\n";
    }
    if (current.trim()) chunks.push({ source, heading, text: current.trim() });
  };

  for (const line of text.split("\n")) {
    const match = line.match(/^#{1,6}\s+(.*)/);
    if (match) {
      flush();
      heading = match[1].trim();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return chunks;
}

/** Rank chunks with BM25 against the query and return the top k with a positive score. */
export function search(chunks: Chunk[], query: string, k = 5): Chunk[] {
  const queryTerms = [...new Set(tokenize(query))];
  if (!queryTerms.length || !chunks.length) return [];

  const docs = chunks.map((c) => tokenize(`${c.heading} ${c.text}`));
  const avgLen = docs.reduce((s, d) => s + d.length, 0) / docs.length;
  const df = new Map<string, number>();
  for (const term of queryTerms) df.set(term, docs.filter((d) => d.some((t) => matches(t, term))).length);

  const k1 = 1.5;
  const b = 0.75;
  return docs
    .map((tokens, i) => {
      let score = 0;
      for (const term of queryTerms) {
        const tf = tokens.filter((t) => matches(t, term)).length;
        if (!tf) continue;
        const n = df.get(term)!;
        const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
        score += (idf * tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * tokens.length) / avgLen));
      }
      return { chunk: chunks[i], score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((r) => r.chunk);
}

/** Loose match so simple suffixes (plural "ها", "هایی", "s", possessive "ش") still count. */
function matches(token: string, term: string): boolean {
  if (token === term) return true;
  const [short, long] = token.length < term.length ? [token, term] : [term, token];
  return short.length >= 3 && long.length - short.length <= 3 && long.startsWith(short);
}
