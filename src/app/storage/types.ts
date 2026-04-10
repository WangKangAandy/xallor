import { GridItemType } from "../components/DesktopGridTypes";

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

