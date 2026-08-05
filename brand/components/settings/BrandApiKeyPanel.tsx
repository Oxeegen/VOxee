import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2, X } from "lucide-react";
import ApiKeyInput from "@/components/ui/ApiKeyInput";
import { buildApiUrl } from "@/config/constants";
import { BRAND, getBrandModelConfig } from "@brand/config/brand";
import { useOxeegenApiKey } from "./brandApiKey";

type Status = "idle" | "checking" | "valid" | "invalid";

/**
 * Dedicated panel to enter the single organization API key shared by every
 * self-hosted scope (LLM + transcription). Validates the key against the brand
 * endpoint's /models and shows a green check when it works.
 */
export default function BrandApiKeyPanel() {
  const { t } = useTranslation();
  const { apiKey, setApiKey } = useOxeegenApiKey();
  const endpoint = getBrandModelConfig("dictationCleanup").endpoint;

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const reqRef = useRef(0);

  const validate = useCallback(
    async (key: string) => {
      const trimmed = key.trim();
      if (!trimmed) {
        setStatus("idle");
        setError(null);
        return;
      }
      const reqId = ++reqRef.current;
      setStatus("checking");
      setError(null);
      try {
        const res = await fetch(buildApiUrl(endpoint, "/models"), {
          headers: { Authorization: `Bearer ${trimmed}` },
        });
        if (reqId !== reqRef.current) return; // superseded by a newer check
        if (res.ok) {
          setStatus("valid");
        } else {
          setStatus("invalid");
          setError(`${res.status} ${res.statusText}`.trim());
        }
      } catch (e) {
        if (reqId !== reqRef.current) return;
        setStatus("invalid");
        setError((e as Error).message);
      }
    },
    [endpoint]
  );

  // Validate on mount (if a key already exists) and debounced on every change.
  useEffect(() => {
    const handle = setTimeout(() => validate(apiKey), 500);
    return () => clearTimeout(handle);
  }, [apiKey, validate]);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">
          {BRAND.modelBrandName} {t("common.apiKey")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("brand.apiKey.help", {
            defaultValue: "Sent as a Bearer token for authentication.",
          })}
        </p>
      </div>

      <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />

      {status !== "idle" && (
        <div className="flex items-center gap-1.5 text-xs">
          {status === "checking" && (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">
                {t("brand.apiKey.checking", { defaultValue: "Verifying…" })}
              </span>
            </>
          )}
          {status === "valid" && (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              <span className="text-success">
                {t("brand.apiKey.valid", { defaultValue: "Key verified" })}
              </span>
            </>
          )}
          {status === "invalid" && (
            <>
              <X className="w-3.5 h-3.5 text-destructive" />
              <span className="text-destructive">
                {error || t("brand.apiKey.invalid", { defaultValue: "Invalid key" })}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
