import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ollamaHealth } from '@/lib/ollama';

export async function GET(req: NextRequest) {
  const unauth = requireAuth(req);
  if (unauth) return unauth;

  const health = await ollamaHealth();
  if (!health.ok) {
    return NextResponse.json(
      { error: 'ollama unavailable', code: 'OLLAMA_DOWN' },
      { status: 502 },
    );
  }
  return NextResponse.json({ models: health.models });
}
