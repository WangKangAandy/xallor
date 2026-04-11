/**
 * 持久化读写：只处理序列化数据与校验，不渲染 UI。
 * 加载中 / 失败 / 空状态由 React 展示层统一处理（例如 `src/app/components/feedback/RemoteContentPlaceholder.tsx`）。
 */
import { readStorageKey, writeStorageKey, getOrCreateDeviceId } from "./adapter";
import {
  ANONYMOUS_USER_ID,
  GridPayload,
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

export function isValidMultiPageGridState(value: unknown): value is MultiPageGridState {
  if (!value || typeof value !== "object") return false;
  const o = value as MultiPageGridState;
  if (!Array.isArray(o.pages) || o.pages.length === 0) return false;
  if (!Number.isInteger(o.activePageIndex) || o.activePageIndex < 0 || o.activePageIndex >= o.pages.length) {
    return false;
  }
  return o.pages.every((p) => isValidGridPayload(p));
}

function clampMultiPageGridState(state: MultiPageGridState): MultiPageGridState {
  const last = Math.max(0, state.pages.length - 1);
  return {
    ...state,
    activePageIndex: Math.min(Math.max(0, state.activePageIndex), last),
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
  if (envMulti && isValidMultiPageGridState(envMulti.payload)) {
    return clampMultiPageGridState(envMulti.payload);
  }

  const rawLegacy = await readStorageKey<PersistedEnvelope<unknown>>(GRID_KEY);
  const envLegacy = migrateEnvelope<GridPayload>(rawLegacy);
  if (envLegacy && isValidGridPayload(envLegacy.payload)) {
    return {
      pages: [envLegacy.payload],
      activePageIndex: 0,
    };
  }

  return fallback;
}

export async function saveMultiPageGridState(state: MultiPageGridState): Promise<void> {
  const safe = clampMultiPageGridState(state);
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

