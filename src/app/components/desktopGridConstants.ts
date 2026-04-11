import type { GridShape } from "./desktopGridTypes";

/** 悬停中心区边距占格宽/高的比例；中心区内触发合并意图延迟，边区触发重排。 */
export const GRID_DND_CENTER_ZONE_MARGIN_RATIO = 0.2;
/** 进入中心区后触发 `onHoverMergeIntent` 的延迟（ms）。 */
export const GRID_DND_MERGE_INTENT_DELAY_MS = 300;

export const GRID_CELL_SIZE = 100;
export const GRID_GAP = 36;
export const GRID_STEP = GRID_CELL_SIZE + GRID_GAP;

/** 可选占位尺寸（后续「添加站点 / 形状选择」等 UI 可复用）。 */
export const AVAILABLE_GRID_SHAPES: GridShape[] = [
  { cols: 1, rows: 1 },
  { cols: 1, rows: 2 },
  { cols: 2, rows: 1 },
  { cols: 2, rows: 2 },
  { cols: 2, rows: 4 },
  { cols: 4, rows: 1 },
  { cols: 4, rows: 2 },
];
