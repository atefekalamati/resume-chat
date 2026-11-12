import type { Metadata } from "next";
import { Barlow_Condensed, DM_Sans, Vazirmatn } from "next/font/google";
import { notFound } from "next/navigation";
import { isLocale, loadProfile, LOCALES } from "@/lib/content";
import "../globals.css";

const vazirmatn = Vazirmatn({ variable: "--font-vazirmatn", subsets: ["arabic", "latin"] });
const barlow = Barlow_Condensed({ variable: "--font-barlow", subsets: ["latin"], weight: ["300", "400", "600", "700"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const profile = loadProfile(lang);
  return { title: `${profile.name} | ${profile.title}`, description: profile.summary };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html
      lang={lang}
      dir={lang === "fa" ? "rtl" : "ltr"}
      className={`${vazirmatn.variable} ${barlow.variable} ${dmSans.variable} antialiased`}
    >
      <body className="min-h-screen bg-canvas font-sans text-body">{children}</body>
    </html>
  );
}
