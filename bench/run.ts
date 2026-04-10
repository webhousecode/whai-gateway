import 'dotenv/config';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const GATEWAY_URL = process.env.GATEWAY_URL ?? 'http://localhost:3399';
const API_KEY = process.env.WHAI_API_KEY;

if (!API_KEY) {
  console.error('WHAI_API_KEY is required');
  process.exit(1);
}

interface BenchPrompt {
  task: string;
  prompt: string;
}

interface BenchResult extends BenchPrompt {
  text: string;
  latencyMs: number;
  ok: boolean;
  error?: string;
}

async function runOne(p: BenchPrompt): Promise<BenchResult> {
  const start = Date.now();
  try {
    const r = await fetch(`${GATEWAY_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ prompt: p.prompt, task: p.task }),
    });
    const latencyMs = Date.now() - start;
    if (!r.ok) {
      return { ...p, text: '', latencyMs, ok: false, error: `HTTP ${r.status}` };
    }
    const data = await r.json();
    return { ...p, text: data.text, latencyMs, ok: true };
  } catch (err) {
    return {
      ...p,
      text: '',
      latencyMs: Date.now() - start,
      ok: false,
      error: (err as Error).message,
    };
  }
}

async function main() {
  const promptsPath = join(__dirname, 'prompts.json');
  const prompts: BenchPrompt[] = JSON.parse(readFileSync(promptsPath, 'utf-8'));

  console.log(`Running ${prompts.length} prompts against ${GATEWAY_URL}...\n`);

  const results: BenchResult[] = [];
  for (const p of prompts) {
    process.stdout.write(`  [${p.task}] `);
    const r = await runOne(p);
    results.push(r);
    console.log(r.ok ? `${r.latencyMs}ms` : `FAIL ${r.error}`);
  }

  const ok = results.filter((r) => r.ok);
  const avg = ok.length ? Math.round(ok.reduce((s, r) => s + r.latencyMs, 0) / ok.length) : 0;
  const p95 = ok.length
    ? ok.map((r) => r.latencyMs).sort((a, b) => a - b)[Math.floor(ok.length * 0.95)]
    : 0;

  console.log(`\nDone. ${ok.length}/${results.length} ok. avg=${avg}ms p95=${p95}ms`);

  const outDir = join(__dirname, 'results');
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  writeFileSync(
    join(outDir, `bench-${stamp}.json`),
    JSON.stringify({ gateway: GATEWAY_URL, avg, p95, results }, null, 2),
  );
  console.log(`Wrote bench/results/bench-${stamp}.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
