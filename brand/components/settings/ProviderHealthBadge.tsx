import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { buildApiUrl } from "@/config/constants";
import type { BrandRegionId } from "@brand/config/brand";
import { openApiKeySettings } from "@brand/utils/settingsNav";

type Health = "loading" | "ok" | "no-key" | "no-model" | "conn-ko" | "bad-key";

const BASE = "text-xs font-medium px-1.5 py-px rounded-sm inline-flex items-center gap-1";
const GREEN = "text-success bg-success/10 dark:bg-success/15";
const RED = "text-destructive bg-destructive/10 dark:bg-destructive/15";

/**
 * Live health of the selected provider for a scope: green when the endpoint
 * answers and a model is set; red (with a reason) otherwise. "Key missing" /
 * "Key rejected" on a region are clickable — they jump to the API Key screen
 * and highlight that region's field.
 */
export default function ProviderHealthBadge({
  endpoint,
  model,
  apiKey,
  region,
}: {
  endpoint: string;
  model: string;
  apiKey: string;
  region: BrandRegionId | "custom";
}) {
  const { t } = useTranslation();
  const [health, setHealth] = useState<Health>("loading");
  const reqRef = useRef(0);

  const check = useCallback(async () => {
    const reqId = ++reqRef.current;
    if (!apiKey.trim()) return setHealth("no-key");
    if (!model.trim()) return setHealth("no-model");
    if (!endpoint.trim()) return setHealth("conn-ko");
    setHealth("loading");
    try {
      const res = await fetch(buildApiUrl(endpoint, "/models"), {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      });
      if (reqId !== reqRef.current) return;
      if (res.ok) setHealth("ok");
      else if (res.status === 401 || res.status === 403) setHealth("bad-key");
      else setHealth("conn-ko");
    } catch {
      if (reqId === reqRef.current) setHealth("conn-ko");
    }
  }, [endpoint, model, apiKey]);

  useEffect(() => {
    const h = setTimeout(check, 400);
    return () => clearTimeout(h);
  }, [check]);

  if (health === "loading") {
    return (
      <span className={`${BASE} text-muted-foreground bg-muted/60 dark:bg-surface-3`}>
        <Loader2 className="w-3 h-3 animate-spin" />
      </span>
    );
  }

  const map: Record<
    Exclude<Health, "loading">,
    { label: string; tone: string; fixable?: boolean }
  > = {
    ok: { label: t("brand.health.ok", { defaultValue: "Connected" }), tone: GREEN },
    "no-key": {
      label: t("brand.health.noKey", { defaultValue: "Key missing" }),
      tone: RED,
      fixable: region !== "custom",
    },
    "no-model": {
      label: t("brand.health.noModel", { defaultValue: "No model" }),
      tone: RED,
    },
    "conn-ko": {
      label: t("brand.health.connKo", { defaultValue: "Connection failed" }),
      tone: RED,
    },
    "bad-key": {
      label: t("brand.health.badKey", { defaultValue: "Key rejected" }),
      tone: RED,
      fixable: region !== "custom",
    },
  };

  const cfg = map[health];
  if (cfg.fixable) {
    // This badge lives inside the selector row's <button>, so it must be a
    // span (no nested buttons) and must not bubble to the row's onSelect.
    const open = () => openApiKeySettings(region as BrandRegionId);
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          open();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            e.preventDefault();
            open();
          }
        }}
        className={`${BASE} ${cfg.tone} cursor-pointer hover:underline`}
      >
        {cfg.label}
      </span>
    );
  }
  return <span className={`${BASE} ${cfg.tone}`}>{cfg.label}</span>;
}
