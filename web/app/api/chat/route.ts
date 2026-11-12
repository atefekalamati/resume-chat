import { isLocale } from "@/lib/content";
import { getKnowledge } from "@/lib/knowledge";
import { buildSystemPrompt } from "@/lib/prompt";
import { search } from "@/lib/rag";
import type { ChatMessage } from "@/lib/types";

const MAX_MESSAGES = 10;
const MAX_LENGTH = 2000;

/** All providers speak the OpenAI chat completions API; checked in order Gemini, OpenAI, OpenRouter. */
function getProvider(): { url: string; key: string; model: string } | { error: string } {
  const env = process.env;
  if (env.GEMINI_API_KEY) {
    return {
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      key: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL || "gemini-3.8-flash",
    };
  }
  if (env.OPENAI_API_KEY) {
    if (!env.OPENAI_MODEL) return { error: "OPENAI_MODEL must be set when using OPENAI_API_KEY" };
    return { url: "https://api.openai.com/v1/chat/completions", key: env.OPENAI_API_KEY, model: env.OPENAI_MODEL };
  }
  if (env.OPENROUTER_API_KEY) {
    return {
      url: "https://openrouter.ai/api/v1/chat/completions",
      key: env.OPENROUTER_API_KEY,
      model: env.OPENROUTER_MODEL || "openrouter/auto",
    };
  }
  return { error: "Set GEMINI_API_KEY, OPENAI_API_KEY or OPENROUTER_API_KEY" };
}

export async function POST(request: Request) {
  const provider = getProvider();
  if ("error" in provider) {
    return Response.json({ error: provider.error }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const messages: ChatMessage[] | undefined = body?.messages;
  const lang = body?.lang ?? "fa";
  if (
    !isLocale(lang) ||
    !Array.isArray(messages) ||
    !messages.length ||
    messages.some((m) => !["user", "assistant"].includes(m?.role) || typeof m.content !== "string")
  ) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const recent = messages.slice(-MAX_MESSAGES).map((m) => ({ role: m.role, content: m.content.slice(0, MAX_LENGTH) }));
  const lastUser = [...recent].reverse().find((m) => m.role === "user")?.content ?? "";

  const { profile, resume, chunks } = getKnowledge(lang);
  const system = buildSystemPrompt(profile, resume, search(chunks, lastUser, 6));

  const res = await fetch(provider.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${provider.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: "system", content: system }, ...recent],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    console.error("LLM provider error", res.status, await res.text());
    return Response.json({ error: "Upstream model error" }, { status: 502 });
  }

  const data = await res.json();
  return Response.json({ reply: data.choices?.[0]?.message?.content ?? "" });
}
