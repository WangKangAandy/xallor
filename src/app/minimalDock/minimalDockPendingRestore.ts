import type { SiteItem } from "../components/desktopGridTypes";
import { MINIMAL_DOCK_PENDING_RESTORE_KEY } from "./minimalDockConstants";

function isSiteItem(v: unknown): v is SiteItem {
  if (!v || typeof v !== "object") return false;
  const o = v as SiteItem;
  return (
    o.type === "site" &&
    typeof o.id === "string" &&
    o.site &&
    typeof o.site === "object" &&
    typeof o.site.name === "string" &&
    typeof o.site.domain === "string" &&
    typeof o.site.url === "string"
  );
}

export function readPendingDockRestoreQueue(): SiteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(MINIMAL_DOCK_PENDING_RESTORE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSiteItem);
  } catch {
    return [];
  }
}

export function writePendingDockRestoreQueue(items: SiteItem[]): void {
  if (typeof window === "undefined") return;
  try {
    if (items.length === 0) {
      window.sessionStorage.removeItem(MINIMAL_DOCK_PENDING_RESTORE_KEY);
    } else {
      window.sessionStorage.setItem(MINIMAL_DOCK_PENDING_RESTORE_KEY, JSON.stringify(items));
    }
  } catch {
    /* ignore */
  }
}

export function appendToPendingDockRestoreQueue(items: SiteItem[]): void {
  const existing = readPendingDockRestoreQueue();
  const seen = new Set(existing.map((i) => i.id));
  const merged = [...existing];
  for (const it of items) {
    if (!seen.has(it.id)) {
      seen.add(it.id);
      merged.push(it);
    }
  }
  writePendingDockRestoreQueue(merged);
}
