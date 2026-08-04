import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface HttpExchange {
  id: string;
  timestamp?: string;
  method?: string;
  url?: string;
  status?: number;
  durationMs?: number;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  error?: string;
}

interface HttpDebugApi {
  httpDebugList?: () => Promise<HttpExchange[]>;
  httpDebugClear?: () => Promise<boolean>;
  onHttpDebugExchange?: (cb: (exchange: HttpExchange) => void) => (() => void) | void;
}

function api(): HttpDebugApi {
  return (window.electronAPI as unknown as HttpDebugApi) || {};
}

/** Live view of captured model HTTP exchanges (debug mode only). */
export default function DebugLogsPanel() {
  const [exchanges, setExchanges] = useState<HttpExchange[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api()
      .httpDebugList?.()
      .then((list) => {
        if (active && Array.isArray(list)) setExchanges(list.slice().reverse());
      })
      .catch(() => {});

    const dispose = api().onHttpDebugExchange?.((exchange) => {
      setExchanges((prev) => [exchange, ...prev].slice(0, 300));
    });

    return () => {
      active = false;
      if (typeof dispose === "function") dispose();
    };
  }, []);

  const clear = useCallback(() => {
    api()
      .httpDebugClear?.()
      .then(() => setExchanges([]))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">HTTP debug log</h3>
        <Button size="sm" variant="outline" onClick={clear} className="text-xs">
          Clear
        </Button>
      </div>

      {exchanges.length === 0 ? (
        <p className="text-xs text-muted-foreground">No exchanges captured yet.</p>
      ) : (
        <div className="space-y-1.5">
          {exchanges.map((ex) => {
            const isOpen = expanded === ex.id;
            const ok = typeof ex.status === "number" && ex.status < 400 && !ex.error;
            return (
              <div key={ex.id} className="border border-border rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : ex.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs hover:bg-muted/50"
                >
                  <span
                    className={`font-mono font-semibold ${ok ? "text-success" : "text-destructive"}`}
                  >
                    {ex.error ? "ERR" : ex.status}
                  </span>
                  <span className="font-mono text-muted-foreground">{ex.method}</span>
                  <span className="flex-1 truncate text-foreground">{ex.url}</span>
                  {typeof ex.durationMs === "number" && (
                    <span className="text-muted-foreground">{ex.durationMs}ms</span>
                  )}
                </button>
                {isOpen && (
                  <div className="border-t border-border/60 bg-muted/30 p-2.5 space-y-2 text-[11px] font-mono">
                    {ex.error && <div className="text-destructive">error: {ex.error}</div>}
                    {ex.requestHeaders && (
                      <pre className="whitespace-pre-wrap break-all text-muted-foreground">
                        {JSON.stringify(ex.requestHeaders, null, 2)}
                      </pre>
                    )}
                    {ex.requestBody && (
                      <div>
                        <div className="text-muted-foreground/70 uppercase tracking-wide mb-1">
                          request
                        </div>
                        <pre className="whitespace-pre-wrap break-all">{ex.requestBody}</pre>
                      </div>
                    )}
                    {ex.responseBody && (
                      <div>
                        <div className="text-muted-foreground/70 uppercase tracking-wide mb-1">
                          response
                        </div>
                        <pre className="whitespace-pre-wrap break-all">{ex.responseBody}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
