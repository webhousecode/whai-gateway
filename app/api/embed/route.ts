import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ollamaEmbed } from '@/lib/ollama';

/**
 * Embeddings endpoint. Requires `nomic-embed-text` (or similar) pulled in Ollama.
 * Body: { input: string, model?: string }
 */
export async function POST(req: NextRequest) {
  const unauth = requireAuth(req);
  if (unauth) return unauth;

  try {
    const { input, model } = await req.json();
    if (typeof input !== 'string' || input.length === 0) {
      return NextResponse.json({ error: 'input is required' }, { status: 400 });
    }
    const embedding = await ollamaEmbed(input, model);
    return NextResponse.json({ embedding, dim: embedding.length });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
