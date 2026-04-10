import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { ollamaChat } from '@/lib/ollama';
import { SYSTEM_PROMPTS, Task } from '@/lib/prompts';
import { logRequest, errorBody } from '@/lib/logger';

const GenerateSchema = z.object({
  prompt: z.string().min(1),
  task: z
    .enum(['alt_text', 'meta_description', 'slug', 'html_cleanup', 'css_snippet', 'blog_intro', 'raw'])
    .default('raw'),
  model: z.string().optional(),
  maxTokens: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const unauth = requireAuth(req);
  if (unauth) return unauth;

  const start = Date.now();
  const path = req.nextUrl.pathname;

  let parsed: z.infer<typeof GenerateSchema>;
  try {
    parsed = GenerateSchema.parse(await req.json());
  } catch (err) {
    logRequest({ method: 'POST', path, status: 400, latencyMs: Date.now() - start, ts: new Date().toISOString() });
    return NextResponse.json(errorBody('invalid request body', { code: 'VALIDATION_ERROR', detail: err instanceof z.ZodError ? err.issues : String(err) }), { status: 400 });
  }

  const { prompt, task, model, maxTokens } = parsed;
  const systemPrompt = SYSTEM_PROMPTS[task as Task] ?? SYSTEM_PROMPTS.raw;

  try {
    const upstream = await ollamaChat({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      maxTokens,
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      logRequest({ method: 'POST', path, status: 502, latencyMs: Date.now() - start, ts: new Date().toISOString() });
      return NextResponse.json(errorBody('upstream error', { code: 'OLLAMA_ERROR', detail }), { status: 502 });
    }

    const json = await upstream.json();
    const text: string = json.choices?.[0]?.message?.content ?? '';

    logRequest({ method: 'POST', path, status: 200, latencyMs: Date.now() - start, ts: new Date().toISOString() });
    return NextResponse.json({
      text: text.trim(),
      model: json.model,
      task,
      usage: json.usage,
    });
  } catch (err) {
    logRequest({ method: 'POST', path, status: 500, latencyMs: Date.now() - start, ts: new Date().toISOString() });
    return NextResponse.json(errorBody((err as Error).message, { code: 'INTERNAL_ERROR' }), { status: 500 });
  }
}
