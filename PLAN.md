# PLAN

## 1. Scaffolding
- [x] Next.js (App Router, TypeScript, Tailwind) in `web/`
- [x] `.gitignore` ignores `.env*` except `.env.example`
- [x] Vitest and Playwright configured

## 2. Content
- [x] `content/profile.json` with realistic Persian sample data
- [x] `content/docs/` with FAQ, project details and interests

## 3. Resume page
- [x] Hero, about, experience, education, skills, projects, footer rendered from `profile.json`
- [x] `lang` / `dir` and font follow `locale`; logical CSS properties only
- [x] Responsive on desktop and mobile

## 4. RAG and API
- [x] Persian/English normalization and tokenization
- [x] Heading/paragraph chunking and BM25 retrieval
- [x] System prompt: full resume + retrieved chunks + grounding rules
- [x] `POST /api/chat` calls OpenRouter; clear errors for missing key, bad input, upstream failure

## 5. Chat widget
- [x] Floating button, welcome message, suggestions, typing indicator, error message, Markdown replies

## 6. Tests
- [x] Unit: rag, content, prompt, API route, ChatWidget (23 tests)
- [x] E2E: sections, open/close, send, suggestion, error, missing key (desktop + mobile, 12 tests)
- [x] `npm run build` succeeds with no warnings

## 7. Figma template and Gemini
- [x] UI restyled to the "Interactive Resume Site" Figma Make template (dark theme, sticky nav with active section, print to PDF, expandable timeline), RTL-safe
- [x] Chat widget matches the template
- [x] Gemini provider via its OpenAI-compatible endpoint, OpenRouter as fallback
- [x] Tests: 24 unit, 16 e2e; build with no warnings
