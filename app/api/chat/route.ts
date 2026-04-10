import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { ollamaChat } from '@/lib/ollama';
import { logRequest, errorBody } from '@/lib/logger';

const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

const ChatSchema = z.object({
  messages: z.array(MessageSchema).min(1),
  model: z.string().optional(),
  temperature: z.number().optional(),
  max_tokens: z.number().int().positive().optional(),
  stream: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const unauth = requireAuth(req);
  if (unauth) return unauth;

  const start = Date.now();
  const path = req.nextUrl.pathname;

  let parsed: z.infer<typeof ChatSchema>;
  try {
    parsed = ChatSchema.parse(await req.json());
  } catch (err) {
    logRequest({ method: 'POST', path, status: 400, latencyMs: Date.now() - start, ts: new Date().toISOString() });
    return NextResponse.json(errorBody('invalid request body', { code: 'VALIDATION_ERROR', detail: err instanceof z.ZodError ? err.issues : String(err) }), { status: 400 });
  }

  const { messages, model, temperature, max_tokens, stream } = parsed;

  try {
    const upstream = await ollamaChat({
      model,
      messages,
      temperature,
      maxTokens: max_tokens,
      stream,
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      logRequest({ method: 'POST', path, status: 502, latencyMs: Date.now() - start, ts: new Date().toISOString() });
      return NextResponse.json(errorBody('upstream error', { code: 'OLLAMA_ERROR', detail }), { status: 502 });
    }

    if (stream && upstream.body) {
      logRequest({ method: 'POST', path, status: 200, latencyMs: Date.now() - start, ts: new Date().toISOString() });
      return new Response(upstream.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const json = await upstream.json();
    logRequest({ method: 'POST', path, status: 200, latencyMs: Date.now() - start, ts: new Date().toISOString() });
    return NextResponse.json(json);
  } catch (err) {
    logRequest({ method: 'POST', path, status: 500, latencyMs: Date.now() - start, ts: new Date().toISOString() });
    return NextResponse.json(errorBody((err as Error).message, { code: 'INTERNAL_ERROR' }), { status: 500 });
  }
}
