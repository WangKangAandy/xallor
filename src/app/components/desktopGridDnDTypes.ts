import type { Site } from "./desktopGridTypes";

/**
 * react-dnd 拖拽项在网格内的最小形状；`useGridDnD` / `DesktopGridItem` / 文件夹内拖拽共用。
 *
 * 字段消费约定：
 * - **id**：项标识；drop/hover 时与目标格比对。
 * - **type**：`site` | `folder` | `widget`（主网格）或 `folder-site`（从文件夹拖出）；`useGridItemDropTarget`
 *   在边区重排时若为本类型则跳过重排（避免与文件夹内站点逻辑冲突）。
 * - **index**：主网格项顺序；hover 边区重排时由目标格**就地改写**为当前 hover 下标。
 * - **sourceFolderId** + **site**：自文件夹拖到网格时由 `useGridDnD` 解析合并/落点。
 */
export type GridDnDDragItem = {
  id: string;
  type: string;
  index?: number;
  sourceFolderId?: string;
  site?: Site;
};
