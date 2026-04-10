import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { ollamaEmbed } from '@/lib/ollama';
import { logRequest, errorBody } from '@/lib/logger';

const EmbedSchema = z.object({
  input: z.string().min(1),
  model: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const unauth = requireAuth(req);
  if (unauth) return unauth;

  const start = Date.now();
  const path = req.nextUrl.pathname;

  let parsed: z.infer<typeof EmbedSchema>;
  try {
    parsed = EmbedSchema.parse(await req.json());
  } catch (err) {
    logRequest({ method: 'POST', path, status: 400, latencyMs: Date.now() - start, ts: new Date().toISOString() });
    return NextResponse.json(errorBody('invalid request body', { code: 'VALIDATION_ERROR', detail: err instanceof z.ZodError ? err.issues : String(err) }), { status: 400 });
  }

  try {
    const embedding = await ollamaEmbed(parsed.input, parsed.model);
    logRequest({ method: 'POST', path, status: 200, latencyMs: Date.now() - start, ts: new Date().toISOString() });
    return NextResponse.json({ embedding, dim: embedding.length });
  } catch (err) {
    logRequest({ method: 'POST', path, status: 500, latencyMs: Date.now() - start, ts: new Date().toISOString() });
    return NextResponse.json(errorBody((err as Error).message, { code: 'INTERNAL_ERROR' }), { status: 500 });
  }
}
