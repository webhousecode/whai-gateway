# Claude Code handover — whai-gateway Phase 1 on Ubuntu

You are continuing Phase 1 of `webhousecode/whai-gateway` on an Ubuntu machine with NVIDIA GPU. The full feature spec is in `docs/F112-ai-fallback-gateway.md` and the original task list is in `CC-PROMPT.md`. Read both before starting.

## What's already done (on Mac M1)

- Repo scaffolded and pushed to `webhousecode/whai-gateway`
- `pnpm install` works, dev server starts on port 3399
- `.env.example` exists with correct structure
- Parse error in `lib/prompts.ts` fixed and committed (escaped quote in blog_intro)
- Ollama 0.20.5 confirmed working with gemma4:e4b (model pulled successfully)
- M1 had insufficient RAM (16 GB, too much running) to actually run inference — that's why we're here

## Your tasks

### 1. Set up the environment

```bash
# Clone repo
git clone https://github.com/webhousecode/whai-gateway.git
cd whai-gateway

# Install Node.js 22+ if needed (check with node -v)
# Install pnpm if needed: npm install -g pnpm

# Install deps
pnpm install

# Create .env
cat > .env << 'EOF'
WHAI_API_KEY=619a2e328e95b50684aca62ac895c5a30a74e6363aeea213872493f7808391ba
OLLAMA_URL=http://localhost:11434
DEFAULT_MODEL=gemma4:e4b
EOF
```

### 2. Install and start Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama (it auto-detects NVIDIA GPU)
ollama serve &
# or: systemctl start ollama

# Pull models
ollama pull gemma4:e4b
ollama pull nomic-embed-text

# Verify
curl -s http://localhost:11434/api/tags
```

### 3. Start dev server and smoke-test ALL endpoints

```bash
pnpm dev
```

Then test each endpoint:

```bash
KEY="619a2e328e95b50684aca62ac895c5a30a74e6363aeea213872493f7808391ba"

# Health (no auth)
curl -s http://localhost:3399/api/health | python3 -m json.tool

# Generate — test all 7 task types: alt_text, meta_description, slug, html_cleanup, css_snippet, blog_intro, raw
curl -s -X POST http://localhost:3399/api/generate \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A red bike leaning against a brick wall","task":"alt_text"}'

# Chat — non-streaming
curl -s -X POST http://localhost:3399/api/chat \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hello"}]}'

# Chat — streaming (verify SSE works)
curl -s -N -X POST http://localhost:3399/api/chat \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Count to 5"}],"stream":true}'

# Embed (requires nomic-embed-text)
curl -s -X POST http://localhost:3399/api/embed \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"input":"Hello world"}'
```

Note any tasks with noticeably bad output. Write findings to `bench/notes.md`.

### 4. Run the benchmark

```bash
WHAI_API_KEY=619a2e328e95b50684aca62ac895c5a30a74e6363aeea213872493f7808391ba pnpm bench
```

Commit the results file in `bench/results/`.

### 5. Implement improvements

- Add zod input validation on POST routes (`/api/generate`, `/api/chat`, `/api/embed`)
- Add request logging with timestamps and latency (console, structured JSON)
- Add `/api/models` endpoint — lists what's pulled in Ollama
- Consistent error response shape everywhere: `{ error: string, code?: string, detail?: unknown }`
- Add 60s timeout (`AbortSignal.timeout(60000)`) on all upstream Ollama fetch calls in `lib/ollama.ts`
- If the bench reveals quality issues, tighten system prompts in `lib/prompts.ts`

### 6. Don't do (yet)

- No Docker testing on this machine (we'll do that separately)
- No fly.io deploy — Phase 4
- No CMS integration — Phase 3
- No database/storage — gateway is stateless
- No larger model sizes — E4B only

## Done criteria

- [ ] `pnpm dev` works, status page shows green
- [ ] All four endpoints respond correctly with curl
- [ ] `pnpm bench` completes and writes a results file
- [ ] `bench/notes.md` exists with quality assessment per task type
- [ ] Improvements (zod, logging, /api/models, error shapes, timeouts) implemented
- [ ] All changes committed and pushed

## Report back with

1. Bench summary (avg + p95 latency)
2. Which task types Gemma 4 E4B handled well
3. Which looked weak
4. GPU info (nvidia-smi) and tok/s observed

---

## Start Claude Code

```bash
cd whai-gateway

# Install Claude Code if not already installed:
npm install -g @anthropic-ai/claude-code

# Run:
claude --dangerously-skip-permissions
```
