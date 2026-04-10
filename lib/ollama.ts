import 'dotenv/config';

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://host.docker.internal:11434';
export const DEFAULT_MODEL = process.env.DEFAULT_MODEL ?? 'gemma4:e4b';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

/**
 * Calls Ollama's OpenAI-compatible chat completions endpoint.
 * Returns the parsed JSON response when stream=false, or the raw Response
 * (with a streaming body) when stream=true so the caller can pipe it through.
 */
export async function ollamaChat(opts: ChatOptions): Promise<Response> {
  const body = {
    model: opts.model ?? DEFAULT_MODEL,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 1024,
    stream: opts.stream ?? false,
  };

  return fetch(`${OLLAMA_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function ollamaEmbed(input: string, model = 'nomic-embed-text'): Promise<number[]> {
  const r = await fetch(`${OLLAMA_URL}/v1/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input }),
  });
  if (!r.ok) throw new Error(`ollama embed failed: ${r.status}`);
  const data = await r.json();
  return data.data[0].embedding;
}

export async function ollamaHealth(): Promise<{ ok: boolean; models: string[]; url: string }> {
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (!r.ok) return { ok: false, models: [], url: OLLAMA_URL };
    const data = await r.json();
    return {
      ok: true,
      models: (data.models ?? []).map((m: { name: string }) => m.name),
      url: OLLAMA_URL,
    };
  } catch {
    return { ok: false, models: [], url: OLLAMA_URL };
  }
}
