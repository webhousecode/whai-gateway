import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ollamaChat } from '@/lib/ollama';

/**
 * OpenAI-compatible chat completions passthrough.
 * Body: { model?, messages, temperature?, max_tokens?, stream? }
 */
export async function POST(req: NextRequest) {
  const unauth = requireAuth(req);
  if (unauth) return unauth;

  try {
    const body = await req.json();
    const stream = Boolean(body.stream);

    const upstream = await ollamaChat({
      model: body.model,
      messages: body.messages,
      temperature: body.temperature,
      maxTokens: body.max_tokens,
      stream,
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json({ error: 'upstream error', detail: text }, { status: 502 });
    }

    if (stream && upstream.body) {
      return new Response(upstream.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const json = await upstream.json();
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
