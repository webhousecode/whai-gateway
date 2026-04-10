# whai-gateway

WebHouse local LLM gateway. A small TypeScript API in front of a self-hosted Gemma 4 model served by Ollama. Used by `@webhouse/cms` for cheap generation tasks and as a fallback when Anthropic is degraded.

See `docs/features/F112-ai-fallback-gateway.md` in `webhousecode/cms` for the full feature spec.

## Quick start — Mac M1 (hybrid)

Docker Desktop on Apple Silicon does **not** pass Metal through to containers. We therefore run Ollama natively on the host and only the API in Docker.

```bash
# 1. Install Ollama natively
brew install ollama
brew services start ollama
ollama pull gemma4:e4b

# 2. Configure the gateway
cp .env.example .env
# edit .env and set WHAI_API_KEY

# 3. Start the API in Docker
docker compose -f docker-compose.m1.yml up --build
```

Open `http://localhost:3399` to see the status page.

## Quick start — Ubuntu (NVIDIA GPU)

Both Ollama and the API run in Docker. Requires the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).

```bash
cp .env.example .env
# edit .env, set WHAI_API_KEY, and change OLLAMA_URL=http://ollama:11434

docker compose -f docker-compose.linux.yml up --build -d
docker exec -it whai-ollama ollama pull gemma4:e4b
```

## API

All endpoints require `Authorization: Bearer ${WHAI_API_KEY}`.

### `GET /api/health`

Reports Ollama status, loaded models, and whether the default model is pulled. No auth.

### `POST /api/generate`

Simplified task-based generation.

```bash
curl -X POST http://localhost:3399/api/generate \
  -H "Authorization: Bearer $WHAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "alt_text",
    "prompt": "A red mountain bike against a brick wall"
  }'
```

Available tasks: `alt_text`, `meta_description`, `slug`, `html_cleanup`, `css_snippet`, `blog_intro`, `raw`.

### `POST /api/chat`

OpenAI-compatible chat completions passthrough. Supports `stream: true`.

```bash
curl -X POST http://localhost:3399/api/chat \
  -H "Authorization: Bearer $WHAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "Write a haiku about Aalborg" }
    ]
  }'
```

### `POST /api/embed`

Embeddings via `nomic-embed-text` (must be pulled separately: `ollama pull nomic-embed-text`).

## Benchmark

```bash
WHAI_API_KEY=... pnpm bench
```

Runs `bench/prompts.json` against the gateway and writes timestamped results to `bench/results/`.
