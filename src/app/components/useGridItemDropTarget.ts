import { useEffect, useRef, type RefObject } from "react";
import { useDrop } from "react-dnd";
import type { GridDnDDragItem } from "./desktopGridDnDTypes";
import { GRID_DND_CENTER_ZONE_MARGIN_RATIO, GRID_DND_MERGE_INTENT_DELAY_MS } from "./desktopGridConstants";
import { isCenterZone } from "./gridItemDnDHelpers";

/**
 * 边缘重排触发判定：不依赖“曾进入中心区”路径，避免用户轨迹差异导致偶发不触发。
 */
export function shouldTriggerEdgeReorder(args: {
  inCenterZone: boolean;
  draggedType: string;
  draggedIndex?: number;
  hoverIndex: number;
}) {
  const { inCenterZone, draggedType, draggedIndex, hoverIndex } = args;
  if (inCenterZone) return false;
  if (draggedType === "folder-site") return false;
  if (typeof draggedIndex === "number" && draggedIndex === hoverIndex) return false;
  return true;
}

export function useGridItemDropTarget(options: {
  ref: RefObject<HTMLDivElement | null>;
  itemId: string;
  index: number;
  onReorder: (draggedId: string, hoverId: string) => void;
  onHoverMergeIntent: (hoverId: string, draggedId: string) => void;
  onClearMergeIntent: (id?: string) => void;
  onDropItem: (draggedItem: GridDnDDragItem, hoverId: string, inCenterZone?: boolean) => void;
}) {
  const { ref, itemId, index, onReorder, onHoverMergeIntent, onClearMergeIntent, onDropItem } = options;

  const mergeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasEnteredCenterRef = useRef(false);

  const [{ isOver }, drop] = useDrop({
    accept: "ITEM",
    hover(draggedItem: GridDnDDragItem & { index?: number }, monitor) {
      if (!ref.current) return;
      if (draggedItem.id === itemId) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const inCenterZone = isCenterZone(hoverBoundingRect, clientOffset.x, clientOffset.y, GRID_DND_CENTER_ZONE_MARGIN_RATIO);

      if (inCenterZone) {
        hasEnteredCenterRef.current = true;
        if (!mergeTimerRef.current) {
          mergeTimerRef.current = setTimeout(() => {
            onHoverMergeIntent(itemId, draggedItem.id);
          }, GRID_DND_MERGE_INTENT_DELAY_MS);
        }
      } else {
        if (mergeTimerRef.current) {
          clearTimeout(mergeTimerRef.current);
          mergeTimerRef.current = null;
        }
        onClearMergeIntent(itemId);

        if (
          shouldTriggerEdgeReorder({
            inCenterZone,
            draggedType: draggedItem.type,
            draggedIndex: draggedItem.index,
            hoverIndex: index,
          })
        ) {
          onReorder(draggedItem.id, itemId);
          if (typeof draggedItem.index === "number") {
            draggedItem.index = index;
          }
        }
      }
    },
    drop(draggedItem: GridDnDDragItem, monitor) {
      if (mergeTimerRef.current) {
        clearTimeout(mergeTimerRef.current);
        mergeTimerRef.current = null;
      }
      hasEnteredCenterRef.current = false;
      if (draggedItem.id === itemId) return;

      let inCenter = false;
      if (ref.current) {
        const hoverBoundingRect = ref.current.getBoundingClientRect();
        const clientOffset = monitor.getClientOffset();
        if (clientOffset) {
          inCenter = isCenterZone(hoverBoundingRect, clientOffset.x, clientOffset.y, GRID_DND_CENTER_ZONE_MARGIN_RATIO);
        }
      }

      onDropItem(draggedItem, itemId, inCenter);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  useEffect(() => {
    if (!isOver) {
      if (mergeTimerRef.current) {
        clearTimeout(mergeTimerRef.current);
        mergeTimerRef.current = null;
      }
      onClearMergeIntent(itemId);
    }
  }, [isOver, itemId, onClearMergeIntent]);

  return { drop, isOver };
}
