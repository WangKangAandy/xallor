import type { GridItemType } from "./desktopGridTypes";
import type { GridPagePayload, GridPayload } from "../storage/types";
import { DEFAULT_FIRST_PAGE_ID, newPageId } from "../storage/pageIds";
import rawDefaultGrid from "../config/defaultGrid.json";
import { isValidGridPayload } from "../storage/repository";

const parsed: unknown = rawDefaultGrid;
if (!isValidGridPayload(parsed)) {
  throw new Error(
    "[xallor] defaultGrid.json 不符合 GridPayload 形状（需含 items 数组与 showLabels 布尔值）。",
  );
}

/** 首次加载 / 无持久化数据时的默认网格（来自内置 JSON，随扩展打包）。 */
export const DEFAULT_GRID_PAYLOAD: GridPayload = parsed;

export const DEFAULT_DESKTOP_GRID_ITEMS: GridItemType[] = DEFAULT_GRID_PAYLOAD.items;

/** 新建空白桌面（仅清空图标，保留 showLabels 默认开启）。 */
export function emptyGridPayload(): GridPayload {
  return { items: [], showLabels: true };
}

/** 新建一页（尾部追加）：带新生成的 `pageId`。 */
export function emptyGridPagePayload(): GridPagePayload {
  return { ...emptyGridPayload(), pageId: newPageId() };
}

/** 内置 JSON 首屏 + 稳定 fallback `pageId`（无持久化数据时使用）。 */
export function defaultFirstGridPagePayload(): GridPagePayload {
  return { ...DEFAULT_GRID_PAYLOAD, pageId: DEFAULT_FIRST_PAGE_ID };
}
