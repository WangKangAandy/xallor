import { useDrag } from "react-dnd";
import type { GridItemType } from "./desktopGridTypes";

/**
 * 网格项拖拽源；与 {@link useGridItemDropTarget} 组合为 `drag(drop(ref))`（顺序勿改）。
 */
export function useGridItemDrag(params: { item: GridItemType; index: number }) {
  const { item, index } = params;
  return useDrag({
    type: "ITEM",
    item: { id: item.id, type: item.type, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
}
