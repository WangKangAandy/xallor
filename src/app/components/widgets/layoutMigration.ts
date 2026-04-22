import type { GridItemType } from "../desktopGridTypes";
import type { WidgetLayout, WidgetPageLayoutState } from "./layoutSchema";

function nextRowY(rowStartY: number, rowItems: WidgetLayout[]): number {
  if (rowItems.length === 0) return rowStartY;
  const rowMaxH = Math.max(...rowItems.map((i) => i.h));
  return rowStartY + rowMaxH;
}

/**
 * 将 legacy `items[]` 按当前顺序映射为布局坐标。
 * 说明：
 * - 不改变业务项内容，仅生成与 id 对齐的 layout 记录；
 * - 先用简单行填充策略，后续可替换为更复杂 packing / 约束求解。
 */
export function migrateLegacyItemsToWidgetLayout(
  items: GridItemType[],
  options?: { columnCount?: number; pinnedIds?: Set<string> },
): WidgetPageLayoutState {
  const columnCount = Math.max(1, options?.columnCount ?? 8);
  const pinnedIds = options?.pinnedIds ?? new Set<string>();

  const layout: WidgetLayout[] = [];
  const widgets: string[] = [];

  let x = 0;
  let y = 0;
  let rowItems: WidgetLayout[] = [];

  for (const item of items) {
    const w = Math.max(1, item.shape.cols);
    const h = Math.max(1, item.shape.rows);

    if (x + w > columnCount) {
      y = nextRowY(y, rowItems);
      x = 0;
      rowItems = [];
    }

    const entry: WidgetLayout = {
      id: item.id,
      x,
      y,
      w,
      h,
      mode: pinnedIds.has(item.id) ? "pinned" : "floating",
      resizable: item.type !== "site",
    };
    layout.push(entry);
    widgets.push(item.id);
    rowItems.push(entry);
    x += w;
  }

  return {
    widgets,
    layout,
    compactionStrategy: "compact",
    conflictStrategy: "eject",
    autoCompactEnabled: true,
  };
}

