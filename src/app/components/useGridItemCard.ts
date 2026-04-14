import { useRef } from "react";
import type { GridItemType, GridShape } from "./desktopGridTypes";
import type { GridDnDDragItem } from "./desktopGridDnDTypes";
import { shapeToPixels } from "./resizePreview";
import { useFolderResize } from "./useFolderResize";
import { Z_GRID_ITEM_BASE, Z_GRID_ITEM_DRAGGING, Z_GRID_ITEM_MERGE_TARGET } from "./desktopGridLayers";
import { useGridItemDrag } from "./useGridItemDrag";
import { useGridItemDropTarget } from "./useGridItemDropTarget";

export type GridItemCardSharedCallbacks = {
  onReorder: (draggedId: string, hoverId: string) => void;
  onHoverMergeIntent: (hoverId: string, draggedId: string) => void;
  onClearMergeIntent: (id?: string) => void;
  onDropItem: (draggedItem: GridDnDDragItem, hoverId: string, inCenterZone?: boolean) => void;
  isMergeTarget: boolean;
  onResize: (id: string, newShape: GridShape) => void;
  onEnterArrangeMode?: () => void;
  isArrangeMode?: boolean;
  isArrangeSelected?: boolean;
  onArrangeToggleSelect?: () => void;
};

/**
 * 网格卡片共用：DnD ref 合并、缩放状态、格内尺寸与 z-index。
 * 供 GridSiteCard / GridFolderCard / GridWidgetCard 复用。
 */
export function useGridItemCard(
  item: GridItemType,
  index: number,
  callbacks: GridItemCardSharedCallbacks,
) {
  const { onReorder, onHoverMergeIntent, onClearMergeIntent, onDropItem, isMergeTarget, onResize, onEnterArrangeMode } = callbacks;
  const ref = useRef<HTMLDivElement>(null);

  const folderResize = useFolderResize({
    itemId: item.id,
    shape: item.shape,
    variant: item.type === "folder" ? "folder" : "widget",
    folderSiteCount: item.type === "folder" ? item.sites.length : 0,
    onResize,
  });

  const [{ isDragging }, drag] = useGridItemDrag({ item, index });
  const { drop } = useGridItemDropTarget({
    ref,
    itemId: item.id,
    index,
    onReorder,
    onHoverMergeIntent,
    onClearMergeIntent,
    onDropItem,
  });

  drag(drop(ref));

  const gridColumn = `span ${item.shape.cols}`;
  const gridRow = `span ${item.shape.rows}`;
  const opacity = isDragging ? 0.3 : 1;
  const zIndex = isMergeTarget ? Z_GRID_ITEM_MERGE_TARGET : isDragging ? Z_GRID_ITEM_DRAGGING : Z_GRID_ITEM_BASE;
  const targetSize = shapeToPixels(item.shape.cols, item.shape.rows);
  const renderSize = folderResize.resizePreview ?? targetSize;

  const showResizeChrome = (item.type === "folder" || item.type === "widget") && !isDragging;

  return {
    ref,
    isDragging,
    isMergeTarget,
    gridColumn,
    gridRow,
    opacity,
    zIndex,
    renderSize,
    showResizeChrome,
    folderResize,
    onEnterArrangeMode,
  };
}
