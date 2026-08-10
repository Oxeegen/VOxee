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

export type RegionKeyStatus = "idle" | "checking" | "valid" | "invalid";

/**
 * One API key field for an Oxeegen region (US / EU). Stored encrypted,
 * propagated to the scopes on that region, and validated against the region
 * endpoint's /models. Reused by the settings API Key panel and the onboarding.
 */
export default function RegionKeyField({
  region,
  highlight,
  onStatusChange,
}: {
  region: BrandRegionId;
  highlight?: boolean;
  onStatusChange?: (status: RegionKeyStatus) => void;
}) {
  const { t } = useTranslation();
  const endpoint = BRAND.regions[region].endpoint;

  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<RegionKeyStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const reqRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  // When navigated here from a "Key missing" badge, scroll to and flash the field.
  useEffect(() => {
    if (!highlight) return;
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlash(true);
    const h = setTimeout(() => setFlash(false), 2500);
    return () => clearTimeout(h);
  }, [highlight]);

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
          // Auto-select this region for any scope with no provider chosen yet.
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
    <div
      ref={containerRef}
      className={`space-y-1.5 rounded-md transition-all ${
        flash ? "ring-2 ring-destructive/60 ring-offset-2 ring-offset-background p-2 -m-2" : ""
      }`}
    >
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
