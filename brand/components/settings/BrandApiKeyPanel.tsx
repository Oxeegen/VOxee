import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2, X } from "lucide-react";
import ApiKeyInput from "@/components/ui/ApiKeyInput";
import { buildApiUrl } from "@/config/constants";
import { BRAND } from "@brand/config/brand";
import type { BrandRegionId } from "@brand/config/brand";
import RegionFlag from "@brand/components/ui/RegionFlag";
import {
  getOxeegenRegionKey,
  setOxeegenRegionKey,
  autoSelectRegionForUnsetScopes,
} from "./brandApiKey";

type Status = "idle" | "checking" | "valid" | "invalid";

/**
 * One API key field per Oxeegen region (US / EU). Each key is stored encrypted,
 * propagated to the scopes on that region, and validated against the region
 * endpoint's /models.
 */
function RegionKeyField({ region }: { region: BrandRegionId }) {
  const { t } = useTranslation();
  const endpoint = BRAND.regions[region].endpoint;

  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const reqRef = useRef(0);

  // Load the stored key on mount.
  useEffect(() => {
    let cancelled = false;
    void getOxeegenRegionKey(region).then((k) => {
      if (!cancelled) setApiKey(k);
    });
    return () => {
      cancelled = true;
    };
  }, [region]);

  const validate = useCallback(
    async (key: string) => {
      const trimmed = key.trim();
      if (!trimmed) {
        setStatus("idle");
        setError(null);
        return;
      }
      if (!endpoint) {
        setStatus("idle");
        return;
      }
      const reqId = ++reqRef.current;
      setStatus("checking");
      setError(null);
      try {
        const res = await fetch(buildApiUrl(endpoint, "/models"), {
          headers: { Authorization: `Bearer ${trimmed}` },
        });
        if (reqId !== reqRef.current) return;
        if (res.ok) {
          setStatus("valid");
          // Onboarding accelerator: auto-select this region for any scope that
          // has no provider chosen yet (leaves configured scopes untouched).
          void autoSelectRegionForUnsetScopes(region);
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
    [endpoint, region]
  );

  // Debounced persist + validate on change.
  useEffect(() => {
    const handle = setTimeout(() => {
      void setOxeegenRegionKey(region, apiKey);
      void validate(apiKey);
    }, 500);
    return () => clearTimeout(handle);
  }, [apiKey, region, validate]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-foreground">{BRAND.regions[region].label}</span>
        <RegionFlag region={region} className="w-4 h-3 shrink-0" />
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

/**
 * Dedicated panel with one API key per Oxeegen region. Each region's key
 * authenticates the scopes pointed at that region.
 */
export default function BrandApiKeyPanel() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
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

      <RegionKeyField region="us" />
      <RegionKeyField region="eu" />
    </div>
  );
}
