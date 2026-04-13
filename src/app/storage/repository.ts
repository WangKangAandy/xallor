/**
 * 持久化读写：只处理序列化数据与校验，不渲染 UI。
 * 加载中 / 失败 / 空状态由 React 展示层统一处理（例如 `src/app/components/feedback/RemoteContentPlaceholder.tsx`）。
 */
import { readStorageKey, writeStorageKey, getOrCreateDeviceId } from "./adapter";
import { MAX_DESKTOP_PAGES } from "./multiPageLimits";
import { newPageId } from "./pageIds";
import { isValidWidgetLayout, resolveCompactionStrategy, resolveConflictStrategy } from "../components/widgets/layoutSchema";
import { migrateLegacyItemsToWidgetLayout } from "../components/widgets/layoutMigration";
import {
  ANONYMOUS_USER_ID,
  GridPayload,
  GridPagePayload,
  MultiPageGridState,
  PersistedEnvelope,
  SearchPayload,
  STORAGE_VERSION,
} from "./types";

const GRID_KEY = "xallor_grid_v1";
/** 多桌面状态（含多页网格）；优先于 legacy `GRID_KEY` 读取，写入时只写此键。 */
const MULTIPAGE_GRID_KEY = "xallor_multipage_grid_v1";
const SEARCH_KEY = "xallor_search_v1";

function createEnvelope<T>(payload: T): PersistedEnvelope<T> {
  return {
    version: STORAGE_VERSION,
    userId: ANONYMOUS_USER_ID,
    deviceId: getOrCreateDeviceId(),
    updatedAt: Date.now(),
    payload,
  };
}

function migrateEnvelope<T>(raw: PersistedEnvelope<unknown> | null): PersistedEnvelope<T> | null {
  if (!raw || typeof raw.version !== "number") return null;

  if (raw.version === STORAGE_VERSION) {
    return raw as PersistedEnvelope<T>;
  }

  // Migration hook placeholder: add future migrations here (v1 -> v2 -> ...).
  // Example:
  // if (raw.version === 1) {
  //   const v2Payload = migrateV1PayloadToV2(raw.payload);
  //   return { ...raw, version: 2, payload: v2Payload };
  // }
  return null;
}

/** 供内置 `defaultGrid.json` 与持久化载荷共用同一套形状校验。 */
export function isValidGridPayload(value: unknown): value is GridPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as GridPayload;
  return Array.isArray(payload.items) && typeof payload.showLabels === "boolean";
}

export function isValidGridPagePayload(value: unknown): value is GridPagePayload {
  if (!isValidGridPayload(value)) return false;
  const p = value as GridPayload & { pageId?: unknown; widgetLayout?: unknown };
  if (typeof p.pageId !== "string" || p.pageId.length === 0) return false;
  if (p.widgetLayout === undefined) return true;
  const l = p.widgetLayout as {
    widgets?: unknown;
    layout?: unknown;
    autoCompactEnabled?: unknown;
    compactionStrategy?: unknown;
    conflictStrategy?: unknown;
  };
  return (
    Array.isArray(l.widgets) &&
    Array.isArray(l.layout) &&
    l.widgets.every((id) => typeof id === "string") &&
    l.layout.every((entry) => isValidWidgetLayout(entry)) &&
    (l.autoCompactEnabled === undefined || typeof l.autoCompactEnabled === "boolean") &&
    (l.compactionStrategy === undefined || l.compactionStrategy === "compact" || l.compactionStrategy === "no-compact") &&
    (l.conflictStrategy === undefined || l.conflictStrategy === "swap" || l.conflictStrategy === "reject" || l.conflictStrategy === "eject")
  );
}

/**
 * 从磁盘原始 JSON 恢复多页状态：补齐缺失的 `pageId`、去重重号 id（旧数据迁移）。
 */
export function normalizeMultiPageGridPayload(raw: unknown): MultiPageGridState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { pages?: unknown[]; activePageIndex?: number };
  if (!Array.isArray(o.pages) || o.pages.length === 0) return null;
  const ai = o.activePageIndex;
  if (ai === undefined || !Number.isInteger(ai) || ai < 0 || ai >= o.pages.length) {
    return null;
  }
  const seen = new Set<string>();
  const pages: GridPagePayload[] = [];
  for (const p of o.pages) {
    if (!isValidGridPayload(p)) return null;
    const ext = p as GridPayload & { pageId?: unknown; widgetLayout?: unknown };
    let pageId = typeof ext.pageId === "string" && ext.pageId.length > 0 ? ext.pageId : newPageId();
    while (seen.has(pageId)) pageId = newPageId();
    seen.add(pageId);
    const page: GridPagePayload = { items: ext.items, showLabels: ext.showLabels, pageId };
    if ((ext as GridPagePayload).widgetLayout !== undefined) {
      page.widgetLayout = (ext as GridPagePayload).widgetLayout;
    }
    pages.push(page);
  }
  return { pages, activePageIndex: ai };
}

