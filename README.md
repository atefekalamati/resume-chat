# Resume Chat

A personal resume website (design: "Interactive Resume Site" Figma template) with an AI chat assistant that answers questions from your resume and documents (RAG via Google Gemini, OpenAI or OpenRouter).

## Use it for your own resume

1. Edit `web/content/profile.fa.json` and `web/content/profile.en.json` (same structure, one per language; served at `/en`, the default, and `/fa`): name, optional `photo`, experience, skills, projects, optional `headline`, chat welcome and suggestions.
2. Put any extra documents for the chatbot in `web/content/docs/` as `.md` or `.txt` files.

## Run

```bash
cd web
npm install
cp .env.example .env.local   # then set GEMINI_API_KEY, OPENAI_API_KEY + OPENAI_MODEL, or OPENROUTER_API_KEY
npm run dev                  # http://localhost:3000
```

## Test

```bash
npm test           # Vitest
npm run test:e2e   # Playwright (chat API is mocked, no key needed)
```
