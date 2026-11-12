import { loadDocs, loadProfile, profileToMarkdown } from "./content";
import { chunkDocument } from "./rag";
import type { Chunk, Locale, Profile } from "./types";

let chunks: Chunk[] | null = null;
const profiles = new Map<Locale, { profile: Profile; resume: string }>();

/** The profile of each locale is always sent to the model; the docs are shared and chunked once per process. */
export function getKnowledge(locale: Locale = "fa") {
  chunks ??= loadDocs().flatMap((d) => chunkDocument(d.source, d.text));
  if (!profiles.has(locale)) {
    const profile = loadProfile(locale);
    profiles.set(locale, { profile, resume: profileToMarkdown(profile) });
  }
  return { ...profiles.get(locale)!, chunks };
}
