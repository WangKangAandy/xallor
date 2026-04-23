import type { Site } from "../desktopGridTypes";
import type { PickLocalImageFailureReason } from "../../localUpload";
import type { AddableWidgetType } from "../widgets/addableWidgetTypes";
import type { MessageKey } from "../../i18n/messages";

/** 与预览面板「图标」四档一致；写入网格 `site.iconVariant`（可选）。 */
export type SiteIconVariantId = 0 | 1 | 2 | 3;
export type AddIconUploadFailureReason = PickLocalImageFailureReason;

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

export function toCustomIconFailureMessageKey(reason: AddIconUploadFailureReason): MessageKey | null {
  switch (reason) {
    case "no_file":
      return null;
    case "too_large":
      return "localUpload.errorTooLarge";
    case "bad_type":
    case "empty":
      return "localUpload.errorBadType";
    case "read_failed":
      return "localUpload.errorReadFailed";
    case "stored_too_large":
      return "localUpload.errorStoredTooLarge";
    default:
      return "localUpload.errorReadFailed";
  }
}
