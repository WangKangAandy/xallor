import { useCallback, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { GridItemType } from "./desktopGridTypes";
import type { GridDnDDragItem } from "./desktopGridDnDTypes";
import type { WidgetCompactionStrategy, WidgetConflictStrategy } from "./widgets/layoutSchema";
import { moveDraggedItemByDrop } from "./arrange/arrangeCommands";

export type MergeIntent = { targetId: string; draggedId: string };
type ReorderPolicy = {
  compactionStrategy: WidgetCompactionStrategy;
  conflictStrategy: WidgetConflictStrategy;
  pinnedItemIds?: Set<string>;
};

/** 与 hover 离开单元格时「清除合并意图」逻辑一致；供单测与 hook 共用。 */
export function resolveMergeIntentAfterClear(prev: MergeIntent | null, id?: string): MergeIntent | null {
  if (!id || prev?.targetId === id) return null;
  return prev;
}

export function reorderGridItems(items: GridItemType[], draggedId: string, hoverId: string): GridItemType[] {
  const dragIdx = items.findIndex((i) => i.id === draggedId);
  const hoverIdx = items.findIndex((i) => i.id === hoverId);
  if (dragIdx === -1 || hoverIdx === -1 || dragIdx === hoverIdx) return items;
  const next = [...items];
  const [removed] = next.splice(dragIdx, 1);
  next.splice(hoverIdx, 0, removed);
  return next;
}

export function reorderGridItemsByPolicy(
  items: GridItemType[],
  draggedId: string,
  hoverId: string,
  policy: ReorderPolicy,
): GridItemType[] {
  if (policy.compactionStrategy === "no-compact") return items;
  const pinnedIds = policy.pinnedItemIds ?? new Set<string>();
  if (pinnedIds.has(draggedId) || pinnedIds.has(hoverId)) {
    return items;
  }
  if (policy.conflictStrategy === "reject") return items;
  if (policy.conflictStrategy === "swap") {
    const dragIdx = items.findIndex((i) => i.id === draggedId);
    const hoverIdx = items.findIndex((i) => i.id === hoverId);
    if (dragIdx === -1 || hoverIdx === -1 || dragIdx === hoverIdx) return items;
    const next = [...items];
    [next[dragIdx], next[hoverIdx]] = [next[hoverIdx], next[dragIdx]];
    return next;
  }
  return reorderGridItems(items, draggedId, hoverId);
}

export function useGridDnD(
  setItems: Dispatch<SetStateAction<GridItemType[]>>,
  options?: {
    compactionStrategy?: WidgetCompactionStrategy;
    conflictStrategy?: WidgetConflictStrategy;
    pinnedItemIds?: Set<string>;
  },
) {
  const [mergeIntent, setMergeIntentState] = useState<MergeIntent | null>(null);
  const mergeIntentRef = useRef<MergeIntent | null>(null);
  const compactionStrategy = options?.compactionStrategy ?? "compact";
  const conflictStrategy = options?.conflictStrategy ?? "eject";
  const pinnedItemIds = options?.pinnedItemIds;

  const setMergeIntent = useCallback((intent: MergeIntent | null) => {
    mergeIntentRef.current = intent;
    setMergeIntentState(intent);
  }, []);

  const handleReorder = useCallback(
    (draggedId: string, hoverId: string) => {
      setItems((prev) =>
        reorderGridItemsByPolicy(prev, draggedId, hoverId, { compactionStrategy, conflictStrategy, pinnedItemIds }),
      );
    },
    [setItems, compactionStrategy, conflictStrategy, pinnedItemIds],
  );

  const handleHoverMergeIntent = useCallback(
    (hoverId: string, draggedId: string) => {
      setMergeIntent({ targetId: hoverId, draggedId });
    },
    [setMergeIntent],
  );

  const handleClearMergeIntent = useCallback((id?: string) => {
    setMergeIntentState((prev) => {
      const next = resolveMergeIntentAfterClear(prev, id);
      mergeIntentRef.current = next;
      return next;
    });
  }, []);

  const handleDropItem = useCallback(
    (draggedItem: GridDnDDragItem, targetId: string, inCenterZone?: boolean) => {
      const currentIntent = mergeIntentRef.current;

      const isIntentActive =
        currentIntent && currentIntent.targetId === targetId && currentIntent.draggedId === draggedItem.id;

      setItems((prev) =>
        moveDraggedItemByDrop(prev, draggedItem, targetId, {
          inCenterZone,
          shouldMerge: Boolean(isIntentActive || inCenterZone),
        }),
      );
      setMergeIntent(null);
    },
    [setItems, setMergeIntent],
  );

  return {
    mergeIntent,
    handleReorder,
    handleHoverMergeIntent,
    handleClearMergeIntent,
    handleDropItem,
  };
}
