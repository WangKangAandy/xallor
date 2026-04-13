import type { GridItemType } from "../components/desktopGridTypes";
import type { WidgetPageLayoutState } from "../components/widgets/layoutSchema";

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

/**
 * 多桌面中的一页：在 {@link GridPayload} 上增加稳定 `pageId`。
 * 用于列表 key 与后续删页/重排；勿用数组下标作 React key。
 */
export interface GridPagePayload extends GridPayload {
  pageId: string;
  /**
   * 阶段 B 并存字段：组件布局语义（x/y/w/h + 约束）。
   * 旧数据可缺省，读取时由 migration 从 items 补齐。
   */
  widgetLayout?: WidgetPageLayoutState;
}

/** 横向多桌面：每页为 {@link GridPagePayload}；activePageIndex 为当前可见页。 */
export interface MultiPageGridState {
  pages: GridPagePayload[];
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

