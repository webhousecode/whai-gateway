export interface RequestLog {
  method: string;
  path: string;
  status: number;
  latencyMs: number;
  ts: string;
}

export function logRequest(log: RequestLog) {
  console.log(JSON.stringify(log));
}

export interface ApiErrorBody {
  error: string;
  code?: string;
  detail?: unknown;
}

export function errorBody(error: string, opts?: { code?: string; detail?: unknown }): ApiErrorBody {
  return { error, code: opts?.code, detail: opts?.detail };
}
