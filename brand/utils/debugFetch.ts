import { DEBUG_MODE } from "@brand/config/debug";

/**
 * Renderer-side capture of model HTTP calls for the debug panel.
 *
 * Wraps window.fetch (debug mode only), redacts credential headers, and forwards
 * each exchange to the main process (which redacts again, persists, broadcasts).
 * Only model-ish endpoints are captured to keep the log signal-heavy.
 */

const MODEL_URL_HINTS = [
  "/chat/completions",
  "/audio/transcriptions",
  "/audio/speech",
  "/models",
  "/v1/",
];

const SENSITIVE_HEADER = /^(authorization|api-key|x-api-key|cookie|proxy-authorization)$/i;

function headersToObject(headers: HeadersInit | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  const assign = (k: string, v: string) => {
    out[k] = SENSITIVE_HEADER.test(k) ? "<redacted>" : v;
  };
  if (headers instanceof Headers) {
    headers.forEach((v, k) => assign(k, v));
  } else if (Array.isArray(headers)) {
    for (const [k, v] of headers) assign(k, v);
  } else {
    for (const [k, v] of Object.entries(headers)) assign(k, String(v));
  }
  return out;
}

function isModelUrl(url: string): boolean {
  return MODEL_URL_HINTS.some((hint) => url.includes(hint));
}

let installed = false;

export function installDebugFetch(): void {
  if (!DEBUG_MODE || installed) return;
  if (typeof window === "undefined" || typeof window.fetch !== "function") return;
  installed = true;

  const original = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    if (!isModelUrl(url)) {
      return original(input as RequestInfo, init);
    }

    const method =
      init?.method || (typeof input !== "string" && "method" in input ? input.method : "GET");
    const requestHeaders = headersToObject(init?.headers);
    const requestBody = typeof init?.body === "string" ? init.body : undefined;
    const started = Date.now();

    const send = (extra: Record<string, unknown>) => {
      try {
        (window.electronAPI as unknown as {
          httpDebugRecord?: (e: unknown) => void;
        })?.httpDebugRecord?.({
          timestamp: new Date().toISOString(),
          url,
          method,
          requestHeaders,
          requestBody,
          durationMs: Date.now() - started,
          ...extra,
        });
      } catch {
        // never let debug logging break a request
      }
    };

    try {
      const res = await original(input as RequestInfo, init);
      let responseBody: string | undefined;
      try {
        responseBody = await res.clone().text();
      } catch {
        responseBody = undefined;
      }
      send({ status: res.status, responseBody });
      return res;
    } catch (err) {
      send({ error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  };
}
