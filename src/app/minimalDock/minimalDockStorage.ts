import { MINIMAL_DOCK_MAX_SLOTS, MINIMAL_DOCK_STORAGE_KEY } from "./minimalDockConstants";
import type { MinimalDockEntry, MinimalDockSiteEntry, MinimalDockStored } from "./minimalDockTypes";

/** 新装与清空后：Dock 仅承载站点，无默认系统项。 */
const EMPTY_DOCK: MinimalDockEntry[] = [];

function isMinimalDockStored(v: unknown): v is MinimalDockStored {
  if (!v || typeof v !== "object") return false;
  const o = v as MinimalDockStored;
  return o.version === 1 && Array.isArray(o.entries);
}

function isValidSiteEntry(e: unknown): e is MinimalDockSiteEntry {
  if (!e || typeof e !== "object") return false;
  const o = e as MinimalDockSiteEntry;
  if (o.kind !== "site") return false;
  const s = o.site;
  return (
    typeof o.id === "string" &&
    s &&
    typeof s === "object" &&
    typeof s.name === "string" &&
    typeof s.domain === "string" &&
    typeof s.url === "string"
  );
}

/**
 * 从存储读取 Dock：仅保留站点条目（迁移掉历史「设置 / 添加」系统槽）。
 */
export function readMinimalDockFromStorage(): MinimalDockEntry[] {
  if (typeof window === "undefined") return [...EMPTY_DOCK];
  try {
    const raw = window.localStorage.getItem(MINIMAL_DOCK_STORAGE_KEY);
    if (!raw) return [...EMPTY_DOCK];
    const parsed: unknown = JSON.parse(raw);
    if (!isMinimalDockStored(parsed)) return [...EMPTY_DOCK];
    const sitesOnly = parsed.entries.filter(isValidSiteEntry);
    return sitesOnly.slice(0, MINIMAL_DOCK_MAX_SLOTS);
  } catch {
    return [...EMPTY_DOCK];
  }
}

export function writeMinimalDockToStorage(entries: MinimalDockEntry[]): void {
  if (typeof window === "undefined") return;
  const sitesOnly = entries.filter(isValidSiteEntry).slice(0, MINIMAL_DOCK_MAX_SLOTS);
  const payload: MinimalDockStored = { version: 1, entries: sitesOnly };
  try {
    window.localStorage.setItem(MINIMAL_DOCK_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}
