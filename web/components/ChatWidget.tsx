"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Dict } from "@/lib/i18n";
import type { ChatMessage, Locale } from "@/lib/types";

type Props = { t: Dict; lang: Locale; name: string; welcome: string; suggestions: string[] };

export default function ChatWidget({ t, lang, name, welcome, suggestions }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, loading, error]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setError(false);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, lang }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { reply } = await res.json();
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="no-print fixed bottom-5 start-5 z-50 flex flex-col items-start gap-3">
      {open && (
        <div
          role="dialog"
          aria-label={t.chatTitle}
          className="flex h-[min(600px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-sm border border-border bg-surface shadow-2xl shadow-black"
        >
          <div className="flex items-center gap-3 border-b border-border bg-canvas px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-accent font-display text-lg font-bold text-white">{name.trim().charAt(0)}</div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold text-heading">{t.chatTitle}</p>
              <p className="truncate text-xs text-muted">{t.chatSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.closeChat}
              className="p-1.5 text-muted transition hover:text-heading"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" data-testid="chat-messages">
            <Bubble role="assistant" content={welcome} />
            {messages.length === 0 && (
              <div className="flex flex-col items-start gap-2 pt-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-sm border border-border bg-surface-2 px-3 py-1.5 text-start text-sm text-body transition hover:border-accent hover:text-heading"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} content={m.content} />
            ))}
            {loading && (
              <div role="status" aria-label={t.typing} className="flex w-fit gap-1 rounded-sm bg-surface-2 px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="typing-dot h-2 w-2 rounded-full bg-muted" />
                ))}
              </div>
            )}
            {error && (
              <p role="alert" className="rounded-sm border border-accent-dim bg-accent-dim/30 px-3 py-2 text-sm text-red-300">
                {t.error}
              </p>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              aria-label={t.placeholder}
              maxLength={1000}
              className="min-w-0 flex-1 rounded-sm border border-border bg-surface-2 px-4 py-2.5 text-sm text-heading outline-none placeholder:text-muted focus:border-accent"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="label rounded-sm bg-accent px-4 text-xs text-white transition hover:bg-accent-dim disabled:opacity-40"
            >
              {t.send}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? t.closeChat : t.openChat}
        aria-expanded={open}
        title={t.askMe}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-accent bg-accent text-white shadow-lg shadow-black transition hover:bg-accent-dim"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
        </svg>
      </button>
    </div>
  );
}

function Bubble({ role, content }: ChatMessage) {
  const mine = role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        data-role={role}
        className={`chat-markdown max-w-[85%] rounded-sm px-4 py-2.5 text-sm leading-7 ${
          mine ? "bg-accent text-white" : "border border-border bg-surface-2 text-body"
        }`}
      >
        <ReactMarkdown
          components={{ a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a> }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
