import type { Site } from "../desktopGridTypes";
import type { AddableWidgetType } from "../widgets/addableWidgetTypes";

/** 与预览面板「图标」四档一致；写入网格 `site.iconVariant`（可选）。 */
export type SiteIconVariantId = 0 | 1 | 2 | 3;

export type AddIconSubmitPayload =
  | { kind: "site"; site: Site }
  | { kind: "component"; widgetType: AddableWidgetType };

export function safeDomainFromUrl(urlStr: string, fallbackDomain: string): string {
  const trimmed = urlStr.trim();
  if (!trimmed) return fallbackDomain;
  try {
    const u = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    const host = u.hostname.replace(/^www\./i, "");
    return host || fallbackDomain;
  } catch {
    return fallbackDomain;
  }
}

export function normalizeSiteUrlInput(raw: string, fallbackUrl: string): string {
  const t = raw.trim();
  if (!t) return fallbackUrl;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}
