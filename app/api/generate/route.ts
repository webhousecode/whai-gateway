import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ollamaChat } from '@/lib/ollama';
import { SYSTEM_PROMPTS, Task } from '@/lib/prompts';

/**
 * Simplified generate endpoint for CMS task templates.
 * Body: { prompt: string, task?: Task, model?: string, maxTokens?: number }
 * Returns: { text: string, model: string, task: Task }
 */
export async function POST(req: NextRequest) {
  const unauth = requireAuth(req);
  if (unauth) return unauth;

  try {
    const { prompt, task = 'raw', model, maxTokens } = await req.json();

    if (typeof prompt !== 'string' || prompt.length === 0) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const systemPrompt = SYSTEM_PROMPTS[task as Task] ?? SYSTEM_PROMPTS.raw;

    const upstream = await ollamaChat({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      maxTokens,
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json({ error: 'upstream error', detail: text }, { status: 502 });
    }

    const json = await upstream.json();
    const text = json.choices?.[0]?.message?.content ?? '';

    return NextResponse.json({
      text: text.trim(),
      model: json.model,
      task,
      usage: json.usage,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
