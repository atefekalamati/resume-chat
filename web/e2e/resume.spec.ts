import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import profile from "../content/profile.fa.json" with { type: "json" };
import profileEn from "../content/profile.en.json" with { type: "json" };
import { dict } from "../lib/i18n";

function hasConfiguredApiKey(): boolean {
  try {
    const env = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    return /^(GEMINI|OPENAI|OPENROUTER)_API_KEY=\S+/m.test(env);
  } catch {
    return false;
  }
}

const mockChat = (page: Page, reply: (question: string) => string, status = 200) =>
  page.route("/api/chat", async (route) => {
    const { messages, lang } = route.request().postDataJSON();
    expect(lang).toBe("fa");
    await new Promise((r) => setTimeout(r, 300));
    await route.fulfill({ status, json: status === 200 ? { reply: reply(messages.at(-1).content) } : { error: "x" } });
  });

test.beforeEach(async ({ page }) => {
  await page.goto("/fa", { waitUntil: "networkidle" });
});

test("redirects / to the English site, with a switch to Persian", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.getByRole("link", { name: "فارسی" }).click();
  await expect(page).toHaveURL(/\/fa$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("switches to English and keeps the section hash", async ({ page }) => {
  await page.goto("/fa#projects");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en#projects$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(profileEn.name);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Open chat" }).click();
  const dialog = page.getByRole("dialog", { name: "AI Assistant" });
  await expect(dialog.getByText(profileEn.chat.welcome)).toBeVisible();
  await expect(dialog.getByLabel("Type your question...")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Send" })).toBeVisible();
  await expect(page.getByRole("link", { name: "فارسی" })).toHaveAttribute("href", "/fa");
});

test("renders every resume section from content", async ({ page }) => {
  await expect(page.locator("html")).toHaveAttribute("dir", profile.locale === "fa" ? "rtl" : "ltr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(profile.name);
  for (const part of profile.title.split("|")) await expect(page.getByText(part.trim(), { exact: true }).first()).toBeVisible();
  for (const e of profile.experience) await expect(page.getByText(e.company, { exact: true })).toBeVisible();
  for (const e of profile.education) await expect(page.getByText(e.school, { exact: true })).toBeVisible();
  for (const p of profile.projects) await expect(page.getByRole("heading", { name: p.name })).toBeVisible();
  await expect(page.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", profile.contact.github);
  await expect(page.getByRole("link", { name: "Email" })).toHaveAttribute("href", `mailto:${profile.contact.email}`);
});

test("expands an experience entry to show its highlights", async ({ page }) => {
  const first = profile.experience[0];
  const highlight = page.getByText(first.highlights[0]);
  await expect(highlight).toBeHidden();
  const toggle = page.getByRole("button", { name: first.role }).first();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(highlight).toBeVisible();
});

test.describe("projects", () => {
  const rows = (page: Page) => page.getByRole("list", { name: dict.fa.projectList }).locator(":scope > li");

  test("render as a numbered list with the first project expanded", async ({ page }) => {
    await expect(rows(page)).toHaveCount(profile.projects.length);
    await expect(rows(page).first()).toContainText("01");
    await expect(rows(page).first().getByText(profile.projects[0].sections[0].items[0])).toBeVisible();
    await expect(rows(page).nth(1).getByText(profile.projects[1].sections[0].items[0])).toBeHidden();
  });

  test("filter Data shows only data projects", async ({ page }) => {
    const dataCount = profile.projects.filter((p) => p.category === "data").length;
    expect(dataCount).toBeGreaterThan(0);
    const filter = page.getByRole("group", { name: dict.fa.filterProjects });
    await filter.getByRole("button", { name: dict.fa.catData }).click();
    await expect(filter.getByRole("button", { name: dict.fa.catData })).toHaveAttribute("aria-pressed", "true");
    await expect(filter.getByRole("button", { name: dict.fa.catAll })).toHaveAttribute("aria-pressed", "false");
    await expect(rows(page)).toHaveCount(dataCount);
    for (const row of await rows(page).all()) await expect(row).toHaveAttribute("data-category", "data");
  });

  test("expanding a project shows its role and detail dropdowns", async ({ page }) => {
    const project = profile.projects[1];
    const [first, second] = project.sections;
    const row = rows(page).nth(1);
    const toggle = row.getByRole("button", { name: project.name });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(row.getByText(project.role)).toBeVisible();
    for (const item of first.items) await expect(row.getByText(item)).toBeVisible();
    await expect(row.getByText(second.items[0])).toBeHidden();
    await row.getByText(second.title, { exact: true }).click();
    for (const item of second.items) await expect(row.getByText(item)).toBeVisible();
  });
});

test("shows the hero stats", async ({ page }) => {
  for (const s of profile.stats) await expect(page.getByText(s.label, { exact: true })).toBeVisible();
});

test("has section navigation and a PDF download button", async ({ page }) => {
  const download = page.getByRole("link", { name: "دانلود PDF" });
  await expect(download).toHaveAttribute("href", profile.resumePdf);
  await expect(download).toHaveAttribute("download", "");
  const res = await page.request.get(profile.resumePdf);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
  for (const id of ["about", "experience", "education", "skills", "projects"]) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
});

test("opens and closes the chat widget", async ({ page }) => {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: "باز کردن چت" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(profile.chat.welcome)).toBeVisible();
  await dialog.getByRole("button", { name: "بستن چت" }).click();
  await expect(dialog).toBeHidden();
});

test("asks a question and shows the answer with a typing indicator", async ({ page }) => {
  await mockChat(page, (q) => `پاسخ به: **${q}**`);
  await page.getByRole("button", { name: "باز کردن چت" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("سؤال خود را بنویسید...").fill("مهارت‌هایش چیست؟");
  await dialog.getByRole("button", { name: "ارسال" }).click();
  await expect(dialog.getByRole("status")).toBeVisible();
  await expect(dialog.locator("[data-role=assistant] strong")).toHaveText("مهارت‌هایش چیست؟");
  await expect(dialog.getByRole("status")).toBeHidden();

  await dialog.getByLabel("سؤال خود را بنویسید...").fill("و تحصیلاتش؟");
  await dialog.getByLabel("سؤال خود را بنویسید...").press("Enter");
  await expect(dialog.locator("[data-role=user]")).toHaveCount(2);
  await expect(dialog.locator("[data-role=assistant]")).toHaveCount(3); // welcome + 2 replies
});

test("sends a suggested question on click", async ({ page }) => {
  await mockChat(page, () => "سوابق کاری را در بخش بالا ببینید.");
  await page.getByRole("button", { name: "باز کردن چت" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: profile.chat.suggestions[0] }).click();
  await expect(dialog.locator("[data-role=user]")).toHaveText(profile.chat.suggestions[0]);
  await expect(dialog.getByText("سوابق کاری را در بخش بالا ببینید.")).toBeVisible();
  await expect(dialog.getByRole("button", { name: profile.chat.suggestions[1] })).toBeHidden();
});

test("shows a friendly error when the API fails", async ({ page }) => {
  await mockChat(page, () => "", 502);
  await page.getByRole("button", { name: "باز کردن چت" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("سؤال خود را بنویسید...").fill("سلام");
  await dialog.getByRole("button", { name: "ارسال" }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
});

test("the real API reports a missing key without breaking the page", async ({ request }) => {
  test.skip(hasConfiguredApiKey(), "a provider key is configured");
  const res = await request.post("/api/chat", { data: { messages: [{ role: "user", content: "hi" }] } });
  expect(res.status()).toBe(500);
});
