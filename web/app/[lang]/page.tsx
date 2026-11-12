import Image from "next/image";
import { notFound } from "next/navigation";
import ChatWidget from "@/components/ChatWidget";
import ProjectList from "@/components/ProjectList";
import SiteHeader from "@/components/SiteHeader";
import TimelineEntry from "@/components/TimelineEntry";
import { isLocale, loadProfile } from "@/lib/content";
import { dict } from "@/lib/i18n";

function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div className="mb-12 flex items-center gap-4">
      <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
      <h2 id={`${id}-title`} className="label text-sm text-accent">
        {children}
      </h2>
      <span className="h-px flex-1 bg-surface" aria-hidden />
    </div>
  );
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const profile = loadProfile(lang);
  const t = dict[lang];
  const other = lang === "fa" ? "en" : "fa";

  const links = [
    { label: "Email", value: profile.contact.email, href: profile.contact.email && `mailto:${profile.contact.email}` },
    { label: "LinkedIn", value: profile.contact.linkedin, href: profile.contact.linkedin },
    { label: "GitHub", value: profile.contact.github, href: profile.contact.github },
    { label: "Website", value: profile.contact.website, href: profile.contact.website },
  ].filter((l): l is { label: string; value: string; href: string } => Boolean(l.href));

  const sections = [
    { id: "about", label: t.about },
    { id: "experience", label: t.experience },
    { id: "education", label: t.education },
    { id: "skills", label: t.skills },
    { id: "projects", label: t.projects },
  ];

  return (
    <>
      <SiteHeader
        title={`${profile.name} — ${t.resume}`}
        sections={sections}
        downloadLabel={t.downloadPdf}
        preparingLabel={t.preparing}
        otherLocale={{ href: `/${other}`, lang: other, label: t.switchLang, name: t.switchLangLabel }}
        pdfHref={profile.resumePdf}
      />

      <header className="border-b border-surface px-5 pb-24 pt-32 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 flex flex-col-reverse items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {profile.location && <p className="label mb-4 text-xs text-accent">{profile.location}</p>}
              <h1 className="font-display text-[clamp(36px,6vw,64px)] font-light leading-tight text-heading sm:whitespace-nowrap">
                {profile.name}
              </h1>
              <span className="my-5 block h-px w-16 bg-accent" aria-hidden />
              <p className="space-y-1.5 font-display text-[clamp(16px,2vw,20px)] text-soft">
                {profile.title.split("|").map((part, i) => (
                  <span key={i} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                    {part.trim()}
                  </span>
                ))}
              </p>
            </div>
            {profile.photo && (
              <Image
                src={profile.photo}
                alt={profile.name}
                width={224}
                height={224}
                priority
                className="h-32 w-32 shrink-0 rounded-full border-2 border-accent object-cover p-1 sm:h-44 sm:w-44 md:h-52 md:w-52"
              />
            )}
          </div>
          <p className="mb-8 max-w-2xl text-sm leading-7 text-soft">{profile.summary}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noreferrer"
                aria-label={l.label}
                className="flex items-center gap-1.5 transition-colors hover:text-heading"
              >
                <span className="label text-xs text-accent">{l.label}</span>
                <span className="text-border">/</span>
                <span dir="ltr">{l.value.replace(/^(mailto:|https?:\/\/)(www\.)?/, "")}</span>
              </a>
            ))}
          </div>
          {profile.stats?.length ? (
            <dl className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-surface pt-8">
              {profile.stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse gap-2">
                  <dt className="label text-xs text-muted">{s.label}</dt>
                  <dd className="font-display text-[clamp(32px,6vw,56px)] font-bold leading-none text-heading">
                    <span dir="ltr">{s.value}</span>
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-32 sm:px-8">
        <section id="about" aria-labelledby="about-title" className="reveal border-b border-surface py-20">
          <SectionLabel id="about">{t.about}</SectionLabel>
          <div className={`grid grid-cols-1 gap-12 ${profile.headline?.length ? "md:grid-cols-[1fr_2fr]" : ""}`}>
            {profile.headline?.length ? (
              <p className="font-display text-4xl font-bold leading-tight text-heading">
                {profile.headline.map((line, i) => (
                  <span key={i} className={`block ${i % 2 ? "text-muted" : ""}`}>
                    {line}
                  </span>
                ))}
              </p>
            ) : null}
            <div className="space-y-4 text-sm leading-7 text-soft">
              {profile.about.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </section>

        <section id="experience" aria-labelledby="experience-title" className="reveal border-b border-surface py-20">
          <SectionLabel id="experience">{t.experience}</SectionLabel>
          {profile.experience.map((e, i) => (
            <TimelineEntry key={i} title={e.role} subtitle={e.company} period={e.period} details={e.highlights} expandLabel={t.expand} />
          ))}
        </section>

        <section id="education" aria-labelledby="education-title" className="reveal border-b border-surface py-20">
          <SectionLabel id="education">{t.education}</SectionLabel>
          {profile.education.map((e, i) => (
            <TimelineEntry key={i} title={e.degree} subtitle={e.school} period={e.period} expandLabel={t.expand} />
          ))}
        </section>

        <section id="skills" aria-labelledby="skills-title" className="reveal border-b border-surface py-20">
          <SectionLabel id="skills">{t.skills}</SectionLabel>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {profile.skills.map((group) => (
              <div key={group.group}>
                <h3 className="label mb-4 border-b border-surface-2 pb-2 text-xs text-accent">{group.group}</h3>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="text-sm text-soft">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="projects" aria-labelledby="projects-title" className="reveal py-20">
          <SectionLabel id="projects">{t.projects}</SectionLabel>
          <ProjectList
            projects={profile.projects}
            labels={{
              all: t.catAll,
              filter: t.filterProjects,
              list: t.projectList,
              role: t.role,
              view: t.viewProject,
              expand: t.expand,
              categories: { backend: t.catBackend, data: t.catData, ai: t.catAi, strategy: t.catStrategy },
            }}
          />
        </section>
      </main>

      <footer className="border-t border-surface px-8 py-8 text-center font-display text-xs tracking-wider text-[#333]">
        {profile.name} · {t.resume} · {t.builtWith}
      </footer>

      <ChatWidget t={t} lang={lang} name={profile.name} welcome={profile.chat.welcome} suggestions={profile.chat.suggestions} />
    </>
  );
}
