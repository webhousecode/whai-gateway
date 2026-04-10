import 'dotenv/config';
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.WHAI_API_KEY;

if (!API_KEY) {
  console.warn('[whai] WHAI_API_KEY is not set. All requests will be rejected.');
}

export function requireAuth(req: NextRequest): NextResponse | null {
  const header = req.headers.get('authorization');
  if (!API_KEY || header !== `Bearer ${API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