export function isValidMultiPageGridState(value: unknown): value is MultiPageGridState {
  if (!value || typeof value !== "object") return false;
  const o = value as MultiPageGridState;
  if (!Array.isArray(o.pages) || o.pages.length === 0) return false;
  if (!Number.isInteger(o.activePageIndex) || o.activePageIndex < 0 || o.activePageIndex >= o.pages.length) {
    return false;
  }
  return o.pages.every((p) => isValidGridPagePayload(p));
}

function clampMultiPageGridState(state: MultiPageGridState): MultiPageGridState {
  let { pages, activePageIndex } = state;
  if (pages.length > MAX_DESKTOP_PAGES) {
    pages = pages.slice(0, MAX_DESKTOP_PAGES);
    activePageIndex = Math.min(activePageIndex, pages.length - 1);
  }
  const last = Math.max(0, pages.length - 1);
  return {
    ...state,
    pages,
    activePageIndex: Math.min(Math.max(0, activePageIndex), last),
  };
}

function ensureWidgetLayoutOnPage(page: GridPagePayload): GridPagePayload {
  if (page.widgetLayout && isValidGridPagePayload(page)) {
    return {
      ...page,
      widgetLayout: {
        ...page.widgetLayout,
        compactionStrategy: resolveCompactionStrategy(page.widgetLayout),
        conflictStrategy: resolveConflictStrategy(page.widgetLayout),
      },
    };
  }
  return {
    ...page,
    widgetLayout: migrateLegacyItemsToWidgetLayout(page.items),
  };
}

function isValidSearchPayload(value: unknown): value is SearchPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as SearchPayload;
  return (
    Array.isArray(payload.engines) &&
    payload.engines.every(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.domain === "string" &&
        typeof item.searchUrl === "string",
    ) &&
    typeof payload.selectedEngineId === "string"
  );
}

function sanitizeSearchPayload(payload: SearchPayload, fallback: SearchPayload): SearchPayload {
  if (payload.engines.length === 0) return fallback;
  const hasSelected = payload.engines.some((item) => item.id === payload.selectedEngineId);
  if (hasSelected) return payload;
  return { ...payload, selectedEngineId: payload.engines[0].id };
}

export async function loadGridPayload(fallback: GridPayload): Promise<GridPayload> {
  const raw = await readStorageKey<PersistedEnvelope<unknown>>(GRID_KEY);
  const envelope = migrateEnvelope<GridPayload>(raw);
  if (!envelope || !isValidGridPayload(envelope.payload)) {
    return fallback;
  }
  return envelope.payload;
}

export async function saveGridPayload(payload: GridPayload): Promise<void> {
  await writeStorageKey(GRID_KEY, createEnvelope(payload));
}

/**
 * 读取多桌面状态：优先新键；若无则尝试 legacy 单页 `xallor_grid_v1` 并包成单页。
 */
export async function loadMultiPageGridState(fallback: MultiPageGridState): Promise<MultiPageGridState> {
  const rawMulti = await readStorageKey<PersistedEnvelope<unknown>>(MULTIPAGE_GRID_KEY);
  const envMulti = migrateEnvelope<MultiPageGridState>(rawMulti);
  if (envMulti?.payload !== undefined && envMulti.payload !== null) {
    const normalized = normalizeMultiPageGridPayload(envMulti.payload);
    if (normalized) {
      return clampMultiPageGridState({
        ...normalized,
        pages: normalized.pages.map((p) => ensureWidgetLayoutOnPage(p)),
      });
    }
  }

  const rawLegacy = await readStorageKey<PersistedEnvelope<unknown>>(GRID_KEY);
  const envLegacy = migrateEnvelope<GridPayload>(rawLegacy);
  if (envLegacy && isValidGridPayload(envLegacy.payload)) {
    const page: GridPagePayload = { ...envLegacy.payload, pageId: newPageId() };
    return {
      pages: [ensureWidgetLayoutOnPage(page)],
      activePageIndex: 0,
    };
  }

  return {
    ...fallback,
    pages: fallback.pages.map((p) => ensureWidgetLayoutOnPage(p)),
  };
}

export async function saveMultiPageGridState(state: MultiPageGridState): Promise<void> {
  const safe = clampMultiPageGridState({
    ...state,
    pages: state.pages.map((p) => ensureWidgetLayoutOnPage(p)),
  });
  if (!isValidMultiPageGridState(safe)) return;
  await writeStorageKey(MULTIPAGE_GRID_KEY, createEnvelope(safe));
}

export async function loadSearchPayload(fallback: SearchPayload): Promise<SearchPayload> {
  const raw = await readStorageKey<PersistedEnvelope<unknown>>(SEARCH_KEY);
  const envelope = migrateEnvelope<SearchPayload>(raw);
  if (!envelope || !isValidSearchPayload(envelope.payload)) {
    return fallback;
  }
  return sanitizeSearchPayload(envelope.payload, fallback);
}

export async function saveSearchPayload(payload: SearchPayload): Promise<void> {
  await writeStorageKey(SEARCH_KEY, createEnvelope(payload));
}

