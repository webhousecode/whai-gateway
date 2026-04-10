import { ollamaHealth, DEFAULT_MODEL } from '@/lib/ollama';

export const dynamic = 'force-dynamic';

export default async function StatusPage() {
  const health = await ollamaHealth();
  const modelLoaded = health.models.includes(DEFAULT_MODEL);

  return (
    <main className="mx-auto max-w-2xl p-10 font-mono">
      <h1 className="text-2xl font-bold">whai-gateway</h1>
      <p className="mt-2 text-zinc-400">WebHouse local LLM gateway</p>

      <div className="mt-8 rounded-lg border border-zinc-800 p-6">
        <div className="flex items-center justify-between">
          <span>Ollama</span>
          <span className={health.ok ? 'text-green-400' : 'text-red-400'}>
            {health.ok ? '● online' : '● offline'}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span>Default model</span>
          <span className={modelLoaded ? 'text-green-400' : 'text-yellow-400'}>
            {DEFAULT_MODEL} {modelLoaded ? '(loaded)' : '(not pulled)'}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span>URL</span>
          <span className="text-zinc-400">{health.url}</span>
        </div>
      </div>

      <div className="mt-6 text-sm text-zinc-500">
        <p>Endpoints (all require Bearer auth):</p>
        <ul className="mt-2 space-y-1">
          <li>GET /api/health</li>
          <li>POST /api/chat</li>
          <li>POST /api/generate</li>
          <li>POST /api/embed</li>
        </ul>
      </div>
    </main>
  );
}
