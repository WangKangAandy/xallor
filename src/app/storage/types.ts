import type { GridItemType } from "../components/desktopGridTypes";

export const STORAGE_VERSION = 1;
export const ANONYMOUS_USER_ID = "anonymous";

export interface SearchEngineItem {
  id: string;
  name: string;
  domain: string;
  searchUrl: string;
}

export interface GridPayload {
  items: GridItemType[];
  showLabels: boolean;
}

/** 横向多桌面：每页一个 GridPayload；activePageIndex 为当前可见页。 */
export interface MultiPageGridState {
  pages: GridPayload[];
  activePageIndex: number;
}

export interface SearchPayload {
  engines: SearchEngineItem[];
  selectedEngineId: string;
}

export interface PersistedEnvelope<T> {
  version: number;
  userId: string;
  deviceId: string;
  updatedAt: number;
  payload: T;
}

