import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadProfile } from "@/lib/content";
import { getKnowledge } from "@/lib/knowledge";
import { search } from "@/lib/rag";
import { POST } from "./route";

const req = (body: unknown) =>
  new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify(body) });

const okFetch = (content = "ok") => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content } }] }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "");
  });

  it("fails clearly without an API key", async () => {
    const res = await POST(req({ messages: [{ role: "user", content: "hi" }] }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/GEMINI_API_KEY, OPENAI_API_KEY or OPENROUTER_API_KEY/);
  });

  it("uses Gemini when GEMINI_API_KEY is set", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gem-key");
    vi.stubEnv("OPENAI_API_KEY", "oa-key");
    vi.stubEnv("OPENROUTER_API_KEY", "or-key");
    vi.stubEnv("GEMINI_MODEL", "");
    const fetchMock = okFetch();

    const res = await POST(req({ messages: [{ role: "user", content: "hi" }] }));
    expect(await res.json()).toEqual({ reply: "ok" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer gem-key");
    expect(JSON.parse(init.body).model).toBe("gemini-3.8-flash");
  });

  it("uses OpenAI after Gemini and before OpenRouter", async () => {
    vi.stubEnv("OPENAI_API_KEY", "oa-key");
    vi.stubEnv("OPENAI_MODEL", "oa-model");
    vi.stubEnv("OPENROUTER_API_KEY", "or-key");
    const fetchMock = okFetch();

    const res = await POST(req({ messages: [{ role: "user", content: "hi" }] }));
    expect(await res.json()).toEqual({ reply: "ok" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer oa-key");
    expect(JSON.parse(init.body).model).toBe("oa-model");
  });

  it("requires OPENAI_MODEL with an OpenAI key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "oa-key");
    vi.stubEnv("OPENAI_MODEL", "");
    const fetchMock = okFetch();
    const res = await POST(req({ messages: [{ role: "user", content: "hi" }] }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/OPENAI_MODEL/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid input", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test");
    expect((await POST(req({}))).status).toBe(400);
    expect((await POST(req({ messages: [] }))).status).toBe(400);
    expect((await POST(req({ messages: [{ role: "system", content: "x" }] }))).status).toBe(400);
    expect((await POST(req({ messages: [{ role: "user", content: "x" }], lang: "de" }))).status).toBe(400);
    expect((await POST(new Request("http://localhost/api/chat", { method: "POST", body: "not json" }))).status).toBe(400);
  });

  it("sends grounded context to OpenRouter and returns the reply", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubEnv("OPENROUTER_MODEL", "some/model");
    const fetchMock = okFetch("پاسخ آزمایشی");

    const { profile, resume, chunks } = getKnowledge("fa");
    const question = profile.chat.suggestions[1];
    const retrieved = search(chunks, question, 6);
    expect(retrieved.length).toBeGreaterThan(0);

    const history = Array.from({ length: 14 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `msg ${i}` }));
    history.push({ role: "user", content: question });
    const res = await POST(req({ messages: history }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reply: "پاسخ آزمایشی" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(init.headers).toEqual({ Authorization: "Bearer test-key", "Content-Type": "application/json" });
    const body = JSON.parse(init.body);
    expect(body.model).toBe("some/model");
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toContain(resume);
    expect(body.messages[0].content).toContain(retrieved[0].text);
    expect(body.messages).toHaveLength(11); // system + last 10
  });

  it("uses the profile of the requested language", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    const fetchMock = okFetch();
    await POST(req({ messages: [{ role: "user", content: "hi" }], lang: "en" }));
    const system = JSON.parse(fetchMock.mock.calls[0][1].body).messages[0].content;
    expect(system).toContain(loadProfile("en").name);
    expect(system).not.toContain(loadProfile("fa").name);
  });

  it("returns 502 when the model call fails", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("boom", { status: 401 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(req({ messages: [{ role: "user", content: "hi" }] }));
    expect(res.status).toBe(502);
  });
});
