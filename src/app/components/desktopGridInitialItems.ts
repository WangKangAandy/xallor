import type { GridItemType } from "./desktopGridTypes";
import type { GridPayload } from "../storage/types";
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
