import { NextResponse } from 'next/server';
import { ollamaHealth, DEFAULT_MODEL } from '@/lib/ollama';

export async function GET() {
  const health = await ollamaHealth();
  return NextResponse.json({
    service: 'whai-gateway',
    ok: health.ok,
    ollama: health,
    defaultModel: DEFAULT_MODEL,
    modelLoaded: health.models.includes(DEFAULT_MODEL),
    timestamp: new Date().toISOString(),
  });
}
