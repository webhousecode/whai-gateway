# Claude Code handover — whai-gateway Phase 1

You are taking over a freshly scaffolded repo: `webhousecode/whai-gateway`. The full feature spec is in `webhousecode/cms/docs/features/F112-ai-fallback-gateway.md`. Read it before you start.

## Context

- Goal of Phase 1: get a working local LLM gateway running on Christian's Mac M1 using Gemma 4 E4B via Ollama, with a TypeScript Next.js API in front. This will become the fallback path for `@webhouse/cms` when Anthropic is down, and the cheap path for trivial generation tasks (alt-text, slugs, meta descriptions, HTML/CSS snippets).
- Stack rules (non-negotiable): pnpm + Turbo (this repo is single-package so no Turbo needed yet, but use pnpm), Next.js 16.1.6+, React 19.2.4+, TypeScript, Tailwind v4 (CSS-first config — no `tailwind.config.js`), shadcn/ui v4 only if you need anything beyond the existing status page, server-side components only, ES modules, `import` not `require`, dotenv for secrets.
- Dev environment: Mac M1, `~/.bashrc`, VS Code. Christian uses `term` as his shell wrapper.
- Cost rule: no API-heavy services. Everything local in Phase 1.

## What's already in place

A scaffold with:

- `package.json`, `tsconfig.json`, `next.config.ts`, `.env.example`, `.gitignore`
- `app/layout.tsx`, `app/page.tsx` (status page), `app/globals.css` (Tailwind v4 import only)
- `app/api/health/route.ts` — public, reports Ollama status + loaded models
- `app/api/chat/route.ts` — bearer-auth, OpenAI-compatible passthrough with optional streaming
- `app/api/generate/route.ts` — bearer-auth, task-templated simple generation
- `app/api/embed/route.ts` — bearer-auth, embeddings
- `lib/auth.ts` — bearer token check matching the dns-api pattern
- `lib/ollama.ts` — thin client around Ollama's OpenAI-compatible endpoints
- `lib/prompts.ts` — curated system prompts for `alt_text`, `meta_description`, `slug`, `html_cleanup`, `css_snippet`, `blog_intro`, `raw`
- `Dockerfile`, `docker-compose.m1.yml` (hybrid: Ollama on host), `docker-compose.linux.yml` (both in Docker, NVIDIA)
- `bench/prompts.json` (12 representative CMS prompts), `bench/run.ts` (latency + result dump)
- `README.md`

## Your tasks, in order

1. **Initialize the workspace**
   - `pnpm install`
   - Verify Tailwind v4 picks up `app/globals.css` correctly with no separate config file
   - Make sure `pnpm dev` starts the app on port 3399

2. **Verify Ollama is reachable**
   - Confirm `brew install ollama && brew services start ollama` is running on the Mac
   - `ollama pull gemma4:e4b`
   - Hit `http://localhost:11434/api/tags` to confirm the model shows up
   - Hit `http://localhost:3399/api/health` and confirm `modelLoaded: true`

3. **Smoke-test each endpoint with curl**
   - `/api/health` — no auth
   - `/api/generate` with each of the 7 tasks. Note any that produce noticeably bad output and add findings to `bench/notes.md`.
   - `/api/chat` with both `stream: false` and `stream: true`. Verify SSE streaming works end-to-end.
   - `/api/embed` — first `ollama pull nomic-embed-text`, then verify a 768-dim vector comes back.

4. **Build the Docker image and test the M1 hybrid setup**
   - `docker compose -f docker-compose.m1.yml up --build`
   - Confirm the container reaches host Ollama via `host.docker.internal:11434`
   - Re-run all curl tests against the containerized API

5. **Run the benchmark**
   - `WHAI_API_KEY=... pnpm bench`
   - Commit the first results file to `bench/results/`
   - Eyeball the outputs. Flag any task where E4B is clearly insufficient.

6. **Improvements you should make**
   - Add proper input validation (zod) on the POST routes
   - Add request logging with timestamps and latency
   - Add a `/api/models` endpoint that lists what's pulled in Ollama
   - Wire up structured error responses with consistent shape: `{ error: string, code?: string, detail?: unknown }`
   - Add a 60s timeout on all upstream Ollama calls
   - If the bench reveals quality issues for a specific task, tighten the system prompt in `lib/prompts.ts`

7. **Don't do (yet)**
   - Don't add image generation (FLUX) or voice (XTTS) — separate feature
   - Don't deploy to fly.io or any remote host — Phase 4
   - Don't integrate with `@webhouse/cms` yet — Phase 3, separate session
   - Don't add a database or persistent storage — gateway is stateless
   - Don't pull a larger Gemma 4 size on the M1 — E4B only

## Done criteria for Phase 1

- [ ] `pnpm dev` works on the M1, status page shows green
- [ ] All four endpoints respond correctly with curl
- [ ] Docker hybrid setup works end-to-end
- [ ] `pnpm bench` completes and writes a results file
- [ ] `bench/notes.md` exists with one paragraph per task type assessing quality
- [ ] README updated with anything you discovered the hard way

When done, report back with:
1. The bench summary (avg + p95 latency)
2. Which task types Gemma 4 E4B handled well
3. Which task types looked weak
4. Any surprises about the M1 hybrid setup
