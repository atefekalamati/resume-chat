export type Locale = "fa" | "en";

export const PROJECT_CATEGORIES = ["backend", "data", "ai", "strategy"] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export type Project = {
  name: string;
  category: ProjectCategory;
  period?: string;
  role: string;
  description: string;
  /** Details grouped by topic; each group is a dropdown under the project. */
  sections: { title: string; items: string[] }[];
  tech: string[];
  link?: string;
};

export type Profile = {
  locale: Locale;
  name: string;
  title: string;
  location?: string;
  photo?: string;
  /** Optional path of a resume PDF in public/, offered by the header's download button. */
  resumePdf?: string;
  summary: string;
  /** Optional big statement shown beside "About", one string per line. */
  headline?: string[];
  contact: { email?: string; linkedin?: string; github?: string; website?: string };
  about: string[];
  experience: { role: string; company: string; period: string; highlights: string[] }[];
  education: { degree: string; school: string; period: string }[];
  skills: { group: string; items: string[] }[];
  projects: Project[];
  /** Optional big numbers shown in the hero, e.g. years of experience. */
  stats?: { value: string; label: string }[];
  chat: { welcome: string; suggestions: string[] };
};

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type Chunk = { source: string; heading: string; text: string };
